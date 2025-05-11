import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Course } from '../models/course';
import { Enrollment } from '../models/enrollment';
import { User } from '../models/user';
import { Topic } from '../models/topic';
import { DatePipe } from '@angular/common';
import { Entries } from '../models/entries';
import { AppState } from './csv-data-store-service.service';

export interface LmsState {
  courses: Course[];
  users: User[];
  enrollments: Enrollment[];
  topics: Topic[];
  entries: Entries[];
}

@Injectable({
  providedIn: 'root',
})
export class CsvDataService {
  constructor(private http: HttpClient, private datePipe: DatePipe) {}

  loadAllData(): Observable<LmsState> {
    return forkJoin({
      courses: this.loadCourses(),
      users: this.loadUsers(),
      enrollments: this.loadEnrollments(),
      topics: this.loadTopics(),
      entries: this.loadEntries(),
    });
  }
  
  loadEntries(): Observable<Entries[]> {
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

  private loadEnrollments(): Observable<Enrollment[]> {
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
              } as Enrollment;
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
              topic_title: topic_title,
              topic_content: topic_content,
              topic_created_at: this.parseDate(topic_created_at),
              topic_deleted_at: this.parseDate(topic_deleted_at),
              topic_state: topic_state as 'active' | 'inactive',
              course_id: +course_id,
              topic_posted_by_user_id: +topic_posted_by_user_id,
            } as Topic;
          });
      })
    );
  }

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) {
      return 'N/A';
    }
    try {
      // Parse the date string (e.g., "2024-03-07 05:31:47")
      const isoDateStr = dateStr.replace(' ', 'T');
      const parsedDate = new Date(isoDateStr);

      // Check if the parsed date is valid
      if (isNaN(parsedDate.getTime())) {
        return 'N/A';
      }

      // Format the date using DatePipe
      return (
        this.datePipe.transform(parsedDate, 'dd/MM/yyyy, hh:mm:ss a') || 'N/A'
      );
    } catch (error) {
      console.error(`Failed to parse date: ${dateStr}`, error);
      return 'N/A';
    }
  }
}
