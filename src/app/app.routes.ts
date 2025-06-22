import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
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
        path: 'hotel',
        title: 'Hotel',
        loadComponent: () => import('./hotel/hotel.page'),
    },
    {
        path: 'destination',
        title: 'Destination',
        loadComponent: () => import('./destination/destination.page'),
    },
    {
        path: 'rsvp',
        title: 'RSVP',
        loadComponent: () => import('./rsvp/rsvp.page'),
    },
    {
        path: 'gallery',
        title: 'Gallery',
        loadComponent: () => import('./gallery/gallery.page'),
    },
    {
        path: '**',
        redirectTo: '/',
        pathMatch: 'full',
    },
];
