# @aetherpush/react-native-code-push

React Native client for [Aether](https://aetherpush.com), an over-the-air
update service compatible with the CodePush protocol. It lets you ship
JavaScript and asset changes to your iOS and Android apps without going through
the app stores.

This package is a drop-in replacement for `react-native-code-push` and
`@revopush/react-native-code-push`: the JavaScript API, native configuration
keys, and integration steps are unchanged. See [ATTRIBUTION.md](./ATTRIBUTION.md)
for the full lineage.

## Contents

- [What you can ship over the air](#what-you-can-ship-over-the-air)
- [Requirements](#requirements)
- [How it works](#how-it-works)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [The update lifecycle](#the-update-lifecycle)
- [JavaScript API](#javascript-api)
- [Native architecture](#native-architecture)
- [Releasing updates](#releasing-updates)
- [Server contract](#server-contract)
- [Development and testing](#development-and-testing)
- [Documentation index](#documentation-index)
- [License](#license)

## What you can ship over the air

An Aether release contains your app's JavaScript bundle and its bundled assets
(images, fonts, JSON). Anything that lives inside the JS bundle can change over
the air. Native code, native dependencies, and app permissions cannot, because
those are compiled into the binary the store already approved. When you change
native code you ship a new binary; when you change JS you ship an Aether release.

Each release targets a binary version range (for example `1.0.x`), so an update
only reaches the app builds it was written for. That range is how the SDK avoids
handing a JS bundle to a binary whose native side cannot run it.

## Requirements

- React Native 0.76 or newer, running the New Architecture (the default since
  0.76). Tested against 0.76 and 0.86, the latest stable at the time of writing.
- Apps on the legacy architecture (React Native 0.81 and earlier) should use
  Microsoft's original `react-native-code-push` SDK against Aether's legacy
  endpoints instead. See the Aether migration guide.

The SDK ships a New Architecture TurboModule on both platforms and keeps a
classic bridge path as a compile-time fallback, so it also builds for a consumer
who has explicitly opted out of the New Architecture. See
[Native architecture](#native-architecture).

## How it works

At startup the SDK decides which JavaScript bundle React Native should load. If a
downloaded update is installed and has been confirmed, it points React Native at
that bundle; otherwise it falls back to the bundle compiled into the binary.

From then on the flow is:

1. The app asks the server whether a newer release exists for its deployment key
   and binary version.
2. If one does, the SDK downloads it, verifies it, and unpacks it into private
   storage.
3. The update is installed according to an install mode, which decides when the
   app restarts onto the new bundle.
4. After the restart the app calls back to confirm the update is healthy. If it
   never confirms, the next restart rolls back to the previous bundle.

The check, download, install, and restart steps are the same on both platforms.
What differs is how each platform points React Native at the new bundle and how
it restarts, which is where the native architecture section goes into detail.

## Installation

```
npm install @aetherpush/react-native-code-push
```

On iOS, set `platform :ios, '15.5'` in your Podfile. The React Native templates
default to a lower version, and the SSZipArchive dependency of this pod requires
15.5. Then run `pod install`.

Follow the platform setup guides for the full integration:

- [iOS setup](./docs/setup-ios.md)
- [Android setup](./docs/setup-android.md)

## Configuration

### Deployment key

The deployment key tells the server which app and environment (Staging,
Production) the client belongs to. Every app version reads it from native
configuration.

On iOS, add the key to `Info.plist`:

```xml
<key>CodePushDeploymentKey</key>
<string>YOUR_DEPLOYMENT_KEY</string>
```

On Android, add the key to `strings.xml`:

```xml
<string moduleConfig="true" name="CodePushDeploymentKey">YOUR_DEPLOYMENT_KEY</string>
```

`Aether`-prefixed keys (`AetherDeploymentKey`, `AetherServerURL`,
`AetherPublicKey`) are accepted as aliases for the `CodePush`-prefixed ones. If
both are present, the `CodePush` key wins.

### Server URL

The SDK talks to `https://api.aetherpush.com` by default. To point at a
different server, for example a staging environment, set `CodePushServerURL`
(iOS) or `CodePushServerUrl` (Android).

### Server path mode

The `serverPathMode` option controls which URL paths the SDK uses:

- `"aether"` (default) uses Aether's canonical paths (`/v1/public/aether/*`).
- `"codepush-legacy"` uses the legacy CodePush paths
  (`/v0.1/public/codepush/*`). Use this when the server only speaks the legacy
  CodePush protocol. This mode is wire-compatible on a best-effort basis; it is
  not a support promise for arbitrary `code-push-server` deployments.

```js
export default CodePush({ serverPathMode: "codepush-legacy" })(App);
```

The mode is static configuration. The SDK never probes or falls back between
path styles at runtime.

### Code signing

If you release signed bundles, add the public key as `CodePushPublicKey`: in
`Info.plist` on iOS, in `strings.xml` on Android. The SDK then verifies the JWT
signature on each downloaded update and rejects a bundle that does not match.

## Usage

Wrap your root component. By default the app checks for updates on every start.

```js
import CodePush from "@aetherpush/react-native-code-push";

function App() {
  // ...
}

export default CodePush(App);
```

Pass options to change when it checks and how it installs:

```js
export default CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
})(App);
```

To drive updates yourself instead of on a schedule, set the frequency to
`MANUAL` and call `CodePush.sync()` when it suits your app, for example behind a
button or after a screen loads.

```js
export default CodePush({ checkFrequency: CodePush.CheckFrequency.MANUAL })(App);

// later, in your own code
CodePush.sync();
```

## The update lifecycle

### sync

`CodePush.sync()` runs the whole cycle: check, download, install, and report
progress. It is the call most apps use. It reports progress through an optional
status callback and resolves once the update is installed or the app is already
up to date.

```js
CodePush.sync(
  { installMode: CodePush.InstallMode.ON_NEXT_RESTART },
  (status) => {
    // status is a CodePush.SyncStatus value
  },
  ({ receivedBytes, totalBytes }) => {
    // download progress
  },
);
```

Two calls into `sync` never overlap. If you call it again while a sync is
running, the second call returns `SYNC_IN_PROGRESS` instead of starting a second
pass.

### Install modes

The install mode decides when the app moves onto the downloaded bundle. It is the
main knob for balancing freshness against interrupting the user.

- `IMMEDIATE` restarts the app as soon as the update is installed.
- `ON_NEXT_RESTART` waits for the user to close and reopen the app. Nothing
  restarts on its own. This is the default and the least disruptive.
- `ON_NEXT_RESUME` restarts the next time the app returns from the background.
- `ON_NEXT_SUSPEND` restarts while the app sits in the background, after a
  minimum background duration you can set.

Mandatory releases can carry their own install mode (`mandatoryInstallMode`), so
you can let optional updates wait while a critical fix installs right away.

### Rollback and the confirmation handshake

An install is not trusted until the new bundle proves it can start. After the
restart, the app must call `CodePush.notifyAppReady()` to confirm the update is
healthy. The `CodePush(App)` wrapper calls it for you once your root component
mounts.

If the app crashes or is killed before it confirms, the next launch treats the
update as bad and rolls back to the previous bundle. This is why the SDK loads
the confirmed bundle at startup rather than the most recently downloaded one. A
release that white-screens on launch backs itself out instead of bricking the
app.

You can inspect what is running with `CodePush.getUpdateMetadata()` and control
restarts by hand with `CodePush.allowRestart()`, `CodePush.disallowRestart()`,
and `CodePush.restartApp()`.

## JavaScript API

The full reference, including every option and type, is in
[docs/api-js.md](./docs/api-js.md). The surface in short:

| Function | Purpose |
| --- | --- |
| `CodePush(options)(App)` | Wrap the root component to check and install on a schedule |
| `sync(options, statusCb, progressCb)` | Run the full check, download, install cycle |
| `checkForUpdate(deploymentKey)` | Ask the server for a newer release without downloading it |
| `getUpdateMetadata(state)` | Read metadata for the running, pending, or latest package |
| `getCurrentPackage()` | Read the currently installed package (kept for compatibility) |
| `notifyAppReady()` | Confirm the running update is healthy and cancel the pending rollback |
| `restartApp(onlyIfUpdateIsPending)` | Restart the app, optionally only when an update is waiting |
| `allowRestart()` / `disallowRestart()` | Gate programmatic restarts around sensitive screens |
| `clearUpdates()` | Remove downloaded updates and return to the binary bundle |

### Enums

`InstallMode`: `IMMEDIATE`, `ON_NEXT_RESTART`, `ON_NEXT_RESUME`,
`ON_NEXT_SUSPEND`. These come from native constants so the JS and native sides
agree on the numbers.

`CheckFrequency`: `ON_APP_START` (0), `ON_APP_RESUME` (1), `MANUAL` (2).

`SyncStatus`, passed to the `sync` status callback: `UP_TO_DATE` (0),
`UPDATE_INSTALLED` (1), `UPDATE_IGNORED` (2), `UNKNOWN_ERROR` (3),
`SYNC_IN_PROGRESS` (4), `CHECKING_FOR_UPDATE` (5), `AWAITING_USER_ACTION` (6),
`DOWNLOADING_PACKAGE` (7), `INSTALLING_UPDATE` (8).

`UpdateState`, passed to `getUpdateMetadata`: `RUNNING`, `PENDING`, `LATEST`.

## Native architecture

This section is the technical core, and it is the part that changed most in the
move to the New Architecture (internally called M2).

### The typed contract

The JS-to-native boundary is a Codegen spec, `src/specs/NativeCodePush.ts`,
registered in `package.json` as `RNAetherCodePushSpec`. React Native's Codegen
turns that TypeScript interface into a generated native interface on each
platform. The native module implements the generated interface, so the method
names, argument types, and constants are checked by the compiler instead of
matched by hand at runtime.

Freezing this contract is the point of M2. A private field rename inside React
Native can break the small piece of code that reaches for it, but it can no
longer silently change the shape of the public API.

### How JavaScript resolves the module

`CodePush.js` resolves the native module through
`TurboModuleRegistry.get("CodePush")` and falls back to
`NativeModules.CodePush`. The first path is the TurboModule (JSI) binding on the
New Architecture; the second is the classic bridge, used when a consumer has
opted out of the New Architecture. Constants are read the same way: through the
generated `getConstants()` when it exists, and from the module object otherwise.

### Android

CodePush is a `BaseReactPackage`. Its `getModule` returns the TurboModule and its
`getReactModuleInfoProvider` marks CodePush as a TurboModule so the New
Architecture wires it through JSI.

The autolinking detail is the one that took real work. React Native's CLI only
emits the C++ TurboModule provider for a library when it can derive a
`libraryName` from the library's `codegenConfig`, and it does not derive one when
the library also supplies a custom `packageInstance`. CodePush used a custom
`packageInstance` because the package needed the deployment key at construction.
The fix was to make CodePush auto-instantiable: give it a no-arg constructor and
move context-dependent setup, including reading the deployment key from
`strings.xml`, into an `ensureInitialized(context)` step that runs when the
module is first created. With the custom `packageInstance` gone, `libraryName`
derives normally and the C++ provider is emitted, so `TurboModuleRegistry.get`
returns the module.

The native implementation is split by architecture using Gradle source sets. The
shared logic lives in one plain class, and two thin subclasses adapt it: one
extends the generated spec for the New Architecture, the other extends
`ReactContextBaseJavaModule` for the bridge. `build.gradle` selects the
`newarch` or `oldarch` source directory from the `IS_NEW_ARCHITECTURE_ENABLED`
flag, so each build compiles exactly one of them.

### iOS

On iOS the module implements `getTurboModule`, which returns a
`NativeCodePushSpecJSI`, the generated JSI binding. That method and the
conformance to the generated `NativeCodePushSpec` protocol are guarded by
`RCT_NEW_ARCH_ENABLED`, so the bridge build never sees them.

A few concrete details matter for anyone reading the source:

- `CodePush.m` is `CodePush.mm`, because the generated spec header is
  Objective-C++ and can only be imported from a `.mm`. The protocol conformance
  lives in a class extension inside the `.mm`, not in the shared header that
  plain `.m` files include.
- The generated JSI binding calls specific selectors. Promise methods use
  `resolve:`/`reject:` labels, and the enum-valued arguments (install mode,
  minimum background duration, update state) arrive as `double` and are cast back
  to the CodePush enums in the method bodies.
- The spec reads constants through `getConstants`, so the module implements it
  alongside the bridge's `constantsToExport`; both return the same enum map.
- `CPLog`, defined in the plain-C `CodePushUtils.m`, is declared with C linkage
  so the Objective-C++ `.mm` links against the unmangled symbol.

The reload path did not need reworking. iOS already reloads through a supported
API, with the bundle URL coming from CodePush, which is why `restartApp` worked
unchanged through the migration.

### The bridge fallback

Every New Architecture addition sits behind a compile-time flag
(`IS_NEW_ARCHITECTURE_ENABLED` on Android, `RCT_NEW_ARCH_ENABLED` on iOS), and
the podspec pulls the codegen dependencies through `install_modules_dependencies`
only when that helper exists, falling back to `React-Core` otherwise. The result
is one package that a New Architecture app runs as a TurboModule and a legacy app
still builds as a bridge module, with no change to the public integration.

## Releasing updates

Releases are managed with the [Aether CLI](https://github.com/Monoradioactivo/aether-cli).

Build and upload a JavaScript bundle for a platform:

```
aether release-react MyApp ios
aether release-react MyApp android -d Production
```

Useful flags:

- `-d, --deploymentName` picks the deployment (default `Staging`).
- `-t, --targetBinaryVersion` sets the binary version range the release applies
  to. Without it, the CLI reads the version from `Info.plist` or `build.gradle`.
- `-m, --mandatory` marks the release mandatory.
- `-r, --rollout` releases to a percentage of users.
- `-h, --useHermes` compiles the bundle to Hermes bytecode. Match the engine your
  binary uses, or the downloaded bundle will not load.

Manage deployments and releases:

```
aether deployment ls MyApp -k     # list deployments and their keys
aether promote MyApp Staging Production
aether rollback MyApp Production
aether patch MyApp Staging -r 50% # change rollout or metadata on the last release
```

## Server contract

The client speaks two endpoints, unchanged from the CodePush protocol:

- An update check that asks whether a newer release exists for a deployment key
  and binary version. The server answers with the release metadata and a
  download URL, or with "no update".
- A status report that records install and rollback telemetry, so a deployment's
  active and failed counts reflect what happened on devices.

The `serverPathMode` option chooses the path prefix for both, as described under
[Configuration](#server-path-mode). The request and response bodies are the same
across modes.

## Development and testing

The repository ships two sample apps under `samples/`, one on React Native 0.76
(`AetherSmoke076`) and one on 0.86 (`AetherSmoke086`). CI builds each on both
platforms, which is how the SDK stays honest about its supported range.

Build and run a sample:

```
cd samples/AetherSmoke076
npm install
npx pod-install ios        # iOS only
npm run ios                # or: npm run android
```

For an end-to-end check against a live server, including releasing an update and
watching it download, install, and restart, follow the
[runtime smoke runbook](./docs/runtime-smoke-runbook.md). To exercise switching
between deployments on a device, see the multi-deployment testing guides for
[iOS](./docs/multi-deployment-testing-ios.md) and
[Android](./docs/multi-deployment-testing-android.md).

## Documentation index

- [JS API reference](./docs/api-js.md)
- [iOS setup](./docs/setup-ios.md) and [Android setup](./docs/setup-android.md)
- [iOS native API](./docs/api-ios.md) and [Android native API](./docs/api-android.md)
- [Runtime smoke runbook](./docs/runtime-smoke-runbook.md)
- [Multi-deployment testing: iOS](./docs/multi-deployment-testing-ios.md) and
  [Android](./docs/multi-deployment-testing-android.md)
- [M2 TurboModule brief](./docs/m2-turbomodule-brief.md)

## License

MIT. This project descends from Microsoft's CodePush plugin for React Native by
way of RevoPush's New Architecture fork. The original copyright notice is
preserved in [LICENSE.md](./LICENSE.md) and the full provenance is recorded in
[ATTRIBUTION.md](./ATTRIBUTION.md).
