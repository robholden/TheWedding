import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'details',
        loadComponent: () => import('./details/details.page'),
    },
    {
        path: 'gallery',
        loadComponent: () => import('./gallery/gallery.page'),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'details',
    },
];

export default routes;
