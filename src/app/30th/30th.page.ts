import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BackendError, BackendService, QuestionAnswer } from './backend.service';

const genders = ['Male', 'Female', 'Other'] as const;
const idTypes = ['Passport No.', 'Aadhaar No.', 'Driving License No.', 'Voters Id', 'Birth Certificate No.'] as const;
const foreignIds = ['Not Applicable', 'VISA No. (ETA)', 'OCI No.'];
const mealTypes = ['Non-Vegetarian', 'Vegetarian'] as const;

type Gender = (typeof genders)[number];
type IdType = (typeof idTypes)[number];
type ForeignId = (typeof foreignIds)[number];
type MealType = (typeof mealTypes)[number];

type UserForms = {
    data: FormGroup<{
        name: FormControl<string>;
        fortKochi: FormControl<boolean>;
        cruise: FormControl<boolean>;
    }>;

    fortKochi: {
        reason: FormGroup<{
            reason: FormControl<string>;
        }>;
        join: FormGroup<{
            other: FormControl<string>;
        }>;
    };

    cruise: {
        reason: FormGroup<{
            reason: FormControl<string>;
        }>;
        join: FormGroup<{
            age: FormControl<number | null>;
            gender: FormControl<Gender | null>;
            idType: FormControl<IdType | null>;
            idValue: FormControl<string>;
            foreignerId: FormControl<ForeignId | null>;
            foreignerNo: FormControl<string>;
            mealType: FormControl<MealType | null>;
            other: FormControl<string>;
        }>;
    };
};

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
    missing: boolean = false;

    showFortKochi: boolean = true;
    showCruise: boolean = true;

    guestHideMap: { [key: string]: boolean } = {};

    readonly mainForm = new FormGroup({
        email: new FormControl<string>('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    });

    readonly genderList = genders;
    readonly idTypeList = idTypes;
    readonly foreignIdList = foreignIds;
    readonly mealTypeList = mealTypes;

    readonly users = signal<string[]>([]);
    readonly userFormMap = signal<{ [key: string]: UserForms }>({});

    readonly userFormMapLookup = computed(() => {
        const users = this.users();
        const map = this.userFormMap();

        return users.reduce(
            (mm, _, index) => {
                const form = map[index];
                const data = {
                    data: form.data,
                    fortKochi: this.cruiseOnly ? null : form.data.value.fortKochi ? form.fortKochi.join : form.fortKochi.reason,
                    cruise: form.data.value.cruise ? form.cruise.join : form.cruise.reason,
                };

                mm[index] = data;
                return mm;
            },
            {} as { [key: string]: any },
        );
    });

    get submittedUrl(): string {
        // Return the current page URL without query parameters
        return window.location.origin + this.router.url.split('?')[0];
    }

    constructor(
        activatedRoute: ActivatedRoute,
        private router: Router,
        private backend: BackendService,
    ) {
        effect(() => {
            const users = this.users();
            users.forEach((_, index) => {
                if (this.userFormMap()[index]) return;

                const form: UserForms = {
                    data: new FormGroup({
                        name: new FormControl<string>('', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
                        fortKochi: new FormControl<boolean>(null, this.cruiseOnly ? [] : [Validators.required]),
                        cruise: new FormControl<boolean>(null, [Validators.required]),
                    }),
                    fortKochi: {
                        reason: new FormGroup({
                            reason: new FormControl<string>('', [Validators.maxLength(500)]),
                        }),
                        join: new FormGroup({
                            other: new FormControl<string>('', [Validators.maxLength(500)]),
                        }),
                    },
                    cruise: {
                        reason: new FormGroup({
                            reason: new FormControl<string>('', [Validators.maxLength(500)]),
                        }),
                        join: new FormGroup({
                            age: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(150)]),
                            gender: new FormControl<Gender | null>(null, [Validators.required]),
                            idType: new FormControl<IdType | null>(null, [Validators.required]),
                            idValue: new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
                            foreignerId: new FormControl<ForeignId | null>(null, [Validators.required]),
                            foreignerNo: new FormControl<string>('', [Validators.maxLength(100), Validators.required]),
                            mealType: new FormControl<MealType | null>(null, [Validators.required]),
                            other: new FormControl<string>('', [Validators.maxLength(500)]),
                        }),
                    },
                };

                form.cruise.join.controls.foreignerId.valueChanges.subscribe((value) => {
                    if (value === 'Not Applicable') form.cruise.join.controls.foreignerNo.disable();
                    else form.cruise.join.controls.foreignerNo.enable();
                });

                this.userFormMap()[index] = form;
            });
        });

        activatedRoute.params.subscribe((params) => {
            this.id = params['id'];
            this.cruiseOnly = this.id !== 'events';

            this.saveCode = params['saveCode'] || '';
            if (this.saveCode) this.getPreviousAnswers();
            else this.addUser();
        });

        activatedRoute.queryParams.subscribe((queryParams) => {
            this.submitted = queryParams['submitted'] === 'true';
        });
    }

    addUser() {
        const userName = ``;
        this.users.set([...this.users(), userName]);
    }

    removeUser(index: number) {
        const confirmed = window.confirm('Are you sure you want to change the name of this guest? All entered data for this guest will be lost.');
        if (!confirmed) return;

        const users = this.users();
        const userToRemove = users[index];

        // Remove from users array
        this.users.set(users.filter((_, i) => i !== index));

        // Remove from form map
        const formMap = this.userFormMap();
        delete formMap[userToRemove];
        this.userFormMap.set(formMap);
    }

    async submit() {
        this.missing = false;

        const invalid = this.users().map((_, index) => {
            const form = this.userFormMapLookup()[index];
            form.data.markAllAsTouched();
            form.fortKochi?.markAllAsTouched();
            form.cruise.markAllAsTouched();

            return form.data.invalid || form.fortKochi?.invalid === true || form.cruise.invalid;
        });

        if (invalid.some((v) => v)) {
            this.missing = true;
            return;
        }

        this.pending = true;

        const answers: QuestionAnswer[] = [];
        const users = this.users();
        const email = this.mainForm.controls.email.value;
        users.forEach((_, index) => {
            const form = this.userFormMapLookup()[index];

            Object.entries(form.data.value).forEach(([question, answer]: [string, any]) => {
                answers.push({
                    id: 0,
                    question,
                    answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                    category: 'User',
                    userId: form.data.value.name,
                    emailId: email,
                });
            });

            if (!this.cruiseOnly) {
                Object.entries(form.fortKochi.value).forEach(([question, answer]: [string, any]) => {
                    answers.push({
                        id: 0,
                        question,
                        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                        category: 'Fort Kochi',
                        userId: form.data.value.name,
                        emailId: email,
                    });
                });
            }

            Object.entries(form.cruise.value).forEach(([question, answer]: [string, any]) => {
                answers.push({
                    id: 0,
                    question,
                    answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                    category: 'Cruise',
                    userId: form.data.value.name,
                    emailId: email,
                });
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

        // Get email from answers
        const emailAnswer = answers?.[0]?.emailId;
        if (emailAnswer) this.mainForm.controls.email.setValue(emailAnswer);

        // Get unique users from answers
        const users = Array.from(new Set(answers.map((a) => a.userId)));
        this.users.set(users);

        setTimeout(() => {
            users.forEach((userId, index) => {
                const userAnswers = answers.filter((a) => a.userId === userId);
                userAnswers.forEach((a) => {
                    const form = this.userFormMap()[index];

                    if (a.category === 'User') {
                        form.data.patchValue({ [a.question]: this.tryParseAnswer(a.answer) });
                    } else if (a.category === 'Fort Kochi') {
                        if (form.data.value.fortKochi) form.fortKochi.join.patchValue({ [a.question]: this.tryParseAnswer(a.answer) });
                        else form.fortKochi.reason.patchValue({ [a.question]: this.tryParseAnswer(a.answer) });
                    } else if (a.category === 'Cruise') {
                        if (form.data.value.cruise) form.cruise.join.patchValue({ [a.question]: this.tryParseAnswer(a.answer) });
                        else form.cruise.reason.patchValue({ [a.question]: this.tryParseAnswer(a.answer) });
                    }
                });
            });
            this.pending = false;
        });
    }

    private tryParseAnswer(answer: string): any {
        try {
            return JSON.parse(answer);
        } catch {
            return answer;
        }
    }
}
