import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable } from 'rxjs';
import { Course, EnrollmentDetails, Entries, EntryDetails, LmsState, Topic, TopicDetails, User, UserDetails } from '../models/lms-models';
import { DatePipe } from '@angular/common';


@Injectable({
  providedIn: 'root',
})
export class CsvDataService {
  // Store LmsState in a BehaviorSubject for reactive updates
  private stateSubject = new BehaviorSubject<LmsState>({
    courses: [],
    users: [],
    enrollments: [],
    topics: [],
    entries: [],
  });

  // Expose state as an Observable
  state$: Observable<LmsState> = this.stateSubject.asObservable();

  constructor(private http: HttpClient, private datePipe: DatePipe) {
    // Load initial data into state
    this.loadAllData().subscribe((state) => {
      this.stateSubject.next(state);
    });
  }

  loadAllData(): Observable<LmsState> {
    return forkJoin({
      courses: this.loadCourses(),
      users: this.loadUsers(),
      enrollments: this.loadEnrollments(),
      topics: this.loadTopics(),
      entries: this.loadEntries(),
    });
  }

  getEnrollmentWithDetails(): Observable<EnrollmentDetails[]> {
    return this.state$.pipe(
      map((state: LmsState) => {
        return state.enrollments.map((enrollment) => {
          const course = state.courses.find(
            (c) => c.course_id === enrollment.course_id
          );
          const user = state.users.find(
            (u) => u.user_id === enrollment.user_id
          );
          return {
            ...enrollment,
            course,
            user,
          } as EnrollmentDetails;
        });
      })
    );
  }

  deleteEnrollment(enrollment: EnrollmentDetails): void {
    const currentState = this.stateSubject.getValue();
    const updatedEnrollments = currentState.enrollments.map((e) =>
      e.user_id === enrollment.user_id && e.course_id === enrollment.course_id
        ? { ...e, enrollment_state: 'deleted' as const }
        : e
    );
    this.stateSubject.next({
      ...currentState,
      enrollments: updatedEnrollments,
    });
  }

  deleteTopic(topic: TopicDetails): void {
    const currentState = this.stateSubject.getValue();
    const updatedTopics = currentState.topics.map((e) =>
      e.topic_id === topic.topic_id
        ? { ...e, topic_state: 'deleted' as const }
        : e
    );
    this.stateSubject.next({
      ...currentState,
      topics: updatedTopics,
    });
  }

  getUserDetails(): Observable<UserDetails[]> {
    return this.state$.pipe(
      map((state: LmsState) => {
        return state.users.map((user) => {
          // Find all enrollments for the user
          const enrollments = state.enrollments.filter(
            (c) => c.user_id === user.user_id
          );

          return {
            ...user,
            enrollment: enrollments,
          } as UserDetails;
        });
      })
    );
  }

  getTopicsWithDetails(): Observable<TopicDetails[]> {
    return this.state$.pipe(
      map((state: LmsState) => {
        return state.topics.map((topic) => {
          // Find the course for the topic
          const course = state.courses.find(
            (c) => c.course_id === topic.course_id
          );

          // Find the user who created the topic
          const topicByUser = state.users.find(
            (u) => u.user_id === topic.topic_posted_by_user_id
          );

          // Find all entries for this topic and enrich with entry_by_user
          const entries = state.entries
            .filter((entry) => entry.topic_id === topic.topic_id)
            .map((entry) => {
              const entryByUser = state.users.find(
                (u) => u.user_id === entry.entry_posted_by_user_id
              );
              return {
                ...entry,
                entry_by_user: entryByUser,
              } as EntryDetails;
            });

          // Build TopicWithDetails
          return {
            ...topic,
            course,
            topic_by_user: topicByUser,
            entries,
          } as TopicDetails;
        });
      })
    );
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
