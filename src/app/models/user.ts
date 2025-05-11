export interface User {
    user_id: number;
    user_name: string;
    user_created_at: string;
    user_deleted_at: string | null;
    user_state: 'active' | 'deleted';
}

export interface LoginUserInformation {
    username: string;
    password: string;
    role: string;
    name: string;
}