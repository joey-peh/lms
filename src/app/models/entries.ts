export interface Entries {  
    entry_id: number;
    entry_content: string;
    entry_created_at: string; // ISO datetime string
    entry_deleted_at: string | null; // 'NA' or a date string
    entry_state: 'active' | 'inactive' | string; // Adjust based on known states
    entry_parent_id: number | null; // 'NA' means no parent
    entry_posted_by_user_id: number;
    topic_id: number;
}
