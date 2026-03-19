/**
 * Biometrics utility using native plugin for mobile and WebAuthn for web
 */

import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

// Check if we're running in a native app
const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

export interface BiometricCredentials {
  username: string;
  password: string;
}

export interface BiometricsResult {
  available: boolean;
  biometryType?: string;
  errorMessage?: string;
}

const CREDENTIALS_SERVER = 'com.henotace.business';

/**
 * Map native biometry type to human-readable string
 */
const getBiometryTypeName = (type: BiometryType): string => {
  switch (type) {
    case BiometryType.FACE_ID:
      return 'Face ID';
    case BiometryType.TOUCH_ID:
      return 'Touch ID';
    case BiometryType.FINGERPRINT:
      return 'Fingerprint';
    case BiometryType.FACE_AUTHENTICATION:
      return 'Face Authentication';
    case BiometryType.IRIS_AUTHENTICATION:
      return 'Iris Authentication';
    case BiometryType.MULTIPLE:
      return 'Biometrics';
    default:
      return 'Biometrics';
  }
};

/**
 * Check if biometrics is available on the device
 */
export const checkBiometricsAvailable = async (): Promise<BiometricsResult> => {
  try {
    if (isNative()) {
      // Use native biometric plugin for mobile apps
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
        return { 
          available: true, 
          biometryType: getBiometryTypeName(result.biometryType) 
        };
      }
      return { 
        available: false, 
        errorMessage: result.errorCode ? `Biometrics not available (${result.errorCode})` : 'Biometrics not available on this device' 
      };
    }
    
    // Use WebAuthn for web/PWA
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available) {
        return { available: true, biometryType: 'platform' };
      }
    }
    
    return { available: false, errorMessage: 'Biometrics not supported' };
  } catch (error: any) {
    console.error('Biometric check error:', error);
    return { available: false, errorMessage: error.message || 'Failed to check biometrics' };
  }
};

/**
 * Verify biometrics (prompt user for biometric authentication)
 */
export const verifyBiometrics = async (reason: string = 'Authenticate'): Promise<boolean> => {
  try {
    if (isNative()) {
      // Use native biometric for mobile
      await NativeBiometric.verifyIdentity({
        reason: reason,
        title: 'Biometric Login',
        subtitle: 'Verify your identity',
        description: 'Use biometrics to login to your account',
      });
      return true;
    }
    
    // Use WebAuthn for web
    const storedCredentialId = localStorage.getItem('biometrics_credential_id');
    if (!storedCredentialId) return false;
    
    const credentialIdBuffer = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));
    
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      allowCredentials: [{
        id: credentialIdBuffer,
        type: 'public-key',
        transports: ['internal']
      }],
      userVerification: 'required',
      timeout: 60000
    };
    
    crypto.getRandomValues(publicKeyCredentialRequestOptions.challenge as Uint8Array);
    
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });
    
    return !!credential;
  } catch (error: any) {
    console.error('Biometric verify error:', error);
    return false;
  }
};

/**
 * Store credentials securely for biometric login
 */
export const storeCredentials = async (credentials: BiometricCredentials): Promise<boolean> => {
  try {
    if (isNative()) {
      // Use native biometric credential storage
      await NativeBiometric.setCredentials({
        username: credentials.username,
        password: credentials.password,
        server: CREDENTIALS_SERVER,
      });
      localStorage.setItem('biometrics_enrolled', 'true');
      localStorage.setItem('biometrics_email', credentials.username);
      return true;
    }
    
    // Use WebAuthn for web
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32),
      rp: {
        name: 'Henotace Business',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: credentials.username,
        displayName: credentials.username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000
    };
    
    crypto.getRandomValues(publicKeyCredentialCreationOptions.challenge as Uint8Array);
    
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;
    
    if (credential) {
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem('biometrics_credential_id', credentialId);
      localStorage.setItem('biometrics_enrolled', 'true');
      localStorage.setItem('biometrics_email', credentials.username);
      localStorage.setItem('biometrics_token', btoa(credentials.password));
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Failed to store credentials:', error);
    return false;
  }
};

/**
 * Get stored credentials (after biometric verification)
 */
export const getCredentials = async (): Promise<BiometricCredentials | null> => {
  try {
    if (isNative()) {
      // Use native biometric to get credentials
      const verified = await verifyBiometrics('Login with biometrics');
      if (!verified) return null;
      
      const credentials = await NativeBiometric.getCredentials({
        server: CREDENTIALS_SERVER,
      });
      
      if (credentials.username && credentials.password) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    }
    
    // Use WebAuthn for web
    const verified = await verifyBiometrics();
    if (!verified) return null;
    
    const email = localStorage.getItem('biometrics_email');
    const token = localStorage.getItem('biometrics_token');
    
    if (email && token) {
      return {
        username: email,
        password: atob(token),
      };
    }
    return null;
  } catch (error: any) {
    console.error('Failed to get credentials:', error);
    return null;
  }
};

/**
 * Delete stored credentials
 */
export const deleteCredentials = async (): Promise<boolean> => {
  try {
    if (isNative()) {
      await NativeBiometric.deleteCredentials({
        server: CREDENTIALS_SERVER,
      });
    }
    
    // Clear local storage for both native and web
    localStorage.removeItem('biometrics_enrolled');
    localStorage.removeItem('biometrics_email');
    localStorage.removeItem('biometrics_token');
    localStorage.removeItem('biometrics_credential_id');
    
    return true;
  } catch (error: any) {
    console.error('Failed to delete credentials:', error);
    // Still clear localStorage even if native deletion fails
    localStorage.removeItem('biometrics_enrolled');
    localStorage.removeItem('biometrics_email');
    localStorage.removeItem('biometrics_token');
    localStorage.removeItem('biometrics_credential_id');
    return true;
  }
};

/**
 * Check if user has enrolled biometrics
 */
export const isBiometricsEnrolled = (): boolean => {
  return localStorage.getItem('biometrics_enrolled') === 'true';
};

/**
 * Get enrolled email
 */
export const getEnrolledEmail = (): string | null => {
  return localStorage.getItem('biometrics_email');
};
