import { Routes } from '@angular/router';

import { adminGuard, authGuard, loginGuard } from 'src/app/app.guards';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./public.page'),

        children: [
            {
                path: '',
                loadComponent: () => import('./bio/bio.page'),
            },
            {
                path: 'schedule',
                loadComponent: () => import('./schedule/schedule.page'),
            },
            {
                path: 'destination',
                loadComponent: () => import('./destination/destination.page'),
            },
            {
                path: 'faq',
                loadComponent: () => import('./faq/faq.page'),
            },
            {
                path: 'login',
                loadComponent: () => import('./login/login.page'),
                canActivate: [loginGuard],
            },
            {
                path: 'rsvp',
                loadChildren: () => import('./secure/secure.routes'),
                canActivateChild: [authGuard],
            },
            {
                path: 'admin',
                loadChildren: () => import('./admin/admin.routes'),
                canActivateChild: [adminGuard],
            },
        ],
    },
];

export default routes;
