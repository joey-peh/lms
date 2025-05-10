export interface Topics {topic_id: number;
    topic_title: string;
    topic_content: string;
    topic_created_at: string;
    topic_deleted_at: string | null;
    topic_state: 'active' | 'inactive';
    course_id: number;
    topic_posted_by_user_id: number;
}
