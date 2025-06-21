import { Routes } from '@angular/router';

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
                path: 'bio',
                title: 'The Couple',
                loadComponent: () => import('./bio/bio.page'),
            },
            {
                path: 'wedding',
                title: 'The Wedding',
                loadComponent: () => import('./wedding/wedding.page'),
            },
            {
                path: 'schedule',
                title: 'Schedule',
                loadComponent: () => import('./schedule/schedule.page'),
            },
            {
                path: 'destination',
                title: 'Destination',
                loadComponent: () => import('./destination/destination.page'),
            },
            {
                path: 'faq',
                title: 'FAQ',
                loadComponent: () => import('./faq/faq.page'),
            },
        ],
    },
];

export default routes;
