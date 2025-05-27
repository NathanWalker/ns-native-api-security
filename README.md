## Frontend Nation 2025, Native API Security with NativeScript

This repo provides working examples to the talk discussing the runtime context of JavaScript and the security implications of the browser context weighed against the NativeScript context.

1. Common web approach example, [index.html](index.html), of generating keys with Web Crypto API to encrypt a token with and store within a browser storage mechanism; in this example: IndexedDB. The talk demonstrates why that's a bad idea!

2. The same approach using NativeScript, [ns-secure-app-ng](ns-secure-app-ng), to distinguish how common security concerns with JavaScript in the browser context are wiped away due to the more secure nature of the device context, however the talk demonstrates how to address the remaining security concerns, discussing how being armed with NativeScript means strengthening your JavaScript as well.
