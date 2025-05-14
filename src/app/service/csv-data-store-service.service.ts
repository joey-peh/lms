import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import {
  Course,
  User,
  Enrollment,
  Topic,
  Entries,
  LoginUser,
  AppState,
  EnrollmentDetails,
  TopicDetails,
  UserDetails,
} from '../models/lms-models';
import { CsvDataService } from './csv-data-service.service';

@Injectable({
  providedIn: 'root',
})
export class CsvDataStoreService {
  private initialState: AppState = {
    courses: [],
    users: [],
    enrollments: [],
    topics: [],
    entries: [],
    loading: false,
    error: null,
    currentUser: null,
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);
  private state$ = this.stateSubject.asObservable();

  constructor(private csvDataService: CsvDataService) {}

  // Get the entire state
  getState(): Observable<AppState> {
    return this.state$;
  }

  // Get specific parts of the state
  getCourses(): Observable<Course[]> {
    return this.state$.pipe(map((state) => state.courses));
  }

  getUsers(): Observable<User[]> {
    return this.state$.pipe(map((state) => state.users));
  }

  getEnrollments(): Observable<Enrollment[]> {
    return this.state$.pipe(map((state) => state.enrollments));
  }

  getTopics(): Observable<Topic[]> {
    return this.state$.pipe(map((state) => state.topics));
  }

  getEntries(): Observable<Entries[]> {
    return this.state$.pipe(map((state) => state.entries));
  }

  getLoading(): Observable<boolean> {
    return this.state$.pipe(map((state) => state.loading));
  }

  getError(): Observable<string | null> {
    return this.state$.pipe(map((state) => state.error));
  }

  getCurrentUser(): Observable<LoginUser | null> {
    return this.state$.pipe(map((state) => state.currentUser));
  }

  setCurrentUser(user: LoginUser | null): void {
    this.updateState({ currentUser: user });
  }

  getTopicDetails(): Observable<TopicDetails[]> {
    return this.csvDataService.getTopicsWithDetails();
  }

  getEnrollmentDetails(): Observable<EnrollmentDetails[]> {
    return this.csvDataService.getEnrollmentWithDetails();
  }

  getUserDetails(): Observable<UserDetails[]> {
    return this.csvDataService.getUserDetails();
  }

  deleteEnrollment(enrollment: EnrollmentDetails): Observable<void> {
    this.csvDataService.deleteEnrollment(enrollment);
    return of(void 0);
  }

  deleteTopics(topic: TopicDetails): Observable<void> {
    this.csvDataService.deleteTopic(topic);
    return of(void 0);
  }

  loadData(): void {
    this.updateState({ loading: true, error: null });

    this.csvDataService.loadAllData().subscribe({
      next: (data) => {
        this.updateState({
          ...data,
          loading: false,
          error: null,
        });
      },
      error: (err) => {
        this.updateState({
          loading: false,
          error: 'Failed to load data: ' + err.message,
        });
      },
    });
  }

  // Update state immutably
  private updateState(newState: Partial<AppState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...newState,
    });
  }

  // Reset state to initial
  resetState(): void {
    this.stateSubject.next(this.initialState);
  }
}
