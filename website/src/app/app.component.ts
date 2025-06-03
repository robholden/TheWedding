import { Component, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiHttpService } from './shared/apis/api-http.service';

@Component({
    selector: 'wed-root',
    templateUrl: './app.component.html',
    styles: [],
    imports: [RouterOutlet],
})
export class AppComponent {
    loaded = false;
    errored = false;

    constructor(api: ApiHttpService) {
        api.init()
            .then(() => (this.loaded = true))
            .catch(() => {
                this.errored = true;
                console.error('Failed to initialize API service.');
            });
    }
}
