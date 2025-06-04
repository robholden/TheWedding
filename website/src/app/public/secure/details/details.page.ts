import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ApiHttpService, localize, ServerError, SMap, User } from '@shared';

@Component({
    selector: 'wed-details-page',
    templateUrl: './details.page.html',
    styleUrls: ['./details.page.scss'],
    imports: [TranslateModule, ReactiveFormsModule, DatePipe],
})
export default class DetailsPage {
    users: User[] = [];

    readonly forms: SMap<
        FormGroup<{
            firstName: FormControl<string>;
            lastName: FormControl<string>;
            nickname: FormControl<string>;
            email: FormControl<string>;
            dob: FormControl<Date | string>;
        }>
    > = {};

    readonly trx = inject(TranslateService);

    constructor(private api: ApiHttpService) {
        this.users = [api.user(), ...(api.user().plusOnes || [])];
    }

    edit(user: User) {
        this.forms[user.id] = new FormGroup({
            firstName: new FormControl(user.firstName, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
            lastName: new FormControl(user.lastName, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
            nickname: new FormControl(user.nickname, [Validators.minLength(2), Validators.maxLength(100)]),
            email: new FormControl(user.email, [Validators.email, Validators.minLength(5), Validators.maxLength(300)]),
            dob: new FormControl(user.dob, Validators.required),
        });
    }

    cancel(user: User) {
        delete this.forms[user.id];
    }

    async save(user: User) {
        const form = this.forms[user.id];
        if (!form || !form.valid) {
            return;
        }

        const updatedUser: User = {
            ...user,
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            nickname: form.value.nickname,
            email: form.value.email,
            dob: form.value.dob,
        };

        form.disable();
        const resp = await this.api.put<User>(`/user/${user.id}`, updatedUser);
        form.enable();

        if (resp instanceof ServerError) {
            alert(localize(resp.statusText, this.trx));
            return;
        }

        delete this.forms[user.id];
        this.users = this.users.map((u) => (u.id === user.id ? resp : u));
    }
}
