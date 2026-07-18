# Runtime smoke runbook

How to exercise `@aetherpush/react-native-code-push` end-to-end on a real iOS
simulator and Android emulator against a live Aether server. This is the manual
runtime check that CI cannot cover: CI compiles the sample apps in **Debug**,
which does not bundle JS, so JS resolution and the native update flow are never
executed there.

The `samples/AetherSmoke076` (RN 0.76.9) and `samples/AetherSmoke086` (RN 0.86.0)
apps expose buttons for `sync`, `sync` with `serverPathMode: 'codepush-legacy'`,
`checkForUpdate`, `getUpdateMetadata`, and `restartApp`, and print each result to
an on-screen log.

## 1. Prerequisites

| Tool | Notes |
| --- | --- |
| Xcode + iOS simulators | `xcode-select -p` must point at `Xcode.app`, not CommandLineTools |
| CocoaPods | `pod --version` |
| Android SDK + `cmdline-tools` | `sdkmanager`, `avdmanager` on PATH; an AVD created |
| JDK 17 | Gradle for RN 0.76/0.86 needs 17 — **not** 21/25/26. `JAVA_HOME` must point at a 17 JDK |
| Node + the `aether` CLI | `aether --version` |

The machine building these does **not** need to be the same one that ships M1 —
CI still builds the release matrix. This runbook is for local verification.

## 2. Create a staging app and deployment key

```bash
aether register --serverUrl https://api-staging.aetherpush.com   # first time only
aether login    --serverUrl https://api-staging.aetherpush.com
aether app add AetherSmoke
aether deployment list AetherSmoke --displayKeys
```

Use the **Staging** key below. Inject it locally and **do not commit it** — the
samples ship placeholders (`SmokePlaceholderKey`) on purpose:

- iOS: `samples/AetherSmoke076/ios/AetherSmoke076/Info.plist` → `CodePushDeploymentKey`
- Android: `samples/AetherSmoke076/android/app/src/main/res/values/strings.xml` → `CodePushDeploymentKey`

Both point at `https://api-staging.aetherpush.com` already.

## 3. Build and run the sample

The sample depends on the SDK via `file:../..`. Install first so the link and its
runtime deps exist, then run:

```bash
cd samples/AetherSmoke076
npm install

# iOS
(cd ios && pod install)
npx react-native run-ios --simulator "iPhone 17 Pro"

# Android (JDK 17 + ANDROID_HOME exported)
npx react-native run-android
```

> Metro must be able to follow the `file:../..` symlink, which points outside the
> project root. The committed `metro.config.js` watches the SDK root and pins
> `nodeModulesPaths`; `hoist-non-react-statics` (an SDK runtime dep npm does not
> materialize for a `file:` link) is added to the sample. Without these the app
> red-screens with "Unable to resolve module @aetherpush/react-native-code-push".

## 4. Basic smoke (no release needed)

Tap in the app and confirm the on-screen log:

| Button | Expected |
| --- | --- |
| Running package | `running: binary` |
| Check for update | `up to date` (no release yet) |
| Sync | `CHECKING_FOR_UPDATE` → `UP_TO_DATE` → `sync done: UP_TO_DATE` |
| Sync (legacy paths) | same flow, hitting `/v0.1/public/codepush/*` |
| Restart | app reloads, log clears |

To confirm the `serverPathMode` routing at the wire level:

- iOS: `xcrun simctl spawn booted log stream --predicate 'processImagePath CONTAINS "AetherSmoke076"'` and look for `.../v1/public/aether/update_check` (default) vs `.../v0.1/public/codepush/update_check` (legacy).
- Android: OkHttp does not log the URL; rely on the on-screen `UP_TO_DATE` (a wrong path would error).

## 5. Full OTA update (download → install → restart)

Release a bundle, then sync it in the app. The visible bundle swap only happens
in a **Release** build (Debug serves JS from Metro, which overrides CodePush):

```bash
# Optional: make a visible change first, e.g. edit the App.tsx title, so you can
# see the swap. Revert it after releasing so the binary keeps the old content.
aether release-react AetherSmoke android -d Staging -t 1.0 -h   # -h = Hermes bytecode
```

Then in the running app:

1. **Check for update** → `update available: <label>`
2. **Sync** → `DOWNLOADING_PACKAGE` (byte progress) → `INSTALLING_UPDATE` → `UPDATE_INSTALLED`
3. **Restart** (or cold restart) → the new bundle renders
4. **Running package** → `running: <label> (<hash>)`, no longer `binary`

## 6. Rollback

Prove the client auto-reverts a bad update:

1. Make `index.js` throw before `AppRegistry.registerComponent` (never calls
   `notifyApplicationReady`), release it as a new label, revert `index.js`.
2. In the app: **Sync** → `UPDATE_INSTALLED`, then cold restart. The app is stuck
   (the bundle throws on load).
3. Cold restart again. logcat shows
   `[CodePush] Update did not finish loading the last time, rolling back to a
   previous version` and loads the previous good bundle.

## 7. Automation and gotchas

- **Android taps** can be scripted: `adb shell input tap <x> <y>`. On a Pixel
  (1280×2856) the buttons sit at x≈640, y≈362 (Sync), 479 (legacy), 596 (check),
  714 (running), 831 (restart), 948 (clear).
- **iOS** has no built-in tap automation — drive the buttons by hand or use `idb`.
- **Never** `kill -9` a PID from `lsof -i:8081`: the Android emulator proxies 8081
  via `adb reverse`, so that kills the emulator (and loses un-flushed installs).
  Match the Metro process by name instead.
- A 16 KB page-size AVD (e.g. `android-37.1`) shows a per-launch "Android App
  Compatibility" dialog for unaligned RN Release libs and can trigger
  `system_server` ANRs — tap "Don't Show Again" and reboot the emulator if it
  degrades.

## Known issues surfaced by this runbook

- `restartApp()` on the New Architecture did not apply a pending update until a
  full process restart (`ReactHostImpl` field name mismatch). Fixed in the SDK.
- Deploy/rollback status reports failed with HTTP 400 when the app's binary
  version omitted the patch segment (e.g. `1.0`); the server rejected what
  `update_check` accepts. Fixed server-side (`aether-server`).
- Building the sample in **Release for the iOS simulator** currently fails on the
  x86_64 slice (classic RN Apple-Silicon simulator-Release issue) — the iOS
  visual OTA swap is therefore verified on device/Debug paths but not yet on a
  simulator Release build.
