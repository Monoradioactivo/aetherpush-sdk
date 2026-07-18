import { CodePushDeployStatusError, CodePushHttpError, CodePushPackageError } from "./code-push-error";

const SERVER_PATH_PREFIXES = {
  "aether": "v1/public/aether/",
  "codepush-legacy": "v0.1/public/codepush/"
};

export class AcquisitionStatus {
  static DeploymentSucceeded = "DeploymentSucceeded";
  static DeploymentFailed = "DeploymentFailed";
}

export class AcquisitionManager {
  static _apiCallsDisabled = false;

  constructor(httpRequester, configuration) {
    this.BASE_URL_PART = "appcenter.ms";
    this._publicPrefixUrl = SERVER_PATH_PREFIXES[configuration.serverPathMode] || SERVER_PATH_PREFIXES["aether"];
    this.isRecoverable = (statusCode) => statusCode >= 500 || statusCode === 408 || statusCode === 429;
    this._httpRequester = httpRequester;
    this._serverUrl = configuration.serverUrl;
    if (this._serverUrl.slice(-1) !== "/") {
      this._serverUrl += "/";
    }
    this._appVersion = configuration.appVersion;
    this._clientUniqueId = configuration.clientUniqueId;
    this._deploymentKey = configuration.deploymentKey;
    this._ignoreAppVersion = configuration.ignoreAppVersion;
  }

  handleRequestFailure() {
    if (this._serverUrl.includes(this.BASE_URL_PART) && !this.isRecoverable(this._statusCode)) {
      AcquisitionManager._apiCallsDisabled = true;
    }
  }

  queryUpdateWithCurrentPackage(currentPackage, callback) {
    if (AcquisitionManager._apiCallsDisabled) {
      console.log("[CodePush] Api calls are disabled, skipping API call");
      callback(null, null);
      return;
    }
    if (!currentPackage || !currentPackage.appVersion) {
      throw new CodePushPackageError("Calling common acquisition SDK with incorrect package");
    }
    const updateRequest = {
      deployment_key: this._deploymentKey,
      app_version: currentPackage.appVersion,
      package_hash: currentPackage.packageHash,
      is_companion: this._ignoreAppVersion,
      label: currentPackage.label,
      client_unique_id: this._clientUniqueId
    };
    const requestUrl = this._serverUrl + this._publicPrefixUrl + "update_check?" + queryStringify(updateRequest);
    this._httpRequester.request(0, requestUrl, (error, response) => {
      if (error) {
        callback(error, null);
        return;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        let errorMessage;
        this._statusCode = response.statusCode;
        this.handleRequestFailure();
        if (response.statusCode === 0) {
          errorMessage = `Couldn't send request to ${requestUrl}, xhr.statusCode = 0 was returned. One of the possible reasons for that might be connection problems. Please, check your internet connection.`;
        } else {
          errorMessage = `${response.statusCode}: ${response.body}`;
        }
        callback(new CodePushHttpError(errorMessage), null);
        return;
      }
      let updateInfo;
      try {
        const responseObject = JSON.parse(response.body);
        updateInfo = responseObject.update_info;
      } catch (parseError) {
        callback(parseError, null);
        return;
      }
      if (!updateInfo) {
        callback(error, null);
        return;
      } else if (updateInfo.update_app_version) {
        callback(null, { updateAppVersion: true, appVersion: updateInfo.target_binary_range });
        return;
      } else if (!updateInfo.is_available) {
        callback(null, null);
        return;
      }
      const remotePackage = {
        deploymentKey: this._deploymentKey,
        description: updateInfo.description,
        label: updateInfo.label,
        appVersion: updateInfo.target_binary_range,
        isMandatory: updateInfo.is_mandatory,
        packageHash: updateInfo.package_hash,
        packageSize: updateInfo.package_size,
        downloadUrl: updateInfo.download_url
      };
      callback(null, remotePackage);
    });
  }

  reportStatusDeploy(deployedPackage, status, previousLabelOrAppVersion, previousDeploymentKey, callback) {
    if (AcquisitionManager._apiCallsDisabled) {
      console.log("[CodePush] Api calls are disabled, skipping API call");
      callback(null, null);
      return;
    }
    const url = this._serverUrl + this._publicPrefixUrl + "report_status/deploy";
    const body = {
      app_version: this._appVersion,
      deployment_key: this._deploymentKey
    };
    if (this._clientUniqueId) {
      body.client_unique_id = this._clientUniqueId;
    }
    if (deployedPackage) {
      body.label = deployedPackage.label;
      body.app_version = deployedPackage.appVersion;
      switch (status) {
        case AcquisitionStatus.DeploymentSucceeded:
        case AcquisitionStatus.DeploymentFailed:
          body.status = status;
          break;
        default:
          if (callback) {
            if (!status) {
              callback(new CodePushDeployStatusError("Missing status argument."), null);
            } else {
              callback(new CodePushDeployStatusError(`Unrecognized status "${status}".`), null);
            }
          }
          return;
      }
    }
    if (previousLabelOrAppVersion) {
      body.previous_label_or_app_version = previousLabelOrAppVersion;
    }
    if (previousDeploymentKey) {
      body.previous_deployment_key = previousDeploymentKey;
    }
    callback = typeof arguments[arguments.length - 1] === "function" && arguments[arguments.length - 1];
    this._httpRequester.request(2, url, JSON.stringify(body), (error, response) => {
      if (callback) {
        if (error) {
          callback(error, null);
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          this._statusCode = response.statusCode;
          this.handleRequestFailure();
          callback(new CodePushHttpError(response.statusCode + ": " + response.body), null);
          return;
        }
        callback(null, null);
      }
    });
  }

  reportStatusDownload(downloadedPackage, callback) {
    if (AcquisitionManager._apiCallsDisabled) {
      console.log("[CodePush] Api calls are disabled, skipping API call");
      callback(null, null);
      return;
    }
    const url = this._serverUrl + this._publicPrefixUrl + "report_status/download";
    const body = {
      client_unique_id: this._clientUniqueId,
      deployment_key: this._deploymentKey,
      label: downloadedPackage.label
    };
    this._httpRequester.request(2, url, JSON.stringify(body), (error, response) => {
      if (callback) {
        if (error) {
          callback(error, null);
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          this._statusCode = response.statusCode;
          this.handleRequestFailure();
          callback(new CodePushHttpError(response.statusCode + ": " + response.body), null);
          return;
        }
        callback(null, null);
      }
    });
  }
}

function queryStringify(object) {
  let queryString = "";
  let isFirst = true;
  for (const property in object) {
    if (object.hasOwnProperty(property)) {
      const value = object[property];
      if (value !== null && typeof value !== "undefined") {
        if (!isFirst) {
          queryString += "&";
        }
        queryString += encodeURIComponent(property) + "=";
        queryString += encodeURIComponent(value);
      }
      isFirst = false;
    }
  }
  return queryString;
}
