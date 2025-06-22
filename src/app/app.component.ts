import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'wed-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class AppComponent {
    menuOpen = false;

    readonly currentYear = new Date().getFullYear();

    constructor(router: Router) {
        // Track first load
        let firstLoad = true;

        // After navigation, scroll to the top of the page
        router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) {
                return;
            }

            if (firstLoad) {
                firstLoad = false;
                return;
            }

            this.menuOpen = false;
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        });
    }
}
