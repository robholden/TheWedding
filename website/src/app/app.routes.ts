import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home.page'),
    },
    {
        path: 'admin/users',
        loadComponent: () => import('./pages/users/users.page'),
    },
    {
        path: '**',
        redirectTo: '/',
        pathMatch: 'full',
    },
];
