# Attribution

This repository is a snapshot fork. It does not carry the upstream git history;
provenance is recorded here instead.

## Origin

- Package: `@revopush/react-native-code-push`
- Version: `1.5.0`
- Commit: `12ebcc2316a6dfed199d18c559f110999e5233ee` (tag `1.5.0`,
  https://github.com/revopush/react-native-code-push)
- Imported: 2026-07-17, full source tree, squash import (no upstream git history)

## Lineage

1. **Microsoft Corporation** — original author of the CodePush plugin for
   React Native (`react-native-code-push`, https://github.com/microsoft/react-native-code-push),
   released under the MIT License. The project was archived by Microsoft after
   the App Center retirement.
2. **RevoPush** — forked Microsoft's plugin as
   `@revopush/react-native-code-push`, adding React Native New Architecture
   support (RN 0.76+). MIT License.
3. **Aether** — this repository, `@aetherpush/react-native-code-push`, a
   snapshot of the RevoPush fork at v1.5.0, maintained independently for the
   Aether OTA update service. MIT License.

This fork has no tracking obligation to either upstream. Future cherry-picks
from upstream remain possible under the MIT License and will be recorded here.

## Vendored third-party code

- `ios/CodePush/JWT` — JWT library, Copyright (c) Karma Mobility, Inc., MIT
  License (see `ios/CodePush/JWT/LICENSE`)
- `ios/CodePush/SSZipArchive` — SSZipArchive with minizip, zlib-style license
  (see `ios/CodePush/SSZipArchive/minizip/LICENSE`)
- `ios/CodePush/Base64` — MF_Base64Additions (https://github.com/ekscrypto/Base64)

## License

The entire lineage (Microsoft → RevoPush → Aether) is MIT licensed. The
original Microsoft copyright notice is preserved in `LICENSE.md` as required
by the MIT License.
