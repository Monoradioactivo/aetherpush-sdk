# M2 brief: TurboModule rewrite (draft for review)

Status: proposal. The decisions marked "open" below are the maintainer's to make;
this document lays out the options so they can be decided against something concrete.

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
- No forced upgrade for consumers still on the bridge. See version support.

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

## The reflection problem, concretely

Today the Android restart path does roughly this: read the delegate off
`ReactHostImpl` by field name, overwrite its `jsBundleLoader` by field name, then
call `reactHost.reload()`. Two of those three steps depend on private field names.
The `getReactHostDelegate` fix (probe both `mReactHostDelegate` and
`reactHostDelegate`) keeps M1 working, but it is a patch on a fragile method.

M2 should answer one question per platform: is there a supported way to point an
existing `ReactHost` (Android) or `RCTHost` (iOS) at a new bundle and reload? If
yes, use it and delete the reflection. If no, the shim stays, but it becomes a
single isolated unit with a version probe, a fallback, and a test that fails
loudly when the internals move, instead of a swallowed exception.

## Version support

Open decision. Two workable shapes:

- Single package, runtime branch. One published package detects the architecture
  and RN version at runtime and picks the TurboModule or the bridge path. Simplest
  for consumers, heavier to maintain.
- Two majors. The bridge implementation stays on the current major for older RN,
  the TurboModule ships in a new major. Cleaner separation, but consumers on old
  RN never get M2 fixes unless backported.

The memory from 7A holds: there is no hard RN version cliff to gate on. The
interop layer is alive through 0.86 and no sunset has been announced, so M2 timing
is a product decision, not a forced one.

## Risks and open decisions

- Whether React Native actually exposes a supported bundle-swap and reload on the
  New Architecture. If it does not, M2 reduces the reflection to one shim but does
  not eliminate it. This needs a spike before committing to scope.
- Hermes bytecode handling on OTA bundles is unchanged by M2, but the smoke run is
  a reminder to keep releasing OTA bundles with the Hermes flag so they match the
  binary engine.
- The package-shape decision above changes the migration guide and the CI matrix,
  so it should be made first.

## Suggested first step

A short spike on one platform: add the Codegen spec, implement `restartApp`
and `getUpdateMetadata` as a TurboModule, and find out whether the bundle swap can
be done without reflection. That answers the biggest open risk before the full
rewrite is scoped.
