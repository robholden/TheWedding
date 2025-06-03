import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { ApiHttpService, AuthToken, ServerError } from '@shared';

@Component({
    selector: 'wed-login-page',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    imports: [ReactiveFormsModule, TranslateModule],
})
export default class LoginPage {
    error?: ServerError;

    readonly rsvpForm = new FormGroup({
        name: new FormControl('', Validators.required),
        dob: new FormControl('', Validators.required),
    });

    constructor(
        private api: ApiHttpService,
        private router: Router,
    ) {}

    async rsvp() {
        if (this.rsvpForm.invalid) {
            this.rsvpForm.markAllAsTouched();
            return;
        }

        this.rsvpForm.disable();
        this.error = null;

        const resp = await this.api.post<AuthToken>('/auth/rsvp', this.rsvpForm.value, { skipRefresh: true });

        if (resp instanceof ServerError) {
            this.rsvpForm.enable();
            this.error = resp;
            return;
        }

        this.api.expiresAt.set(resp.expiresAt);
        this.api.token.set(resp.token);

        const user = await this.api.verify();
        if (user instanceof ServerError) {
            this.rsvpForm.enable();
            this.error = user;
            return;
        }

        await this.router.navigateByUrl(user.isAdmin ? '/admin' : '/rsvp');
    }
}
