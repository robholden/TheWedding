import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'guests',
        loadComponent: () => import('./guests/guests.page'),
        title: 'Manage Guests',
    },
    {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'guests',
    },
];

export default routes;
