import { Injectable, signal } from "@angular/core";
import {
  BiometricAuth,
  BiometricIDAvailableResult,
} from "@nativescript/biometrics";
import { SecureStorage } from "@nativescript/secure-storage";

type BiometricOptions = {
  available?: boolean;
  biometric?: boolean;
  touch?: boolean;
  face?: boolean;
};

@Injectable({
  providedIn: "root",
})
export class Biometric {
  options = signal<BiometricOptions>({});
  biometricLock = signal(true);
  isSecureStorageEnabled = signal(false);
  isStoredSecurely = signal(false);
  private _secureStorage: SecureStorage;
  private _biometricAuth: BiometricAuth;

  constructor() {
    this._secureStorage = new SecureStorage();
  }

  setupBiometric() {
    this._initBiometricHandler();
  }

  storeTokens(data) {
    this._secureStorage.set({
      key: "tokens",
      value: JSON.stringify(data),
    });
    this.isStoredSecurely.set(true);
  }

  async getSecureStoredTokens(): Promise<{ id: string; token: string }[]> {
    const data = await this._secureStorage.get({
      key: "tokens",
    });
    if (data) {
      try {
        return JSON.parse(data) as { id: string; token: string }[];
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  verifyBiometric() {
    return new Promise<void>((resolve, reject) => {
      const options = this.options();
      if (options && options.available) {
        this._biometricAuth
          .verifyBiometric({
            title: "Authenticate",
            message: `Verify your identity to access your account.`,
            pinFallback: __ANDROID__ ? false : true,
          })
          .then(
            () => {
              console.log("biometric unlock!");
              this.biometricLock.set(false);
              resolve();
            },
            (err) => {
              reject(err);
            }
          );
      } else {
        // Note: could show custom passcode modal in this case
        this.biometricLock.set(false);
        resolve();
      }
    });
  }

  promptToUseBiometric() {
    return new Promise<void>((resolve) => {
      if (this.options().available) {
        setTimeout(() => {
          // temporarily show security cover while asking
          this.biometricLock.set(true);

          this.verifyBiometric().then(
            () => {
              resolve();
            },
            () => {
              // failed to authorize
              resolve();
            }
          );
        }, 600);
      } else {
        resolve();
      }
    });
  }

  private _initBiometricHandler() {
    if (this._biometricAuth) {
      return;
    }
    this._biometricAuth = new BiometricAuth();
    this._biometricAuth.available().then(
      (result: BiometricIDAvailableResult) => {
        if (result) {
          console.log("Biometrics status:", result);
          if (result.any) {
            this.options.set({
              available: true,
              biometric: result.any,
              touch: result.touch,
              face: result.face,
            });
            this.promptToUseBiometric();
          }
        }
      },
      (err) => {
        console.log("biometric error:", err);
      }
    );
  }
}
