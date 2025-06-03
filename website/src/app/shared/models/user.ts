export type User = {
    id?: string;
    name?: string;
    firstName: string;
    lastName: string;
    nickname: string;
    email: string;
    dob: Date | string;
    disabled?: boolean;
    updatedAt?: Date;
    isAdmin?: boolean;
    plusOneId?: string;
    plusOne?: User;
    plusOnes?: User[];
};
