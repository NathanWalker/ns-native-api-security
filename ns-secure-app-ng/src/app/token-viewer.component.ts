import { Component, inject, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { TokenService } from "./token.service";

@Component({
  selector: "ns-token-viewer",
  templateUrl: "./token-viewer.component.html",
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TokenViewerComponent {
  tokenService = inject(TokenService);
  onRefreshList() {
    /* ... */
  }
  onClearAll() {
    /* ... */
  }
}
