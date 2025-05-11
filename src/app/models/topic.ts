export interface Topic {topic_id: number;
    topic_title: string;
    topic_content: string;
    topic_created_at: string;
    topic_deleted_at: string | null;
    topic_state: 'active' | 'inactive' | 'unpublished' | 'deleted';
    course_id: number;
    topic_posted_by_user_id: number;
}

export interface ColumnConfig {
  columnDef: string;
  displayName: string;
  cell: (element: any) => any;
  sortable: boolean;
  filterable: boolean;
}
