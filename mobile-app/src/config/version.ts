// App version configuration
export const APP_VERSION = '1.0.35';
export const APP_VERSION_CODE = 35; // Increment for each release

// URL to check for the latest version
export const VERSION_CHECK_URL = 'https://business.henotaceai.ng/api/app-version/';

// Homepage URL for downloading updates
export const APP_DOWNLOAD_URL = 'https://business.henotaceai.ng/';

export interface VersionInfo {
  version: string;
  versionCode: number;
  releaseNotes?: string;
  forceUpdate?: boolean;
  downloadUrl?: string;
}
