import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideAppInitializer } from '@angular/core';
import { PreloadAllModules, provideRouter, TitleStrategy, withComponentInputBinding, withPreloading, withRouterConfig } from '@angular/router';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageTitleStrategy } from './app-title-strategy';
import { routes } from './app.routes';
import { createTrxLoader, getDeviceLanguage, getLocale } from './shared/localization/create-trx-loader.fn';

function initializeAppFactory(): () => Promise<any> {
    return async () => await getDeviceLanguage();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideAppInitializer(() => {
            const initializerFn = initializeAppFactory();
            return initializerFn();
        }),
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
        importProvidersFrom(
            TranslateModule.forRoot({
                loader: {
                    provide: TranslateLoader,
                    useFactory: createTrxLoader,
                    deps: [HttpClient],
                },
            }),
        ),
        { provide: LOCALE_ID, useFactory: getLocale, deps: [TranslateService] },
        // { provide: LocationStrategy, useClass: HashLocationStrategy },
    ],
};
