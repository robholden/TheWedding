import { HttpClient } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export const supportedLanguages = [
    { name: 'English', locale: 'en' },
    { name: 'Malayalam', locale: 'in-ml' },
];
const locales = supportedLanguages.map((l) => l.locale);

var locale = 'en';

export function createTrxLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function getLocale(translate: TranslateService) {
    let lang = 'en';
    try {
        if (locales.some((l) => l.toLowerCase() === locale.toLowerCase())) lang = locale;
    } catch (err) {}

    translate.addLangs(locales);
    translate.setDefaultLang(lang);

    return lang;
}

export const setLocale = async (lang: string) => {
    lang ??= await getDeviceLanguage();
    locale = lang;
    localStorage.setItem('locale', locale);
};

export const getDeviceLanguage = async () => {
    try {
        locale = localStorage.getItem('locale');
        if (!locale) {
            locale = navigator.language || navigator['userLanguage'] || 'en';
            locale = locale.toLowerCase().replace('_', '-');

            // Default any 'en-*' to 'en'
            if (locale.startsWith('en-')) {
                locale = 'en';
            } else if (!locales.includes(locale)) {
                locale = 'en'; // Fallback to English if unsupported
            }

            localStorage.setItem('locale', locale);
        }
    } catch (err) {}

    return locale;
};
