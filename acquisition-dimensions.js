import { Platform } from "react-native";

const packageJson = require("./package.json");

function majorFromVersion(raw) {
  if (raw === null || raw === undefined) {
    return undefined;
  }
  const text = String(raw).trim();
  const match = text.match(/^(\d{1,3})/);
  return match ? match[1] : undefined;
}

function reactNativeMinorVersion() {
  const version = Platform.constants && Platform.constants.reactNativeVersion;
  if (!version || typeof version.major !== "number" || typeof version.minor !== "number") {
    return undefined;
  }
  return `${version.major}.${version.minor}`;
}

export function collectAcquisitionDimensions() {
  const dims = {};
  if (Platform.OS === "ios" || Platform.OS === "android") {
    dims.platform = Platform.OS;
  }
  const osMajor = majorFromVersion(Platform.Version);
  if (osMajor) {
    dims.os_version = osMajor;
  }
  const rn = reactNativeMinorVersion();
  if (rn) {
    dims.react_native_version = rn;
  }
  if (packageJson && typeof packageJson.version === "string" && packageJson.version) {
    dims.sdk_version = packageJson.version;
  }
  return dims;
}

export function attachAcquisitionDimensions(target) {
  const dims = collectAcquisitionDimensions();
  for (const key of Object.keys(dims)) {
    target[key] = dims[key];
  }
  return target;
}
