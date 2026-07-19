package com.microsoft.codepush.react;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Map;

// New Architecture entry point: a real TurboModule that implements the generated
// NativeCodePushSpec and delegates to the shared CodePushNativeModuleImpl.
@ReactModule(name = CodePushNativeModuleImpl.NAME)
public class CodePushNativeModule extends NativeCodePushSpec {
    private final CodePushNativeModuleImpl mImpl;

    public CodePushNativeModule(ReactApplicationContext reactContext, CodePush codePush, CodePushUpdateManager codePushUpdateManager, CodePushTelemetryManager codePushTelemetryManager, SettingsManager settingsManager) {
        super(reactContext);
        mImpl = new CodePushNativeModuleImpl(reactContext, codePush, codePushUpdateManager, codePushTelemetryManager, settingsManager);
    }

    @Override
    protected Map<String, Object> getTypedExportedConstants() {
        return mImpl.getConstants();
    }

    @Override
    public void allow(Promise promise) {
        mImpl.allow(promise);
    }

    @Override
    public void clearPendingRestart(Promise promise) {
        mImpl.clearPendingRestart(promise);
    }

    @Override
    public void disallow(Promise promise) {
        mImpl.disallow(promise);
    }

    @Override
    public void restartApp(boolean onlyIfUpdateIsPending, Promise promise) {
        mImpl.restartApp(onlyIfUpdateIsPending, promise);
    }

    @Override
    public void downloadUpdate(ReadableMap updatePackage, boolean notifyProgress, Promise promise) {
        mImpl.downloadUpdate(updatePackage, notifyProgress, promise);
    }

    @Override
    public void installUpdate(ReadableMap updatePackage, double installMode, double minimumBackgroundDuration, Promise promise) {
        mImpl.installUpdate(updatePackage, (int) installMode, (int) minimumBackgroundDuration, promise);
    }

    @Override
    public void getConfiguration(Promise promise) {
        mImpl.getConfiguration(promise);
    }

    @Override
    public void getUpdateMetadata(double updateState, Promise promise) {
        mImpl.getUpdateMetadata((int) updateState, promise);
    }

    @Override
    public void getNewStatusReport(Promise promise) {
        mImpl.getNewStatusReport(promise);
    }

    @Override
    public void isFailedUpdate(String packageHash, Promise promise) {
        mImpl.isFailedUpdate(packageHash, promise);
    }

    @Override
    public void isFirstRun(String packageHash, Promise promise) {
        mImpl.isFirstRun(packageHash, promise);
    }

    @Override
    public void getLatestRollbackInfo(Promise promise) {
        mImpl.getLatestRollbackInfo(promise);
    }

    @Override
    public void setLatestRollbackInfo(String packageHash, Promise promise) {
        mImpl.setLatestRollbackInfo(packageHash, promise);
    }

    @Override
    public void notifyApplicationReady(Promise promise) {
        mImpl.notifyApplicationReady(promise);
    }

    @Override
    public void recordStatusReported(ReadableMap statusReport) {
        mImpl.recordStatusReported(statusReport);
    }

    @Override
    public void saveStatusReportForRetry(ReadableMap statusReport) {
        mImpl.saveStatusReportForRetry(statusReport);
    }

    @Override
    public void clearUpdates() {
        mImpl.clearUpdates();
    }

    @Override
    public void addListener(String eventName) {
        mImpl.addListener(eventName);
    }

    @Override
    public void removeListeners(double count) {
        mImpl.removeListeners((int) count);
    }

    // Test-only; not part of the frozen spec.
    @ReactMethod
    public void downloadAndReplaceCurrentBundle(String remoteBundleUrl) {
        mImpl.downloadAndReplaceCurrentBundle(remoteBundleUrl);
    }
}
