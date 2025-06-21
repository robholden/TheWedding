import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, TitleStrategy, withComponentInputBinding, withPreloading, withRouterConfig } from '@angular/router';

import { PageTitleStrategy } from './app-title-strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            routes,
            withPreloading(PreloadAllModules),
            withRouterConfig({
                paramsInheritanceStrategy: 'always',
            }),
            withComponentInputBinding(),
        ),
        // provideZoneChangeDetection({
        //     eventCoalescing: true,
        // }),
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: TitleStrategy,
            useClass: PageTitleStrategy,
        },
    ],
};
