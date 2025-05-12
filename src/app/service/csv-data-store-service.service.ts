import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import {
  CsvDataService,
  LmsState,
  TopicWithDetails,
} from './csv-data-service.service';
import { Course, User, Enrollment, Topic, Entries } from '../models/lms-models';

export interface AppState extends LmsState {
  loading: boolean;
  error: string | null;
}

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

  getTopicsWithDetails(): Observable<TopicWithDetails[]> {
    return this.csvDataService.getTopicsWithDetails();
  }
  
  // Load all data and update state
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
