import { inject, Injectable, signal } from "@angular/core";
import { Sqlite } from "./sqlite";

@Injectable({
  providedIn: "root",
})
export class Tokens {
  sqlite = inject(Sqlite);
  storedTokens = signal<{ token: string; name: string }[]>([]);

  constructor() {
    this.sqlite.getItem("tokens").then((tokens) => {
      if (tokens) {
        console.log("Stored tokens:", tokens, tokens.length);
        this.storedTokens.set([...tokens]);
      }
    });
  }
}
