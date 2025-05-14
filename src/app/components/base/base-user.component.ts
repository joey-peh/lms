import { OnInit, OnDestroy, inject, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { Course, EnrollmentDetails, LoginUser, TopicDetails } from '../../models/lms-models';
import { MatDialog } from '@angular/material/dialog';

@Directive()
export abstract class BaseUserComponent implements OnInit, OnDestroy {
  protected csvDataStore = inject(CsvDataStoreService);
  protected dialog = inject(MatDialog);

  protected user: LoginUser = {
    user_login_id: '',
    username: '',
    password: '',
    role: '',
    user_id: '',
    course_id: [],
  };

  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.csvDataStore
      .getCurrentUser()
      .subscribe((user) => {
        this.user = user ?? {
          user_login_id: '',
          username: '',
          password: '',
          role: '',
          user_id: '',
          course_id: [],
        };
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  filterEnrolmentList(enrollment: EnrollmentDetails[], allState: boolean) {
    return this.user.role == 'admin' && allState
      ? enrollment.filter((x) => this.user.course_id.includes(x.course_id))
      : enrollment.filter(
          (x) =>
            (this.user.role == 'admin'
              ? true
              : x.enrollment_type === 'student') &&
            x.enrollment_state == 'active' &&
            this.user.course_id.includes(x.course_id)
        );
  }

  filterEnrolment(enrollment: EnrollmentDetails[]) {
    return enrollment.filter((x) => this.user.course_id.includes(x.course_id));
  }

  filterCourse(courses: Course[]): Course[] {
    return courses.filter((course) =>
      this.user.course_id.includes(course.course_id)
    );
  }

  filterTopicDetails(topicDetails: TopicDetails[]): TopicDetails[] {
    return topicDetails.filter((topic) =>
      this.user.course_id.includes(topic.course_id)
    );
  }
  
}
