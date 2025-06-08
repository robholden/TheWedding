import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ApiHttpService } from './shared/apis/api-http.service';

@Component({
    selector: 'wed-root',
    templateUrl: './app.component.html',
    styles: [],
    imports: [RouterOutlet],
})
export class AppComponent {
    errored = false;

    constructor(public api: ApiHttpService) {
        api.init()
            .then()
            .catch(() => {
                this.errored = true;
                console.error('Failed to initialize API service.');
            });
    }
}
