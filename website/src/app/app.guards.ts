import { inject } from '@angular/core';

import { ApiHttpService } from '@shared';

export const authGuard = (route: any, state: any): boolean => {
    // Inject the ApiHttpService to check if the user is authenticated
    const api = inject(ApiHttpService);
    return api.token() != null;
};
