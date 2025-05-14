import { MatTableDataSource } from '@angular/material/table';
import { ChartDataset, ChartType } from 'chart.js';

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
  subtitle: string;
}

export interface MiniCard {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

export interface CommonChart {
  title: string;
  subtitle: string;
  barChartLabels: string[];
  barChartData: ChartDataset[];
  barChartType: ChartType;
  barChartLegend: boolean;
  height: string;
  maxValue: number;
  [key: string]: any;
}
export interface LmsState {
  courses: Course[];
  users: User[];
  enrollments: Enrollment[];
  topics: Topic[];
  entries: Entries[];
}

export interface UserDetails extends User {
  enrollment: Enrollment[];
  course: Course[];
}

export interface EnrollmentDetails extends Enrollment {
  user: User;
  course: Course;
  t: string;
}

export interface TopicDetails extends Topic {
  course: Course;
  topic_by_user: User;
  entries: EntryDetails[];
}

export interface EntryDetails extends Entries {
  entry_by_user: User;
}

export interface TableRow {
  [key: string]: any;
}

export interface MenuItem {
  label: string;
  icon: string;
  link: string;
  roles: string[];
}

export interface ColumnDefinition<T> {
  key: string;
  displayName: string;
  selector: (element: T) => T[keyof T];
  sortable?: boolean;
  filterable?: boolean;
}

export interface AppState extends LmsState {
  loading: boolean;
  error: string | null;
  currentUser: LoginUser | null; // Add currentUser to store the logged-in user
}
