# @aetherpush/react-native-code-push

React Native client for [Aether](https://aetherpush.com), an over-the-air
update service compatible with the CodePush protocol. It lets you deploy
JavaScript and asset changes to your iOS and Android apps without going
through the app stores.

This package is a drop-in replacement for `react-native-code-push` and
`@revopush/react-native-code-push`: the JavaScript API, native configuration
keys, and integration steps are unchanged. See [ATTRIBUTION.md](./ATTRIBUTION.md)
for the full lineage.

## Requirements

- React Native 0.76 or newer, running the New Architecture (the default since
  0.76). Tested against 0.76 and 0.86, the latest stable at the time of
  writing.
- Apps on the legacy architecture (React Native 0.81 and earlier) should use
  Microsoft's original `react-native-code-push` SDK against Aether's legacy
  endpoints instead. See the Aether migration guide.

## Installation

```
npm install @aetherpush/react-native-code-push
```

Then follow the platform setup guides:

- [iOS setup](./docs/setup-ios.md)
- [Android setup](./docs/setup-android.md)

The short version:

**iOS** — add your deployment key to `Info.plist`:

```xml
<key>CodePushDeploymentKey</key>
<string>YOUR_DEPLOYMENT_KEY</string>
```

**Android** — add your deployment key to `strings.xml`:

```xml
<string moduleConfig="true" name="CodePushDeploymentKey">YOUR_DEPLOYMENT_KEY</string>
```

`Aether`-prefixed keys (`AetherDeploymentKey`, `AetherServerURL`,
`AetherPublicKey`) are accepted as aliases for the `CodePush`-prefixed ones.
If both are present, the `CodePush` key wins.

The SDK talks to `https://api.aetherpush.com` by default. To point at a
different server (for example a staging environment), set `CodePushServerURL`
(iOS) or `CodePushServerUrl` (Android).

## Usage

```js
import CodePush from "@aetherpush/react-native-code-push";

function App() {
  // ...
}

export default CodePush(App);
```

By default the app checks for updates on every start. See the
[JS API reference](./docs/api-js.md) for `sync`, `checkForUpdate`, install
modes, and the rest of the API.

## Server path mode

The `serverPathMode` option controls which URL paths the SDK uses when talking
to the update server:

- `"aether"` (default) — Aether's canonical paths (`/v1/public/aether/*`).
- `"codepush-legacy"` — the legacy CodePush paths (`/v0.1/public/codepush/*`).
  Use this when pointing the SDK at a server that only speaks the legacy
  CodePush protocol. This mode is wire-compatible on a best-effort basis; it
  is not a support promise for arbitrary `code-push-server` deployments.

```js
export default CodePush({ serverPathMode: "codepush-legacy" })(App);
```

The mode is static configuration: the SDK never probes or falls back between
path styles at runtime.

## Releasing updates

Releases are managed with the [Aether CLI](https://github.com/Monoradioactivo/aether-cli):

```
aether release-react MyApp ios
aether release-react MyApp android -d Production
```

## License

MIT. This project descends from Microsoft's CodePush plugin for React Native
by way of RevoPush's New Architecture fork; the original copyright notice is
preserved in [LICENSE.md](./LICENSE.md) and the full provenance is recorded in
[ATTRIBUTION.md](./ATTRIBUTION.md).
