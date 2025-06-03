import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiHttpService } from '@shared';

export const authGuard = (route: any, state: any): boolean => {
    // Inject the ApiHttpService to check if the user is authenticated
    const api = inject(ApiHttpService);
    const router = inject(Router);
    const loggedIn = api.token() != null;

    if (!loggedIn) router.navigateByUrl('/login');
    return loggedIn;
};

export const loginGuard = (route: any, state: any): boolean => {
    // Inject the ApiHttpService to check if the user is authenticated
    const api = inject(ApiHttpService);
    const router = inject(Router);
    const loggedIn = api.token() != null;

    if (loggedIn) router.navigateByUrl('/rsvp');
    return !loggedIn;
};

export const adminGuard = (route: any, state: any): boolean => {
    // Inject the ApiHttpService to check if the user is an admin
    const api = inject(ApiHttpService);
    const router = inject(Router);
    const isAdmin = api.user()?.isAdmin;

    if (!isAdmin) router.navigateByUrl('/');
    return isAdmin;
};
