import { Injectable } from '@angular/core';

import { tryDecode, isNullOrUndefined } from '../../app.functions';

@Injectable({ providedIn: 'root' })
export class SessionStorage {
    find<TValue>(key: string, def: TValue): TValue {
        let value = sessionStorage.getItem(key);
        return tryDecode<TValue>(value, def);
    }

    save<TValue>(key: string, value: TValue): void {
        if (isNullOrUndefined(value)) this.delete(key);
        else sessionStorage.setItem(key, JSON.stringify(value));
    }

    delete(key: string): void {
        sessionStorage.removeItem(key);
    }
}
