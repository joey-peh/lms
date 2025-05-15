import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  loadData,
  deleteEnrollment,
  deleteTopic,
  setCurrentUser,
  resetState,
} from '../actions/lms.actions';
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

@Injectable({
  providedIn: 'root',
})
export class LmsSandboxService {
  constructor(private store: Store<{ lms: AppState }>) {}

  // State Selectors
  getState(): Observable<AppState> {
    return this.store.select((state) => state.lms);
  }

  getCourses(): Observable<Course[]> {
    return this.getState().pipe(map((state) => state.courses));
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
    return this.getState().pipe(
      map((state) =>
        state.enrollments.map(
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
        )
      )
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
    return this.getState().pipe(
      map((state: LmsState) =>
        state.topics.map(
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
        )
      )
    );
  }

  // Actions
  loadData(): void {
    this.store.dispatch(loadData());
  }

  deleteEnrollment(enrollment: EnrollmentDetails): void {
    this.store.dispatch(deleteEnrollment({ enrollment }));
  }

  deleteTopic(topic: TopicDetails): void {
    this.store.dispatch(deleteTopic({ topic }));
  }

  setCurrentUser(user: LoginUser | null): void {
    this.store.dispatch(setCurrentUser({ user }));
  }

  resetState(): void {
    this.store.dispatch(resetState());
  }
}
