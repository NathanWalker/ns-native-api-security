import { Component, effect, inject, NO_ERRORS_SCHEMA, signal } from "@angular/core";
import { PageRouterOutlet, registerElement } from "@nativescript/angular";
import { RiveView } from "@nativescript/rive";
import { Biometric } from "./biometric";
registerElement("RiveView", () => RiveView);

@Component({
  selector: "ns-app",
  templateUrl: "./app.html",
  imports: [PageRouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class App {
  biometric = inject(Biometric);
  showLock = signal(false);

  constructor() {
    effect(() => {
      if (this.biometric.isStoredSecurely()) {
        this.showLock.set(true);
        setTimeout(() => {
          this.showLock.set(false);
        }, 2600);
      }
    });
  }
}
