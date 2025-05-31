import { effect, Injector, signal, WritableSignal } from '@angular/core';

import { SessionStorage } from './session.storage';

export class SignalStore {
    private storage: SessionStorage;

    constructor(
        protected injector: Injector,
        private prefix: string,
    ) {
        this.storage = injector.get(SessionStorage);
    }

    createStorageSignal = async <T>(options: { key: string; default?: T; signal?: WritableSignal<T> }) => {
        // Create signal
        const key = `${this.prefix}${options.key}`;
        const sig = options.signal || signal<T>(undefined);

        // Get & set default value for signal
        const value = await this.storage.find<T>(key, options?.default || (options?.signal ? options.signal() : undefined));
        sig.set(value);

        // Store properties when it changes
        let init = true;
        effect(
            () => {
                const newValue = sig();
                if (init) {
                    init = false;
                    return;
                }

                this.storage.save(key, newValue);
            },
            { injector: this.injector },
        );

        return sig;
    };
}
