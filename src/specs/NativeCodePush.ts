import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * Frozen JS-to-native contract for the Aether SDK (M2).
 *
 * This Codegen spec is the typed boundary the native TurboModule implements. It
 * mirrors the method surface the bridge module already exports, so the migration
 * can move the implementation without changing what JS calls. Complex payloads
 * (packages, status reports, configuration) are typed as Object here; their shape
 * is validated in the JS layer, as it is today.
 */
export interface Spec extends TurboModule {
  getConstants(): {
    codePushInstallModeImmediate: number;
    codePushInstallModeOnNextRestart: number;
    codePushInstallModeOnNextResume: number;
    codePushInstallModeOnNextSuspend: number;
    codePushUpdateStateRunning: number;
    codePushUpdateStatePending: number;
    codePushUpdateStateLatest: number;
  };

  allow(): Promise<void>;
  disallow(): Promise<void>;
  clearPendingRestart(): Promise<void>;
  restartApp(onlyIfUpdateIsPending: boolean): Promise<void>;

  downloadUpdate(updatePackage: Object, notifyProgress: boolean): Promise<Object>;
  installUpdate(
    updatePackage: Object,
    installMode: number,
    minimumBackgroundDuration: number,
  ): Promise<void>;

  getConfiguration(): Promise<Object>;
  getUpdateMetadata(updateState: number): Promise<Object | null>;
  getNewStatusReport(): Promise<Object | null>;

  isFailedUpdate(packageHash: string): Promise<boolean>;
  isFirstRun(packageHash: string): Promise<boolean>;
  getLatestRollbackInfo(): Promise<Object | null>;
  setLatestRollbackInfo(packageHash: string): Promise<void>;

  notifyApplicationReady(): Promise<Object>;
  recordStatusReported(statusReport: Object): void;
  saveStatusReportForRetry(statusReport: Object): void;

  clearUpdates(): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CodePush');
