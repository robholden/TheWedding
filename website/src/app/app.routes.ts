import { Routes } from '@angular/router';
import { appGuard } from './app.guards';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./public/public.routes'),
        canActivateChild: [appGuard],
    },
    {
        path: '**',
        redirectTo: '/',
        pathMatch: 'full',
    },
];
