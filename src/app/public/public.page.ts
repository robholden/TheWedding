import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'wed-public-page',
    templateUrl: './public.page.html',
    styleUrl: './public.page.scss',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export default class PublicPage {
    menuOpen = false;

    readonly currentYear = new Date().getFullYear();

    goToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
