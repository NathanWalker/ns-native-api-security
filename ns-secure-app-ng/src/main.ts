import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  runNativeScriptAngularApp,
} from "@nativescript/angular";
import { provideExperimentalZonelessChangeDetection } from "@angular/core";
import { withInterceptorsFromDi } from "@angular/common/http";
import { routes } from "./app/app.routes";
import { App } from "./app/app";
import { Utils } from "@nativescript/core";

runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    if (__APPLE__) {
      Utils.ios.setWindowBackgroundColor('#8b5cf6');
    }
    return bootstrapApplication(App, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        provideNativeScriptRouter(routes),
        provideExperimentalZonelessChangeDetection(),
      ],
    });
  },
});
