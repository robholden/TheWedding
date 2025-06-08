import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, Injector, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, Subject } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { SMap } from '../models/smap';
import { User } from '../models/user';
import { SignalStore } from '../storage/signal.store';

export class ServerError {
    constructor(
        public status: number,
        public statusText?: string,
    ) {}
}

export const isServerError = (result: any) => result instanceof ServerError;

export const parseApiResult = <T>(result: T | ServerError, valueOnError?: T): T => {
    if (result instanceof ServerError) return valueOnError;
    return result;
};

export type ApiOptions = {
    skipRefresh?: boolean;
    isAdmin?: boolean;
    isExternal?: boolean;
    timeout?: number;
};

export type AuthToken = { token: string; expiresAt: number };

@Injectable({
    providedIn: 'root',
})
export class ApiHttpService extends SignalStore {
    private refreshing: Subject<ServerError>;
    private calls: SMap<Subject<any | ServerError>> = {};
    private admin: string = sessionStorage.getItem('admin');
    private auth: string;

    readonly loaded = signal<boolean>(false);
    readonly user = signal<User>(null);
    readonly token = signal<string>(null);
    readonly expiresAt = signal<number>(null);

    constructor(
        injector: Injector,
        private http: HttpClient,
        private router: Router,
    ) {
        super(injector, 'auth_');
    }

    /**
     * Initializes the service by creating storage signals for token and expiresAt.
     */
    async init() {
        await Promise.all([this.createStorageSignal({ key: 'token', signal: this.token }), this.createStorageSignal({ key: 'expires_at', signal: this.expiresAt })]);

        // delay
        // await new Promise((resolve) => setTimeout(resolve, 5000));

        if (this.token()) {
            const user = await this.verify();
            if (user instanceof ServerError) {
                this.token.set(null);
                this.expiresAt.set(null);
            } else {
                this.user.set(user);
            }
        }

        this.loaded.set(true);
    }

    /**
     * Logs out the current user by clearing the token and expiration time.
     */
    logout() {
        this.token.set(null);
        this.expiresAt.set(null);
        this.user.set(null);

        this.router.navigateByUrl('/');
    }

    /**
     * Verifies the current user by making a request to the `/user/me` endpoint.
     *
     * @returns A promise that resolves to the current user or a ServerError if the user is not authenticated.
     */
    async verify() {
        const meta = await this.callMeta('/user/me', { skipRefresh: true });
        if (meta instanceof ServerError) return meta;

        const req = this.http.get<HttpResponse<User>>(meta.url, meta.options);
        const resp = await this.handleResponse<User>('/user/me', req);

        if (resp instanceof ServerError) return resp;

        this.user.set(resp);
        return resp;
    }

    /**
     * Constructs a `GET` request that interprets the body as a JSON object and returns
     * the response body in a given type.
     *
     * @param url The endpoint url
     * @param options The http options to send with the request
     */
    async get<T>(url: string, options?: ApiOptions): Promise<T | ServerError> {
        const meta = await this.callMeta(url, options);
        if (meta instanceof ServerError) return meta;

        const req = this.http.get<HttpResponse<T>>(meta.url, meta.options);
        return this.handleResponse(url, req, options);
    }

    /**
     * Constructs a `PUT` request that interprets the body as a JSON object and returns
     * the response body in a given type.
     *
     * @param url The endpoint url
     * @param body The resources to add/update.
     * @param options The http options to send with the request
     */
    async put<T>(url: string, body?: any, options?: ApiOptions): Promise<T | ServerError> {
        const meta = await this.callMeta(url, options);
        if (meta instanceof ServerError) return meta;

        const req = this.http.put<HttpResponse<T>>(meta.url, body, meta.options);
        return this.handleResponse(url, req, options);
    }

    /**
     * Constructs a `POST` request that interprets the body as a JSON object and returns
     * the response body in a given type.
     *
     * @param url The endpoint url
     * @param body The content to replace with.
     * @param options The http options to send with the request
     */
    async post<T>(url: string, body?: any, options?: ApiOptions): Promise<T | ServerError> {
        const meta = await this.callMeta(url, options);
        if (meta instanceof ServerError) return meta;

        const req = this.http.post<HttpResponse<T>>(meta.url, body, meta.options);
        return this.handleResponse(url, req, options);
    }

    /**
     * Constructs a `DELETE` request that interprets the body as a JSON object and returns
     * the response body in a given type.
     *
     * @param url The endpoint url
     * @param options The http options to send with the request
     */
    async delete<T>(url: string, options?: ApiOptions): Promise<T | ServerError> {
        const meta = await this.callMeta(url, options);
        if (meta instanceof ServerError) return meta;

        const req = this.http.delete<HttpResponse<T>>(meta.url, meta.options);
        return this.handleResponse(url, req, options);
    }

    private async callMeta(url: string, options?: ApiOptions): Promise<ServerError | { url: string; options: { headers: HttpHeaders } }> {
        options ??= {};

        let headers: HttpHeaders = new HttpHeaders();
        if (!options.isAdmin) {
            if (!options.skipRefresh) {
                const resp = await this.refreshAuth();
                if (resp instanceof ServerError) return resp;
            }

            if (!options.isExternal && this.token()) headers = headers.set('Authorization', `Bearer ${this.token()}`);
        } else {
            headers = this.getAdminHeaders();
            if (!headers) return new ServerError(403, 'Unauthorized access. Please provide admin credentials.');
        }

        const httpOptions = { headers, withCredentials: !options.isExternal };

        return { url: (options.isExternal ? '' : environment.apiUrl) + url, options: httpOptions };
    }

    async refreshAuth(): Promise<ServerError> {
        const expiresAt = this.expiresAt();
        const nowAtEpoch = Math.round(Date.now() / 1000);
        if (expiresAt && this.token() && expiresAt > nowAtEpoch) return null;

        // Ensure we have a token to refresh
        if (!this.token()) {
            this.refreshing?.next(new ServerError(401, 'Unauthorized'));
            return new ServerError(401, 'Unauthorized');
        }

        if (this.refreshing) {
            const ref = await new Promise<ServerError>((res) => this.refreshing.subscribe((ex) => res(ex)));
            return ref;
        }

        // Track inital token
        this.refreshing = new Subject<ServerError>();

        const meta = await this.callMeta('/auth/refresh', { skipRefresh: true });
        if (meta instanceof ServerError) return meta;

        const req = this.http.get<HttpResponse<AuthToken>>(meta.url, meta.options);
        const resp = await this.handleResponse<AuthToken>('/auth/refresh', req);

        this.refreshing.next(resp instanceof ServerError ? resp : null);
        this.refreshing = null;

        if (!(resp instanceof ServerError)) {
            this.token.set(resp.token);
            this.expiresAt.set(resp.expiresAt);
            return null;
        }

        return resp;
    }

    private async handleResponse<T>(url: string, obs: Observable<HttpResponse<T>>, options?: ApiOptions): Promise<T> {
        options ??= {};

        if (this.calls[url]) {
            return await new Promise<T>((res) => this.calls[url].subscribe((result) => res(result)));
        }

        const subject = new Subject<T>();
        this.calls[url] = subject;

        const resError = async (resolve: any, httpError: HttpErrorResponse) => {
            if (httpError?.status === 403 || httpError?.status === 401) this.token.set(null);

            const error = new ServerError(httpError.error?.status || httpError.status, 'api_errors.' + (httpError.error?.message || httpError.status || 'unknown'));

            resolve(error);
            subject.next(null);
        };

        return new Promise<T>((resolve) => {
            obs.pipe(
                timeout(options?.timeout || 15 * 1000),
                catchError(async (httpError: HttpErrorResponse) => {
                    await resError(resolve, httpError);
                    if (typeof httpError === 'string') console.error(httpError);
                }),
                tap(() => (this.calls[url] = null)),
            ).subscribe({
                next: (response: HttpResponse<T>) => {
                    resolve(response?.body || (response as T));
                    subject.next(response?.body || (response as T));
                },
                error: async (httpError: HttpErrorResponse) => await resError(resolve, httpError),
            });
        });
    }

    private getAdminHeaders(): HttpHeaders {
        if (!this.auth) {
            this.admin ??= prompt('Enter value');
            if (!this.admin) return null;

            sessionStorage.setItem('admin', this.admin);
            this.auth = btoa(this.admin + ':' + this.admin);
        }

        let headers = new HttpHeaders();
        headers = headers.append('Authorization', 'Basic ' + this.auth);

        return headers;
    }
}
