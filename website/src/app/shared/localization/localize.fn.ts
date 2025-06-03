import { TranslateService } from '@ngx-translate/core';

export const localize = (key: string | { key: string; params: any }, trx: TranslateService): string => trx.instant(typeof key === 'string' ? key : key.key, key?.['params'] || {});
