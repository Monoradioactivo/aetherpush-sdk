# M2 brief: TurboModule rewrite (draft for review)

Status: proposal with recommendations. Most of the earlier open questions are
resolved by reading the RN 0.76 API (see the bundle-swap section). One real trade
remains for the maintainer, called out under "Remaining judgment calls".

## Why M2

M1 shipped the fork on the classic bridge-era native module (`BaseJavaModule` on
Android, the `RCTBridgeModule` on iOS) and made it work across React Native
0.76 through 0.86. It works, but it reaches the New Architecture by reflecting on
private React Native internals rather than calling supported APIs.

The runtime smoke run made the cost concrete. `restartApp()` on the New
Architecture silently kept running the old bundle because the Android module
looked up the delegate field by the name `reactHostDelegate`, and RN 0.76 renamed
it to `mReactHostDelegate`. The lookup threw `NoSuchFieldException`, the code
swallowed it, and the reload used the stale bundle. A private field rename in a
minor React Native release broke a core SDK feature, and nothing failed loudly.

That is the pattern M2 should remove: the SDK depends on the shape of React
Native's internals, so every RN release is a chance for a silent break.

## Goals

- Replace the bridge module with a TurboModule (Codegen spec) so the JS-to-native
  boundary is typed and generated instead of hand-written.
- Freeze a versioned JS-to-native contract so the JS layer and the native layer
  can move independently as long as the contract holds.
- Reduce the reflection surface. Where React Native exposes a supported way to set
  the JS bundle and reload, use it. Where it does not, isolate the reflection
  behind one small, tested shim with an explicit fallback and a loud log.

## Non-goals

- No new product features. M2 is a structural change with the same observable
  behavior as M1.
- No change to the server contract. The `update_check` and `report_status`
  endpoints stay as they are.
- No forced upgrade for consumers still on the bridge. See the package shape below.

## The contract to freeze

The TypeScript surface consumers already use is the contract. The Codegen spec
should pin it: `sync`, `checkForUpdate`, `getUpdateMetadata`, `restartApp`,
`notifyApplicationReady`, the `serverPathMode` option, and the status and install
enums. The native side implements the generated interface. Once this is frozen,
a field rename inside React Native can only break the shim, not the public API,
and the shim is one file with a test.

## Migration approach

1. Add a Codegen spec (`NativeCodePush`) describing the current methods and types.
2. Implement the TurboModule on both platforms against that spec, keeping the
   existing update manager, telemetry, and storage code unchanged underneath.
3. Move bundle swapping and restart to supported APIs where they exist. On Android
   the reflection on `ReactHostImpl` and `DefaultReactHostDelegate` is the main
   target. Keep the bridge path for older RN as a fallback selected at runtime.
4. Keep both entry points during a transition window so a consumer can opt into
   the TurboModule without a breaking release.

## The reflection problem, and what the RN API actually allows

Today the Android restart path does roughly this: read the delegate off
`ReactHostImpl` by field name, overwrite its `jsBundleLoader` by field name, then
call `reactHost.reload()`. Two of those three steps depend on private field names.
The `getReactHostDelegate` fix (probe both `mReactHostDelegate` and
`reactHostDelegate`) keeps M1 working, but it is a patch on a fragile method.

The obvious next question is whether React Native exposes a supported way to point
an existing host at a new bundle and reload. Reading the RN 0.76 source answers it,
and the answer is different per platform.

On Android, the public `ReactHost` interface exposes `reload(reason)`, `start`,
`destroy`, and lifecycle hooks, but nothing to change the JS bundle. The loader
lives on the `ReactHostDelegate`, is set at construction, and `reload()` re-reads
it. There is no public bundle-swap in 0.76, which is exactly why the code reflects.
The RN source even points at an open proposal (issue #556) for a supported path.

On iOS the situation is better. `RCTHost` already exposes
`- (void)loadBundleAtURL:` and a bundle-URL provider block, and the current
`CodePush.m` reloads through `RCTTriggerReloadCommandListeners` with the bundle URL
coming from the host provider. That path is supported, not reflection, which is why
iOS `restartApp()` worked untouched during the smoke run.

So M2 does not need a spike to answer this. iOS is already on supported APIs.
Android is the platform with the real constraint.

## Recommended package shape

Ship one package that branches at runtime: detect the architecture and RN version,
then pick the TurboModule path or the bridge path. Consumers upgrade without
changing anything, which matters for a fork that wants adoption across a wide RN
range. The 7A finding still holds, there is no RN version cliff to gate on, so a
forced major bump plus backports would buy separation the project does not need.

The alternative, two major lines (bridge on the old major, TurboModule on a new
one), is cleaner to read but leaves old-RN consumers without M2 fixes unless
someone backports them. Prefer it only if maintaining both paths in one package
turns out to be genuinely painful.

## Android bundle swap: two options

Since RN 0.76 gives Android no supported swap, M2 has to choose how to handle it.

1. Isolate the reflection. Keep the delegate-field approach, but move it into one
   small unit with a version probe, an explicit fallback, and a test that fails
   loudly when a field moves, instead of a swallowed exception. Minimal change for
   consumers. Recommended for the M2 scope.
2. Ship a CodePush-aware `ReactHostDelegate` whose `jsBundleLoader` reads the
   current package path dynamically, and have consumers wire it in when they build
   their `ReactHost`. This removes the reflection entirely, at the cost of a small
   integration step in the host app. Worth doing later if RN does not land a
   supported API.

Recommendation: option 1 for M2 so the public integration stays unchanged, and
track issue #556 upstream. Revisit option 2 if the reflection keeps breaking on new
RN releases.

## Remaining judgment calls

- Option 1 vs option 2 above for Android. This is the one real trade, consumer
  simplicity against fully removing the reflection.
- Hermes bytecode on OTA bundles is unchanged by M2, but the smoke run is a reminder
  to keep releasing OTA bundles with the Hermes flag so they match the binary engine.

## Update: conversion attempted, and the real Android blocker

The Codegen spec landed and generates on both platforms. The next step, wiring
the Android native side to it as a real TurboModule, was attempted and it
surfaced a concrete blocker worth recording before anyone picks this up again.

All three layers were converted and they compile: `CodePushNativeModule` extends
the generated `NativeCodePushSpec` (constants moved to `getTypedExportedConstants`,
`int` params widened to `double`), the `CodePush` package became a
`BaseReactPackage` with `getModule` and `getReactModuleInfoProvider` (CodePush
marked `isTurboModule = true`), and `CodePush.js` resolves the module through
`TurboModuleRegistry.get` with a `NativeModules` fallback and reads constants via
`getConstants()`.

At runtime `TurboModuleRegistry.get("CodePush")` returns null and the app red
screens. The app's generated Android `autolinking_ModuleProvider` (C++) is empty,
so no JSI provider is registered for the SDK's codegen module. The cause is that
the SDK ships a custom `react-native.config.js` with an explicit
`packageInstance` (`CodePush.getInstance(R.string.CodePushDeploymentKey, ...)`),
which it needs because the package cannot be built with a no-arg constructor: it
requires the deployment key. That custom config routes the library through the
legacy autolinking path, which does not generate the New-Architecture codegen C++
provider.

So the real M2 problem on Android is not the spec or the module code. It is
reconciling CodePush's key-based package instantiation with codegen autolinking,
so the TurboModule provider actually gets registered. That is the piece to solve
first, and it needs someone comfortable in RN's New-Architecture autolinking.

## Suggested first step

Land the Codegen spec (`NativeCodePush`) and implement `restartApp` and
`getUpdateMetadata` as a TurboModule on both platforms, keeping the update manager,
telemetry, and storage code underneath unchanged. iOS reuses its supported reload
path directly. Android starts with the isolated-reflection shim (option 1). That
gives a working TurboModule build to measure against before committing to the full
port.
