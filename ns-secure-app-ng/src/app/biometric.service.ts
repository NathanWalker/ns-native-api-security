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
export class BiometricService {
  options = signal<BiometricOptions>({});
  biometricLock = signal(true);
  private _secureStorage: SecureStorage;
  private _biometricAuth: BiometricAuth;

  constructor() {
    this._secureStorage = new SecureStorage();
  }

  setupBiometric() {
    this._initBiometricHandler();
  }

  verifyBiometric() {
    return new Promise<void>((resolve, reject) => {
      const options = this.options();
      if (options && options.available) {
        this._biometricAuth
          .verifyBiometric({
            title: "Authenticate",
            message: `Verify your identity to access your account.`,
            pinFallback: global.isAndroid ? false : true,
            // useCustomAndroidUI: false, // TODO:
          })
          .then(
            () => {
              console.log("biometric unlock!");

              //   this.passcodeRequired = false;
              //   this.biometricCanceled = false;
              this.biometricLock.set(false);
              resolve();
            },
            (err) => {
              //   this.biometricCanceled = true;
              reject(err);
            }
          );
      } else {
        // TODO: may want to show passcode modal in this case
        this.biometricLock.set(false);
        resolve();
      }
    });
  }

  promptToUseBiometric() {
    return new Promise<void>((resolve) => {
      if (this.options().available) {
        const askUser = (type: "Face" | "Touch") => {
          // ask user if they want biometric
          // allow in flight navigation to settle before prompting
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
        };

        askUser("Face");
      } else {
        resolve();
      }
    });
  }

  private _initBiometricHandler() {
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
          }
        }
      },
      (err) => {
        console.log("biometric error:", err);
      }
    );
  }
}
