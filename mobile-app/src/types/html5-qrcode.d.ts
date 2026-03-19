declare namespace Html5Qrcode {
  interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
    videoConstraints?: MediaTrackConstraints;
  }

  interface Html5QrcodeCameraScanConfig {
    fps?: number;
    qrbox?: { width: number; height: number } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
  }

  type QrcodeSuccessCallback = (decodedText: string, decodedResult: any) => void;
  type QrcodeErrorCallback = (errorMessage: string) => void;
}

declare class Html5Qrcode {
  constructor(elementId: string);
  start(
    cameraIdOrConfig: string | { facingMode: string },
    config: Html5Qrcode.Html5QrcodeCameraScanConfig,
    qrCodeSuccessCallback: Html5Qrcode.QrcodeSuccessCallback,
    qrCodeErrorCallback?: Html5Qrcode.QrcodeErrorCallback
  ): Promise<void>;
  stop(): Promise<void>;
  clear(): Promise<void>;
  getState(): number;
}

interface Window {
  Html5Qrcode: typeof Html5Qrcode;
}

