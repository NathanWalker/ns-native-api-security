import {
  Component,
  computed,
  inject,
  model,
  NO_ERRORS_SCHEMA,
  signal,
} from "@angular/core";
import {
  NativeDialogModule,
  NativeDialogService,
  NativeScriptCommonModule,
} from "@nativescript/angular";
import { Biometric } from "./biometric";
import { Dialogs, EventData, Page, Switch, Utils } from "@nativescript/core";
import { LoadingIndicator } from "@nstudio/nativescript-loading-indicator";
import { Tokens } from "./tokens";
import { TokenViewer } from "./token-viewer";
import { Sqlite } from "./sqlite";

@Component({
  selector: "ns-home",
  templateUrl: "./home.html",
  imports: [NativeScriptCommonModule, NativeDialogModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Home {
  biometric = inject(Biometric);
  tokens = inject(Tokens);
  sqlite = inject(Sqlite);
  nativeDialog = inject(NativeDialogService);
  page = inject(Page);
  loader = new LoadingIndicator();

  selectedAlgorithmIndex = model(0);
  selectedKeyLengthIndex = model(2);
  encryptedStatus = signal("");
  decryptedStatus = signal("");

  cryptoKey = signal<CryptoKeyPair | null>(null);
  keyStatus = signal("");
  jwtToken = model("");
  encryptedToken = signal("");
  decryptedToken = signal("");
  dbStatus = signal("");

  title = computed(() => {
    const isTotallySecure =
      !this.biometric.biometricLock() &&
      this.biometric.isSecureStorageEnabled();
    const secureIcon = isTotallySecure ? "🔒" : "";
    return `${secureIcon} Native API Security with NativeScript ${secureIcon}`;
  });
  canExportKey = computed(() => {
    return !!this.cryptoKey();
  });
  canEncrypt = computed(() => {
    return this.jwtToken() !== "" && this.encryptedToken() === "";
  });
  canDecrypt = computed(() => {
    return this.encryptedToken() !== "" && this.decryptedToken() === "";
  });
  canStore = computed(() => {
    return this.encryptedToken() !== "" && this.dbStatus() === "";
  });
  storeTokenButtonText = computed(() => {
    if (this.biometric.isSecureStorageEnabled()) {
      return "Store Securely! 🔐";
    } else {
      return "Store Insecurely 💀";
    }
  });
  isBiometricEnabled = computed(() => {
    return this.biometric.options().available;
  });
  isEncrypting = signal(false);
  isGeneratingKey = signal(false);
  viewStoredTokensButtonText = computed(() => {
    const total = this.tokens.storedTokens().length;
    return `View Stored Tokens${total ? " (" + total + ")" : ""}`;
  });

  constructor() {
    if (__ANDROID__) {
      this.page.actionBarHidden = true;
    }
  }

  async onGenerateKey() {
    this.loader.show();
    setTimeout(async () => {
      const key = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      this.cryptoKey.set(key);
      this.loader.hide();
      Dialogs.alert({
        title: "Key Generated",
        message: `Key generated successfully!`,
        okButtonText: "OK",
      });
    });
  }
  onGenerateSample() {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload = {
      sub: "1234567890",
      name: "John Doe",
      admin: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    const base64Header = btoa(JSON.stringify(header))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const base64Payload = btoa(JSON.stringify(payload))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    // In a real app, you'd create a valid signature, but for demo purposes:
    const dummySignature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    this.jwtToken.set(`${base64Header}.${base64Payload}.${dummySignature}`);
  }
  async onEncryptToken() {
    if (!this.cryptoKey()) {
      Dialogs.alert({
        title: "Hold up!",
        message: "Please generate a key first.",
        okButtonText: "OK",
      });
      return;
    }
    try {
      this.isEncrypting.set(true);
      // Convert token to ArrayBuffer
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(this.jwtToken());
      // Encrypt the token
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        this.cryptoKey()!.publicKey,
        tokenData
      );

      const encryptedBase64 = arrayBufferToBase64(encryptedData);
      this.encryptedToken.set(encryptedBase64);
      this.isEncrypting.set(false);
    } catch (error) {
      console.error("Encryption failed:", error);
      this.isEncrypting.set(false);
    }
  }
  async onDecryptToken() {
    const base64Data = this.encryptedToken();
    const ciphertext = base64ToArrayBuffer(base64Data);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      this.cryptoKey()!.privateKey,
      ciphertext
    );

    let dec = new TextDecoder();
    const decryptedValue = dec.decode(decrypted);

    this.decryptedToken.set(decryptedValue);
  }
  onStoreToken() {
    const value = {
      token: this.encryptedToken(),
      name: new Date().toISOString(),
    };
    if (this.biometric.isSecureStorageEnabled()) {
      this.biometric.storeTokens([value]);
    } else {
      this.sqlite.setItem("tokens", value).then(() => {
        this.tokens.storedTokens.set([...this.tokens.storedTokens(), value]);
        Dialogs.alert({
          title: "Token Stored",
          message: "Decrypted token stored successfully.",
          okButtonText: "OK",
        });
      });
    }
  }
  onCopyDecrypted() {
    Utils.copyToClipboard(this.decryptedToken());
    Dialogs.alert({
      title: "Copied",
      message: "Decrypted token copied to clipboard.",
      okButtonText: "OK",
    });
  }

  onViewStoredTokens() {
    this.nativeDialog.open(TokenViewer, {
      nativeOptions: {
        fullscreen: __ANDROID__,
      },
    });
  }

  onViewSecureEnclaveTokens() {
    this.biometric
      .verifyBiometric()
      .then(async () => {
        const data = await this.biometric.getSecureStoredTokens();
        if (data?.length) {
          const parsedData = data[0];
          Dialogs.alert({
            title: "Secure Token",
            message: parsedData.token,
            okButtonText: "OK",
          });
        }
      })
      .catch(() => {
        Dialogs.alert({
          title: "Biometric Failed",
          message: "You need to verify your biometrics to view secure tokens.",
          okButtonText: "OK",
        });
      });
  }

  onBiometricSwitchChange(evt: EventData) {
    const control = evt.object as Switch;
    if (control.checked) {
      this.biometric.setupBiometric();
    } else {
      this.biometric.options.set({ available: false });
    }
  }

  onSecureStorageSwitchChange(evt: EventData) {
    const control = evt.object as Switch;
    this.biometric.isSecureStorageEnabled.set(control.checked);
  }
}

function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
