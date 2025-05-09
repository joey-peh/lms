export interface Enrollment {
    user_id: number;
    course_id: number;
    enrollment_type: 'student' | 'teacher';
    enrollment_state: 'active' | 'deleted';
}
