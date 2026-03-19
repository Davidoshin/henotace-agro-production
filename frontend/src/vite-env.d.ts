/// <reference types="vite/client" />

// Electron types
interface Window {
  electron?: {
    isElectron: boolean;
    platform: string;
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
  };
}
