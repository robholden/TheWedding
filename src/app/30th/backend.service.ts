import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type QuestionAnswer = {
    id: number;
    emailId: string;
    userId: string;
    question: string;
    answer: string;
    category: 'User' | 'Fort Kochi' | 'Cruise';
    submittedAt?: Date;
};

export class BackendError {
    constructor(public message: string) {}
}

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    constructor(private http: HttpClient) {}

    async getAnswers(saveCode: string) {
        return await this.wrapObservableWithErrorCatch(this.http.get<QuestionAnswer[]>(`${environment.apiUrl}/answers/${saveCode}`));
    }

    async submitAnswers(answers: QuestionAnswer[], saveCode: string) {
        return await this.wrapObservableWithErrorCatch(this.http.post<{ saveCode: string }>(`${environment.apiUrl}/answers${saveCode ? `?saveCode=${saveCode}` : ''}`, answers));
    }

    private async wrapObservableWithErrorCatch<T>(observable: Observable<T>): Promise<T | BackendError> {
        try {
            return await firstValueFrom(observable);
        } catch (error) {
            window.alert('An error occurred while communicating with the server. Please try again later.');
            return new BackendError('Server communication error');
        }
    }
}
