import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class PageTitleStrategy extends TitleStrategy {
    readonly trx = inject(TranslateService);

    constructor(private readonly title: Title) {
        super();
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const slug = routerState.url.split('/').pop() || this.buildTitle(routerState) || '';
        const title = this.trx.instant('title');
        const pageKey = `pages.${slug}.title`;

        let page = this.trx.instant(pageKey);
        if (page === pageKey) page = slug?.includes('.') ? '' : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        this.title.setTitle(`${title}${page ? ' - ' + page : ''}`);
    }
}
