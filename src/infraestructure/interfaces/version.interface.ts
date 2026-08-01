export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface VersionInfo {
  version: string;
  versionCode: number;
  mandatory: boolean;
  downloadUrl: string;
  changelog: ChangelogEntry[];
}

export interface UpdateState {
  checking: boolean;
  hasUpdate: boolean;
  versionInfo: VersionInfo | null;
  modalVisible: boolean;
  downloading: boolean;
  downloadProgress: number;
  error: string | null;
}
