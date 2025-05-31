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
