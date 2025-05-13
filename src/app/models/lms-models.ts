import { MatTableDataSource } from "@angular/material/table";

export interface Course {
  course_id: number;
  semester: string;
  course_code: string;
  course_name: string;
  course_created_at: string;
}

export interface Enrollment {
  user_id: number;
  course_id: number;
  enrollment_type: 'student' | 'teacher';
  enrollment_state: 'active' | 'deleted';
}

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

export interface Topic {
  topic_id: number;
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

export interface User {
  user_id: number;
  user_name: string;
  user_created_at: string;
  user_deleted_at: string | null;
  user_state: 'active' | 'deleted';
}

export interface LoginUser {
  user_login_id: string;
  username: string;
  password: string;
  role: string;
  user_id: string;
  course_id: number[];
}

export interface TableDetails<T> {
  dataSource: MatTableDataSource<T>;
  columnConfigs: ColumnConfig[];
  displayedColumns: string[];
  title: string;
}
