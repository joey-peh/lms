import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import {
  Course,
  User,
  EnrollmentDetails,
  Topic,
  Entries,
  AppState,
} from '../../models/lms-models';
import {
  DeleteEnrollment,
  DeleteEnrollmentSuccess,
  DeleteTopic,
  DeleteTopicSuccess,
  LoadData,
  LoadDataFailure,
  LoadDataSuccess,
} from '../actions/lms.actions';

@Injectable()
export class LmsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private datePipe = inject(DatePipe);

  LoadData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoadData),
      mergeMap(() =>
        this.loadAllData().pipe(
          map((state) => LoadDataSuccess({ state })),
          catchError((error) => of(LoadDataFailure({ error: error.message })))
        )
      )
    )
  );

  deleteEnrollment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeleteEnrollment),
      map(({ enrollment }) => DeleteEnrollmentSuccess({ enrollment }))
    )
  );

  deleteTopic$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeleteTopic),
      map(({ topic }) => DeleteTopicSuccess({ topic }))
    )
  );

  private loadAllData(): Observable<AppState> {
    return combineLatest([
      this.loadCourses(),
      this.loadUsers(),
      this.loadEnrollments(),
      this.loadTopics(),
      this.loadEntries(),
    ]).pipe(
      map(([courses, users, enrollments, topics, entries]) => {
        return {
          courses,
          users,
          enrollments,
          topics,
          entries,
          loading: false,
          error: null,
          currentUser: null, // Or derive from auth service
        };
      })
    );
  }

  private loadCourses(): Observable<Course[]> {
    return this.http.get('./assets/courses.csv', { responseType: 'text' }).pipe(
      map((data) => {
        const lines = data.trim().split('\n').slice(1);
        return lines.map((line) => {
          const [id, semester, code, name, created] = line
            .split(',')
            .map((v) => v.trim());
          return {
            course_id: +id,
            semester,
            course_code: code,
            course_name: name,
            course_created_at: this.parseDate(created),
          } as Course;
        });
      })
    );
  }

  private loadUsers(): Observable<User[]> {
    return this.http.get('./assets/users.csv', { responseType: 'text' }).pipe(
      map((data) => {
        const lines = data.trim().split('\n').slice(1);
        return lines.map((line) => {
          const [id, name, created, deleted, state] = line
            .split(',')
            .map((v) => v.trim());
          return {
            user_id: +id,
            user_name: name,
            user_created_at: this.parseDate(created),
            user_deleted_at: deleted ? this.parseDate(deleted) : null,
            user_state: state as 'active' | 'deleted',
          } as User;
        });
      })
    );
  }

  private loadEnrollments(): Observable<EnrollmentDetails[]> {
    return this.http
      .get('./assets/enrollment.csv', { responseType: 'text' })
      .pipe(
        map((data) => {
          const lines = data.trim().split('\n').slice(1);
          return lines
            .filter((line) => line.trim())
            .map((line) => {
              const [user_id, course_id, type, state] = line
                .split(',')
                .map((v) => v.trim());
              return {
                user_id: +user_id,
                course_id: +course_id,
                enrollment_type: type as 'student' | 'teacher',
                enrollment_state: state as 'active' | 'deleted',
              } as EnrollmentDetails;
            });
        })
      );
  }

  private loadTopics(): Observable<Topic[]> {
    return this.http.get('./assets/topics.csv', { responseType: 'text' }).pipe(
      map((data) => {
        const lines = data.trim().split('\n').slice(1);
        return lines
          .filter((line) => line.trim())
          .map((line) => {
            const [
              topic_id,
              topic_title,
              topic_content,
              topic_created_at,
              topic_deleted_at,
              topic_state,
              course_id,
              topic_posted_by_user_id,
            ] = line.split(',').map((v) => v.trim());
            return {
              topic_id: +topic_id,
              topic_title,
              topic_content,
              topic_created_at: this.parseDate(topic_created_at),
              topic_deleted_at: topic_deleted_at
                ? this.parseDate(topic_deleted_at)
                : null,
              topic_state: topic_state as 'active' | 'inactive',
              course_id: +course_id,
              topic_posted_by_user_id: +topic_posted_by_user_id,
            } as Topic;
          });
      })
    );
  }

  private loadEntries(): Observable<Entries[]> {
    return this.http.get('./assets/entries.csv', { responseType: 'text' }).pipe(
      map((data) => {
        const lines = data.trim().split('\n').slice(1);
        return lines.map((line) => {
          const [
            entry_id,
            entry_content,
            entry_created_at,
            entry_deleted_at,
            entry_state,
            entry_parent_id,
            entry_posted_by_user_id,
            topic_id,
          ] = line.split(',').map((v) => v.trim());
          return {
            entry_id: +entry_id,
            entry_content,
            entry_created_at: this.parseDate(entry_created_at),
            entry_deleted_at: this.parseDate(entry_deleted_at),
            entry_state,
            entry_parent_id: +entry_parent_id,
            entry_posted_by_user_id: +entry_posted_by_user_id,
            topic_id: +topic_id,
          } as Entries;
        });
      })
    );
  }

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) {
      return 'N/A';
    }
    try {
      const isoDateStr = dateStr.replace(' ', 'T');
      const parsedDate = new Date(isoDateStr);
      if (isNaN(parsedDate.getTime())) {
        return 'N/A';
      }
      return (
        this.datePipe.transform(parsedDate, 'dd/MM/yyyy, hh:mm:ss a') || 'N/A'
      );
    } catch (error) {
      console.error(`Failed to parse date: ${dateStr}`, error);
      return 'N/A';
    }
  }
}
