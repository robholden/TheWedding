import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { ApiHttpService, User } from '@shared';

@Component({
    selector: 'wed-details-page',
    templateUrl: './details.page.html',
    styleUrls: ['./details.page.scss'],
    imports: [TranslateModule],
})
export default class DetailsPage {
    readonly users: User[] = [];

    constructor(private api: ApiHttpService) {
        this.users = [api.user(), ...(api.user().plusOnes || [])];
    }
}
