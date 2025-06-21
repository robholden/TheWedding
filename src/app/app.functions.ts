import { effect, signal } from '@angular/core';
import { ActivationEnd, NavigationStart, Router } from '@angular/router';

export const didResolve = async (prom: () => Promise<any | void>): Promise<boolean> => {
    try {
        await prom();
        return true;
    } catch (err) {
        return false;
    }
};

export const tryDecode = <T>(json: string, def: T = null) => {
    if (!json) return def;

    try {
        return JSON.parse(json) as T;
    } catch (err) {
        console.log(err);
        return def;
    }
};

export const tryEncode = <T>(payload: T, def: string = '') => {
    try {
        return JSON.stringify(payload);
    } catch (err) {
        console.log(err);
        return def;
    }
};

export const isNullOrUndefined = (value: any) => value === null || typeof value === 'undefined';

export const ifNotSetThen = (value: any, defaultValue: any) => (isNullOrUndefined(value) ? defaultValue : value);

export const fixValue = (value: number) => +(value || 0).toFixed(1);

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const clone = <T>(value: T): T => (!value ? null : JSON.parse(JSON.stringify(value)));

export const createRouteWatch = (router: Router, route: string) => {
    const root = signal<boolean>(false);
    const paths = signal<string[]>([]);

    effect(() => {
        const p = paths();
        root.set(p.length > 0 && p[0] === route);
    });

    // Listen for page change and match route on /admin
    router.events.subscribe((event) => {
        if (event instanceof NavigationStart) paths.set([]);
        if (event instanceof ActivationEnd) {
            const path = event.snapshot.routeConfig?.path;
            if (path) paths.update((p) => [path, ...p]);
        }
    });

    return root;
};
