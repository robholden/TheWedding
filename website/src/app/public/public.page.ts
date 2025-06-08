import { Component, computed, inject, OnInit } from '@angular/core';
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
export default class PublicPage implements OnInit {
    menuOpen = false;

    readonly currentYear = new Date().getFullYear();

    readonly common = ['bio', 'wedding', 'schedule', 'destination', 'faq'];
    readonly secure = ['details', 'gallery'];

    readonly trx = inject(TranslateService);
    readonly api = inject(ApiHttpService);
    readonly router = inject(Router);

    readonly isLogin = createRouteWatch(this.router, 'login');
    readonly isRsvp = createRouteWatch(this.router, 'rsvp');
    readonly isAdmin = createRouteWatch(this.router, 'admin');

    readonly isCompact = computed(() => this.isLogin() || this.isRsvp() || this.isAdmin());

    ngOnInit(): void {
        setTimeout(() => {
            const pathname = location.pathname?.substring(1);
            if (this.common.includes(pathname)) this.goToContent();
        });
    }

    changeLang(lang: string) {
        this.trx.setDefaultLang(lang);
        setLocale(lang);
    }

    goToContent() {
        this.menuOpen = false;
        setTimeout(() => {
            const element = document.getElementById('page-content');
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}
