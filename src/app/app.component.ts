import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
            console.log(event);

            if (event.constructor.name !== 'NavigationEnd') {
                return;
            }

            if (firstLoad) {
                firstLoad = false;
                return;
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
