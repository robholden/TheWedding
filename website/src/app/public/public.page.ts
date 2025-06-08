import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ApiHttpService, setLocale } from '@shared';

@Component({
    selector: 'wed-public-page',
    templateUrl: './public.page.html',
    styleUrl: './public.page.scss',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
})
export default class PublicPage {
    menuOpen = false;

    readonly currentYear = new Date().getFullYear();

    readonly common = ['wedding', 'schedule', 'destination', 'faq'];
    readonly secure = ['details', 'gallery'];

    readonly trx = inject(TranslateService);
    readonly api = inject(ApiHttpService);
    readonly router = inject(Router);

    changeLang(lang: string) {
        this.trx.setDefaultLang(lang);
        setLocale(lang);
    }

    goToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
