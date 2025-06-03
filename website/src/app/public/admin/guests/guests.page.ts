import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ApiHttpService, Information, isServerError, localize, parseApiResult, ServerError, User } from '@shared';

@Component({
    selector: 'wed-guests-page',
    templateUrl: './guests.page.html',
    styleUrls: ['./guests.page.scss'],
    imports: [DatePipe, FormsModule, ReactiveFormsModule],
})
export default class GuestsPage {
    private _all = signal<User[]>(null);

    importing: boolean;
    info: Information;

    readonly editing = signal<User>(null);
    readonly editingForm: FormGroup = new FormGroup({
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required),
        nickname: new FormControl(''),
        email: new FormControl('', Validators.email),
        dob: new FormControl<Date>(null, Validators.required),
        plusOneId: new FormControl<string | null>(null),
    });

    readonly selected = signal<User>(null);
    readonly activeView = signal<boolean>(null);

    readonly filter = signal<string>('');
    readonly users = computed(() => {
        let requests = this._all();

        const activeView = this.activeView();
        if (activeView !== null) requests = requests?.filter((cr) => cr.disabled === !activeView);

        const filter = this.filter();
        if (!filter) return requests;
        return requests.filter((cr) => cr.name?.toLowerCase().includes(filter.toLowerCase()) || cr.email?.toLowerCase().includes(filter.toLowerCase()));
    });

    readonly trx = inject(TranslateService);

    constructor(private api: ApiHttpService) {
        this.get();

        effect(() => {
            this.editingForm.reset();

            const editing = this.editing();
            if (!editing) return;

            this.editingForm.patchValue({
                firstName: editing.firstName,
                lastName: editing.lastName,
                nickname: editing.nickname,
                email: editing.email,
                dob: editing.dob,
                plusOneId: editing.plusOneId || null,
            });

            if (editing.plusOnes?.length > 0) {
                this.editingForm.controls['plusOneId'].disable();
            } else {
                this.editingForm.controls['plusOneId'].enable();
            }
        });

        effect(() => {
            const user = this.selected();
            if (user) this.getInfo(user.id);
        });
    }

    async get() {
        this._all.set(null); // Reset the users list before fetching

        const users = await this.api.get<User[]>('/admin/user', { isAdmin: true });
        this._all.set(parseApiResult(users, []).filter((u) => !u.isAdmin));
    }

    edit(user?: User) {
        this.editing.set(
            user || {
                firstName: '',
                lastName: '',
                nickname: '',
                email: '',
                disabled: false,
                dob: null,
            },
        );
    }

    async import(file: File, el: any) {
        // Parse a csv file with user data.
        if (!file) return;

        // Get the text from the file
        const text = await file.text();
        if (!text) return;

        // Split the text into lines
        const lines = text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const users: User[] = [];
        for (const line of lines.slice(1)) {
            const parts = line.split(',').map((part) => part.trim());
            if (parts.length < 5) continue; // Skip lines that don't have enough data

            const user: User = {
                firstName: parts[0],
                lastName: parts[1],
                nickname: parts[2] || '',
                email: parts[3],
                dob: parts[4],
                disabled: false,
                plusOneId: parts[5] || null,
            };

            users.push(user);
        }

        // Add users to server
        this.importing = true;

        let prevId: string;
        for (const user of users) {
            if (user.plusOneId && prevId) user.plusOneId = prevId;

            const resp = await this.api.post<User>(`/admin/user`, user, { isAdmin: true });
            const createdUser = parseApiResult(resp, user);
            if (createdUser.id) prevId = createdUser.id; // Save the last created user ID for plusOne
        }

        this.importing = false;
        this.get();

        el.value = '';
    }

    async saveUser() {
        if (!this.editingForm.valid) return;

        const user: User = {
            ...this.editing(),
            ...this.editingForm.value,
        };

        const resp = await this.api.post<User>(`/admin/user`, user, { isAdmin: true });
        if (resp instanceof ServerError) {
            alert(localize(resp.statusText, this.trx));
            return;
        }

        this.editing.set(null);
        this.get();
    }

    async toggleDisable(user: User) {
        const confirm = window.confirm('Are you sure you want to do this?');
        if (!confirm) return;

        const resp = await this.api.put<User>(`/admin/user/${user.id}/activeness`, null, { isAdmin: true });
        user.disabled = parseApiResult(resp, user).disabled;
    }

    async deleteUser(user: User) {
        const confirm = window.confirm('Are you sure you want to do this?');
        if (!confirm) return;

        const resp = await this.api.delete<void>(`/admin/user/${user.id}`, { isAdmin: true });
        if (!isServerError(resp)) this._all.update((users) => users.filter((cr) => cr.id !== user.id));
    }

    private async getInfo(userId: string) {
        const info = await this.api.get<Information>(`/admin/user/${userId}/info`, { isAdmin: true });
        this.info = parseApiResult(info, {});
    }
}
