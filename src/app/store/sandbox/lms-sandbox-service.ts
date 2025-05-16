import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AppState,
  Course,
  User,
  Enrollment,
  Topic,
  Entries,
  LoginUser,
  EnrollmentDetails,
  UserDetails,
  TopicDetails,
  LmsState,
} from '../../models/lms-models';
import {
  DeleteEnrollment,
  DeleteTopic,
  LoadData,
  ResetState,
  SetCurrentUser,
} from '../actions/lms.actions';

@Injectable({
  providedIn: 'root',
})
export class LmsSandboxService {
  constructor(private store: Store<{ lms: AppState }>) {}

  // Filtering Methods
  private filterCourse(
    courses: Course[],
    currentUser: LoginUser | null
  ): Course[] {
    if (!currentUser) return courses;
    if (currentUser.role === 'admin') return courses;
    return courses.filter((course) =>
      currentUser.course_id.includes(course.course_id)
    );
  }

  private filterEnrolment(
    enrollments: EnrollmentDetails[],
    currentUser: LoginUser | null
  ): EnrollmentDetails[] {
    if (!currentUser) return enrollments;
    if (currentUser.role === 'admin')
      return enrollments.filter(
        (enrollment) => enrollment.enrollment_state === 'active'
      );
    return enrollments.filter(
      (enrollment) =>
        enrollment.enrollment_state === 'active' &&
        currentUser.course_id.includes(enrollment.course_id)
    );
  }

  private filterTopicDetails(
    topics: TopicDetails[],
    currentUser: LoginUser | null
  ): TopicDetails[] {
    if (!currentUser) return topics;
    if (currentUser.role === 'admin')
      return topics.filter((topic) => topic.topic_state === 'active');
    return topics.filter(
      (topic) =>
        topic.topic_state === 'active' &&
        currentUser.course_id.includes(topic.course_id)
    );
  }

  // State Selectors
  getState(): Observable<AppState> {
    return this.store.select((state) => state.lms);
  }

  getCourses(): Observable<Course[]> {
    return combineLatest([
      this.getState().pipe(map((state) => state.courses)),
      this.getCurrentUser(),
    ]).pipe(
      map(([courses, currentUser]) => this.filterCourse(courses, currentUser))
    );
  }

  getUsers(): Observable<User[]> {
    return this.getState().pipe(map((state) => state.users));
  }

  getEnrollments(): Observable<Enrollment[]> {
    return this.getState().pipe(map((state) => state.enrollments));
  }

  getTopics(): Observable<Topic[]> {
    return this.getState().pipe(map((state) => state.topics));
  }

  getEntries(): Observable<Entries[]> {
    return this.getState().pipe(map((state) => state.entries));
  }

  getLoading(): Observable<boolean> {
    return this.getState().pipe(map((state) => state.loading));
  }

  getError(): Observable<string | null> {
    return this.getState().pipe(map((state) => state.error));
  }

  getCurrentUser(): Observable<LoginUser | null> {
    return this.getState().pipe(map((state) => state.currentUser));
  }

  getEnrollmentDetails(): Observable<EnrollmentDetails[]> {
    return combineLatest([this.getState(), this.getCurrentUser()]).pipe(
      map(([state, currentUser]) => {
        const enrollments = state.enrollments.map(
          (enrollment: { course_id: any; user_id: any }) =>
            ({
              ...enrollment,
              course: state.courses.find(
                (c: { course_id: any }) => c.course_id === enrollment.course_id
              ),
              user: state.users.find(
                (u: { user_id: any }) => u.user_id === enrollment.user_id
              ),
            } as EnrollmentDetails)
        );
        return this.filterEnrolment(enrollments, currentUser);
      })
    );
  }

  getUserDetails(): Observable<UserDetails[]> {
    return this.getState().pipe(
      map((state) =>
        state.users.map(
          (user: { user_id: any }) =>
            ({
              ...user,
              enrollment: state.enrollments.filter(
                (e: { user_id: any }) => e.user_id === user.user_id
              ),
            } as UserDetails)
        )
      )
    );
  }

  getTopicDetails(): Observable<TopicDetails[]> {
    return combineLatest([this.getState(), this.getCurrentUser()]).pipe(
      map(([state, currentUser]) => {
        const topics = state.topics.map(
          (topic: {
            course_id: any;
            topic_posted_by_user_id: any;
            topic_id: any;
          }) =>
            ({
              ...topic,
              course: state.courses.find(
                (c: { course_id: any }) => c.course_id === topic.course_id
              ),
              topic_by_user: state.users.find(
                (u) => u.user_id === topic.topic_posted_by_user_id
              ),
              entries: state.entries
                .filter(
                  (entry: { topic_id: any }) =>
                    entry.topic_id === topic.topic_id
                )
                .map((entry: { entry_posted_by_user_id: any }) => ({
                  ...entry,
                  entry_by_user: state.users.find(
                    (u) => u.user_id === entry.entry_posted_by_user_id
                  ),
                })),
            } as TopicDetails)
        );
        return this.filterTopicDetails(topics, currentUser);
      })
    );
  }

  // Actions
  loadData(): void {
    this.store.dispatch(LoadData());
  }

  deleteEnrollment(enrollment: EnrollmentDetails): void {
    this.store.dispatch(DeleteEnrollment({ enrollment }));
  }

  deleteTopic(topic: TopicDetails): void {
    this.store.dispatch(DeleteTopic({ topic }));
  }

  setCurrentUser(user: LoginUser | null): void {
    this.store.dispatch(SetCurrentUser({ user }));
  }

  resetState(): void {
    this.store.dispatch(ResetState());
  }
}
