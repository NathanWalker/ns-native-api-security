import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class TokenService {
  storedTokens = signal<string[]>([]);
}
