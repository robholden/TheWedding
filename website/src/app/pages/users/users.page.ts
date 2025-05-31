import { DatePipe } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiHttpService, Information, isServerError, parseApiResult, User } from '@shared';

@Component({
    selector: 'wed-users-page',
    templateUrl: './users.page.html',
    styleUrls: ['./users.page.scss'],
    imports: [DatePipe, FormsModule],
})
export default class UsersPage {
    private _all = signal<User[]>(null);

    info: Information;

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

    constructor(private api: ApiHttpService) {
        this.get();

        effect(() => {
            const user = this.selected();
            if (user) this.getInfo(user.id);
        });
    }

    async get() {
        const users = await this.api.get<User[]>('/admin/user', { isAdmin: true });
        this._all.set(parseApiResult(users, []));
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

        const resp = await this.api.delete<void>(`/admin/user/${user.id}`);
        if (!isServerError(resp)) this._all.update((users) => users.filter((cr) => cr.id !== user.id));
    }

    private async getInfo(userId: string) {
        const info = await this.api.get<Information>(`/admin/user/${userId}/info`, { isAdmin: true });
        this.info = parseApiResult(info, {});
    }
}
