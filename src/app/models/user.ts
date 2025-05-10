export interface User {
    user_id: number;
    user_name: string;
    user_created_at: Date;
    user_deleted_at: Date | null;
    user_state: 'active' | 'deleted';
}

export interface LoginUserInformation {
    username: string;
    password: string;
    role: string;
    name: string;
}