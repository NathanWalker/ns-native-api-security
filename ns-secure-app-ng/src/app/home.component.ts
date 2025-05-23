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
  NativeScriptRouterModule,
} from "@nativescript/angular";
import { BiometricService } from "./biometric.service";
import { Dialogs } from "@nativescript/core";
import { TokenService } from "./token.service";
import { TokenViewerComponent } from "./token-viewer.component";

@Component({
  selector: "ns-home",
  templateUrl: "./home.component.html",
  imports: [NativeScriptCommonModule, NativeDialogModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HomeComponent {
  biometricService = inject(BiometricService);
  tokenService = inject(TokenService);
  dialogService = inject(NativeDialogService);

  selectedAlgorithmIndex = model(0);
  selectedKeyLengthIndex = model(2);
  encryptedStatus = signal("");
  decryptedStatus = signal("");

  cryptoKey = signal<CryptoKeyPair>(null);
  keyStatus = signal("");
  jwtToken = model("");
  encryptedToken = signal("");
  decryptedToken = signal("");
  dbStatus = signal("");

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
  isEncrypting = computed(() => {
    return false;
  });

  viewStoredTokens() {
    Dialogs.action(
      "Select Token",
      "Cancel",
      this.tokenService.storedTokens()
    ).then((result) => {
      if (![undefined, "Cancel"].includes(result)) {
        this.tokenService.storedTokens.set(
          this.tokenService.storedTokens().filter((token) => token !== result)
        );
        this.decryptedToken.set(result);
        this.decryptedStatus.set("Token decrypted successfully");
      }
    });
  }
  viewKeyStatus() {
    Dialogs.action("Select Key Status", "Cancel", [
      "Key Generated",
      "Key Not Generated",
    ]).then((result) => {
      if (![undefined, "Cancel"].includes(result)) {
        this.keyStatus.set(result);
        this.encryptedStatus.set("Key status updated successfully");
      }
    });
  }

  async onGenerateKey() {
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
    Dialogs.alert({
      title: "Key Generated",
      message: `Key generated successfully!`,
      okButtonText: "OK",
    });
  }
  onExportKey() {
    /* ... */
  }
  onImportKey() {
    /* ... */
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
      // Convert token to ArrayBuffer
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(this.jwtToken());
      // Encrypt the token
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        this.cryptoKey().publicKey,
        tokenData
      );

      const encryptedBase64 = arrayBufferToBase64(encryptedData);
      console.log("encryptedBase64:", encryptedBase64);
      // Store both IV and encrypted data together
      this.encryptedToken.set(encryptedBase64);

      // Display the encrypted token
      // encryptedTokenDisplay.innerHTML = encryptedToken;
      // encryptedTokenDisplay.classList.remove('hidden');

      // // Enable decrypt and store buttons
      // decryptTokenBtn.disabled = false;
      // storeTokenBtn.disabled = false;

      // showStatus(encryptedStatus, 'Token encrypted successfully!', 'success');

      // Hide encryption animation after a delay
      // setTimeout(() => {
      //   encryptionAnimation.classList.add('hidden');
      // }, 1500);
    } catch (error) {
      // encryptionAnimation.classList.add('hidden');
      // showStatus(encryptedStatus, `Encryption error: ${error.message}`, 'error');
    }
  }
  async onDecryptToken() {
    const base64Data = this.encryptedToken();
    const ciphertext = base64ToArrayBuffer(base64Data);
    console.log("ciphertext", ciphertext);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      this.cryptoKey().privateKey,
      ciphertext
    );

    let dec = new TextDecoder();
    const decryptedValue = dec.decode(decrypted);

    console.log("decryptedValue",  decryptedValue);
    this.decryptedToken.set(decryptedValue);
  }
  onStoreToken() {
    /* ... */
  }
  onCopyEncrypted() {
    /* ... */
  }
  onCopyDecrypted() {
    /* ... */
  }

  onViewStoredTokens() {
    this.dialogService.open(TokenViewerComponent);
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
