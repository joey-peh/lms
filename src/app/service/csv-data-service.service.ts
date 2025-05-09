import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Course } from '../models/course';
import { Enrollment } from '../models/enrollment';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class CsvDataService {

  constructor(private http: HttpClient) { }
  
  loadAllData(): Observable<{ courses: Course[], users: User[], enrollments: Enrollment[] }> {
    return forkJoin({
      courses: this.loadCourses(),
      users: this.loadUsers(),
      enrollments: this.loadEnrollments()
    });
  }

  private loadCourses(): Observable<Course[]> {
    return this.http.get('./assets/courses.csv', { responseType: 'text' }).pipe(
      map(data => {
        const lines = data.trim().split('\n').slice(1);
        return lines.map(line => {
          const [id, semester, code, name, created] = line.split(',').map(v => v.trim());
          return {
            course_id: +id,
            semester,
            course_code: code,
            course_name: name,
            course_created_at: this.parseDate(created)
          } as Course;
        });
      })
    );
  }

  private loadUsers(): Observable<User[]> {
    return this.http.get('./assets/users.csv', { responseType: 'text' }).pipe(
      map(data => {
        const lines = data.trim().split('\n').slice(1);
        return lines.map(line => {
          const [id, name, created, deleted, state] = line.split(',').map(v => v.trim());
          return {
            user_id: +id,
            user_name: name,
            user_created_at: this.parseDate(created),
            user_deleted_at: deleted ? this.parseDate(deleted) : null,
            user_state: state as 'active' | 'deleted'
          } as User;
        });
      })
    );
  }

  private loadEnrollments(): Observable<Enrollment[]> {
    return this.http.get('./assets/enrollment.csv', { responseType: 'text' }).pipe(
      map(data => {
        const lines = data.trim().split('\n').slice(1);
        return lines
          .filter(line => line.trim())
          .map(line => {
            const [user_id, course_id, type, state] = line.split(',').map(v => v.trim());
            return {
              user_id: +user_id,
              course_id: +course_id,
              enrollment_type: type as 'student' | 'teacher',
              enrollment_state: state as 'active' | 'deleted'
            } as Enrollment;
          });
      })
    );
  }

  private parseDate(dateStr: string): Date {
    return null as any;
    console.log("dateStr"+dateStr);
    if (!dateStr) return null as any;
    const [day, month, rest] = dateStr.split('/');
    console.log("rest"+rest);
    const [year, time] = rest.split(' ');
    return new Date(`${year}-${month}-${day}T${time}`);
  }
}
