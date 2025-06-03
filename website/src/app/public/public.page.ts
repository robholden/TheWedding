import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { createRouteWatch } from 'src/app/app.functions';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ApiHttpService, setLocale } from '@shared';

@Component({
    selector: 'wed-public-page',
    templateUrl: './public.page.html',
    styleUrl: './public.page.scss',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
})
export default class PublicPage {
    readonly currentYear = new Date().getFullYear();

    readonly common = ['', 'schedule', 'destination', 'faq'];
    readonly secure = ['details', 'gallery'];

    readonly trx = inject(TranslateService);
    readonly api = inject(ApiHttpService);
    readonly router = inject(Router);

    readonly isLogin = createRouteWatch(this.router, 'login');
    readonly isRsvp = createRouteWatch(this.router, 'rsvp');
    readonly isAdmin = createRouteWatch(this.router, 'admin');

    readonly isCompact = computed(() => this.isLogin() || this.isRsvp() || this.isAdmin());

    changeLang(lang: string) {
        this.trx.setDefaultLang(lang);
        setLocale(lang);
    }
}
