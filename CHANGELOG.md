# Changelog

## [1.2.0](https://github.com/Monoradioactivo/aetherpush-sdk/compare/v1.1.0...v1.2.0) (2026-07-19)


### Features

* **ios:** implement CodePush as a New Architecture TurboModule ([#15](https://github.com/Monoradioactivo/aetherpush-sdk/issues/15)) ([4999bf5](https://github.com/Monoradioactivo/aetherpush-sdk/commit/4999bf59736a9fd8212cfa15f029c677f7607226))
* **m2:** CodePush as a working TurboModule (New Architecture) ([#11](https://github.com/Monoradioactivo/aetherpush-sdk/issues/11)) ([0be825a](https://github.com/Monoradioactivo/aetherpush-sdk/commit/0be825acf59c0af1cc0bfbd9aae2639dadb5be56))
* **m2:** split CodePushNativeModule into new-arch and old-arch variants ([#14](https://github.com/Monoradioactivo/aetherpush-sdk/issues/14)) ([60a0d85](https://github.com/Monoradioactivo/aetherpush-sdk/commit/60a0d854b342bb17f02e9178ee5d7cb256aec9c1))

## [1.1.0](https://github.com/Monoradioactivo/aetherpush-sdk/compare/v1.0.0...v1.1.0) (2026-07-19)


### Features

* **m2:** add the frozen JS-to-native contract as a Codegen spec ([#9](https://github.com/Monoradioactivo/aetherpush-sdk/issues/9)) ([0132e4c](https://github.com/Monoradioactivo/aetherpush-sdk/commit/0132e4c8f29c3ec25a3ac3e42dc6cf7b04a9fdb8))


### Bug Fixes

* **android:** resolve ReactHostDelegate for restartApp on New Architecture ([#4](https://github.com/Monoradioactivo/aetherpush-sdk/issues/4)) ([f20e2e5](https://github.com/Monoradioactivo/aetherpush-sdk/commit/f20e2e5c551f604911fef19d78f91fcc26863437))
* **samples:** make Metro resolve the file-linked SDK at runtime ([#3](https://github.com/Monoradioactivo/aetherpush-sdk/issues/3)) ([28e10a9](https://github.com/Monoradioactivo/aetherpush-sdk/commit/28e10a93ba9c5716f2d24ad299a917af9a59a963))
* **samples:** set REACT_NATIVE_PATH so iOS Release builds can bundle JS ([#7](https://github.com/Monoradioactivo/aetherpush-sdk/issues/7)) ([212616d](https://github.com/Monoradioactivo/aetherpush-sdk/commit/212616d05128642faf0fbb3b49eee59f55f6f9dc))

## 1.0.0 (2026-07-18)


### Features

* add serverPathMode and vendor the acquisition SDK ([6c57d2c](https://github.com/Monoradioactivo/aetherpush-sdk/commit/6c57d2cecbb22bd610a22218419275fb4bedc9e5))
* add smoke sample apps and CI for RN 0.76 and 0.86 ([40dede4](https://github.com/Monoradioactivo/aetherpush-sdk/commit/40dede4336cce174997fd7c819080d5b4eaf36ec))
* rebrand package as @aetherpush/react-native-code-push ([73fe85c](https://github.com/Monoradioactivo/aetherpush-sdk/commit/73fe85c351ff0fcab27c2988a3a18d42808948e5))
* rebrand RevoPush snapshot as the Aether SDK (M1) ([1a8bfe7](https://github.com/Monoradioactivo/aetherpush-sdk/commit/1a8bfe7a847c940858958a93ef115c84eb6cd918))


### Bug Fixes

* lower pod deployment target to iOS 15.1 ([faeedc4](https://github.com/Monoradioactivo/aetherpush-sdk/commit/faeedc4827a8b8973905f6a9a03956e427ca85df))
* require iOS 15.5 platform in sample apps ([a1e4441](https://github.com/Monoradioactivo/aetherpush-sdk/commit/a1e4441c359ba473023006edfa2ab0864e4dbe33))
