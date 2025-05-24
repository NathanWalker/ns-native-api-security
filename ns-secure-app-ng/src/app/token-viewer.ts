import { Component, inject, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Tokens } from "./tokens";
import { Sqlite } from "./sqlite";
import { Dialogs, ItemEventData } from "@nativescript/core";

@Component({
  selector: "ns-token-viewer",
  templateUrl: "./token-viewer.html",
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TokenViewer {
  tokens = inject(Tokens);
  sqlite = inject(Sqlite);

  constructor() {
    this.onRefreshList();
  }
  onRefreshList() {
    this.sqlite.getItem("tokens").then((tokens) => {
      if (tokens) {
        console.log("Stored tokens:", tokens, tokens.length);
        this.tokens.storedTokens.set([...tokens]);
      }
    });
  }
  onClearAll() {
    Dialogs.confirm({
      title: "Clear All Tokens",
      message: "Are you sure you want to clear all tokens?",
      okButtonText: "Yes",
      cancelButtonText: "Cancel",
    }).then((ok) => {
      if (!ok) {
        return;
      }
      this.sqlite.clearTable("tokens");
      this.tokens.storedTokens.set([]);
    });
  }

  onTokenTap(evt: ItemEventData) {
    const data = this.tokens.storedTokens()[evt.index];
    Dialogs.alert({
      title: "Token Selected",
      message: data.token,
      okButtonText: "OK",
    });
  }
}
