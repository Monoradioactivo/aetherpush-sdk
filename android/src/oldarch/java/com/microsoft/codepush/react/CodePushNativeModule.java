package com.microsoft.codepush.react;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Map;

// Old Architecture entry point: a classic bridge module that delegates to the
// shared CodePushNativeModuleImpl. The generated spec only exists under the New
// Architecture, so this variant does not reference it.
@ReactModule(name = CodePushNativeModuleImpl.NAME)
public class CodePushNativeModule extends ReactContextBaseJavaModule {
    private final CodePushNativeModuleImpl mImpl;

    public CodePushNativeModule(ReactApplicationContext reactContext, CodePush codePush, CodePushUpdateManager codePushUpdateManager, CodePushTelemetryManager codePushTelemetryManager, SettingsManager settingsManager) {
        super(reactContext);
        mImpl = new CodePushNativeModuleImpl(reactContext, codePush, codePushUpdateManager, codePushTelemetryManager, settingsManager);
    }

    @Override
    public String getName() {
        return CodePushNativeModuleImpl.NAME;
    }

    @Override
    public Map<String, Object> getConstants() {
        return mImpl.getConstants();
    }

    @ReactMethod
    public void allow(Promise promise) {
        mImpl.allow(promise);
    }

    @ReactMethod
    public void clearPendingRestart(Promise promise) {
        mImpl.clearPendingRestart(promise);
    }

    @ReactMethod
    public void disallow(Promise promise) {
        mImpl.disallow(promise);
    }

    @ReactMethod
    public void restartApp(boolean onlyIfUpdateIsPending, Promise promise) {
        mImpl.restartApp(onlyIfUpdateIsPending, promise);
    }

    @ReactMethod
    public void downloadUpdate(ReadableMap updatePackage, boolean notifyProgress, Promise promise) {
        mImpl.downloadUpdate(updatePackage, notifyProgress, promise);
    }

    @ReactMethod
    public void installUpdate(ReadableMap updatePackage, int installMode, int minimumBackgroundDuration, Promise promise) {
        mImpl.installUpdate(updatePackage, installMode, minimumBackgroundDuration, promise);
    }

    @ReactMethod
    public void getConfiguration(Promise promise) {
        mImpl.getConfiguration(promise);
    }

    @ReactMethod
    public void getUpdateMetadata(int updateState, Promise promise) {
        mImpl.getUpdateMetadata(updateState, promise);
    }

    @ReactMethod
    public void getNewStatusReport(Promise promise) {
        mImpl.getNewStatusReport(promise);
    }

    @ReactMethod
    public void isFailedUpdate(String packageHash, Promise promise) {
        mImpl.isFailedUpdate(packageHash, promise);
    }

    @ReactMethod
    public void isFirstRun(String packageHash, Promise promise) {
        mImpl.isFirstRun(packageHash, promise);
    }

    @ReactMethod
    public void getLatestRollbackInfo(Promise promise) {
        mImpl.getLatestRollbackInfo(promise);
    }

    @ReactMethod
    public void setLatestRollbackInfo(String packageHash, Promise promise) {
        mImpl.setLatestRollbackInfo(packageHash, promise);
    }

    @ReactMethod
    public void notifyApplicationReady(Promise promise) {
        mImpl.notifyApplicationReady(promise);
    }

    @ReactMethod
    public void recordStatusReported(ReadableMap statusReport) {
        mImpl.recordStatusReported(statusReport);
    }

    @ReactMethod
    public void saveStatusReportForRetry(ReadableMap statusReport) {
        mImpl.saveStatusReportForRetry(statusReport);
    }

    @ReactMethod
    public void clearUpdates() {
        mImpl.clearUpdates();
    }

    @ReactMethod
    public void addListener(String eventName) {
        mImpl.addListener(eventName);
    }

    @ReactMethod
    public void removeListeners(int count) {
        mImpl.removeListeners(count);
    }

    @ReactMethod
    public void downloadAndReplaceCurrentBundle(String remoteBundleUrl) {
        mImpl.downloadAndReplaceCurrentBundle(remoteBundleUrl);
    }
}
