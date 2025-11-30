import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BackendError, BackendService, QuestionAnswer } from './backend.service';

const genders = ['Male', 'Female', 'Other'] as const;
const idTypes = ['Passport No.', 'Aadhaar No.', 'Driving License No.', 'Voters Id', 'Birth Certificate No.'] as const;
const foreignIds = ['VISA No.', 'OCI No.'];
const mealTypes = ['Non-Vegetarian', 'Vegetarian'] as const;

type Gender = (typeof genders)[number];
type IdType = (typeof idTypes)[number];
type ForeignId = (typeof foreignIds)[number];
type MealType = (typeof mealTypes)[number];

@Component({
    selector: 'wed-30th-page',
    templateUrl: './30th.page.html',
    styleUrls: ['./30th.page.scss'],
    imports: [ReactiveFormsModule, NgTemplateOutlet],
})
export default class ThirtiethPage {
    submitted: boolean = false;

    id: string;
    pending: boolean;
    cruiseOnly: boolean;
    saveCode: string;

    showFortKochi: boolean = true;
    showCruise: boolean = true;

    readonly genderList = genders;
    readonly idTypeList = idTypes;
    readonly foreignIdList = foreignIds;
    readonly mealTypeList = mealTypes;

    readonly userForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        fortKochi: new FormControl<boolean>(true),
        cruise: new FormControl<boolean>(true),
    });

    readonly fortKochiReasonForm = new FormGroup({
        reason: new FormControl<string>('', [Validators.maxLength(500)]),
    });

    readonly cruiseReasonForm = new FormGroup({
        reason: new FormControl<string>('', [Validators.maxLength(500)]),
    });

    readonly fortKochiJoinForm = new FormGroup({
        other: new FormControl<string>('', [Validators.maxLength(500)]),
    });

    readonly cruiseJoinForm = new FormGroup({
        fullName: new FormControl<string>('', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
        age: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(150)]),
        gender: new FormControl<Gender | null>(null, [Validators.required]),
        idType: new FormControl<IdType | null>(null, [Validators.required]),
        idValue: new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
        foreignerId: new FormControl<ForeignId | null>(null, [Validators.required]),
        foreignerNo: new FormControl<string>('', [Validators.maxLength(100)]),
        mealType: new FormControl<MealType | null>(null, [Validators.required]),
        other: new FormControl<string>('', [Validators.maxLength(500)]),
    });

    get fortKochiForm(): FormGroup {
        return this.userForm.value.fortKochi ? this.fortKochiJoinForm : this.fortKochiReasonForm;
    }

    get cruiseForm(): FormGroup {
        return this.userForm.value.cruise ? this.cruiseJoinForm : this.cruiseReasonForm;
    }

    get submittedUrl(): string {
        // Return the current page URL without query parameters
        return window.location.origin + this.router.url.split('?')[0];
    }

    constructor(
        activatedRoute: ActivatedRoute,
        private router: Router,
        private backend: BackendService,
    ) {
        activatedRoute.params.subscribe((params) => {
            this.id = params['id'];
            this.cruiseOnly = this.id !== 'events';

            this.saveCode = params['saveCode'] || '';
            if (this.saveCode) this.getPreviousAnswers();
        });

        activatedRoute.queryParams.subscribe((queryParams) => {
            this.submitted = queryParams['submitted'] === 'true';
        });
    }

    async submit() {
        this.userForm.markAllAsTouched();
        this.fortKochiForm.markAllAsTouched();
        this.cruiseForm.markAllAsTouched();

        if (this.userForm.invalid || this.cruiseForm.invalid || (!this.cruiseOnly && this.fortKochiForm.invalid)) {
            return;
        }

        this.pending = true;

        const answers: QuestionAnswer[] = [];

        Object.entries(this.userForm.value).forEach(([question, answer]: [string, any]) => {
            answers.push({
                id: 0,
                question,
                answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                category: 'User',
                userId: this.userForm.value.email!,
            });
        });

        if (!this.cruiseOnly) {
            Object.entries(this.fortKochiForm.value).forEach(([question, answer]: [string, any]) => {
                answers.push({
                    id: 0,
                    question,
                    answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                    category: 'Fort Kochi',
                    userId: this.userForm.value.email!,
                });
            });
        }

        Object.entries(this.cruiseForm.value).forEach(([question, answer]: [string, any]) => {
            answers.push({
                id: 0,
                question,
                answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                category: 'Cruise',
                userId: this.userForm.value.email!,
            });
        });

        const result = await this.backend.submitAnswers(answers, this.saveCode);
        if (result instanceof BackendError) {
            this.pending = false;
            return;
        }

        this.router.navigate(['/30th', this.id, result.saveCode], { queryParams: { submitted: 'true' } });

        this.pending = false;
    }

    async getPreviousAnswers() {
        this.pending = true;
        const answers = await this.backend.getAnswers(this.saveCode);

        if (answers instanceof BackendError || answers.length === 0) {
            this.saveCode = null;
            this.pending = false;
            return;
        }

        const ud = answers.filter((a) => a.category === 'user');
        ud.forEach((a) => this.userForm.patchValue({ [a.question]: this.tryParseAnswer(a.answer) }));

        const fk = answers.filter((a) => a.category === 'fort-kochi');
        fk.forEach((a) => this.fortKochiForm.patchValue({ [a.question]: this.tryParseAnswer(a.answer) }));

        const cruise = answers.filter((a) => a.category === 'cruise');
        cruise.forEach((a) => this.cruiseForm.patchValue({ [a.question]: this.tryParseAnswer(a.answer) }));

        this.pending = false;
    }

    private tryParseAnswer(answer: string): any {
        try {
            return JSON.parse(answer);
        } catch {
            return answer;
        }
    }
}
