import { OnInit, OnDestroy, inject, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { LoginUser } from '../../models/lms-models';
import { EnrollmentDetails } from '../../service/csv-data-service.service';
import { MatDialog } from '@angular/material/dialog';

@Directive()
export abstract class BaseUserComponent implements OnInit, OnDestroy {
  protected csvDataStore = inject(CsvDataStoreService);
  protected dialog = inject(MatDialog);
  
  protected user: LoginUser = {
    username: '',
    password: '',
    role: '',
    name: '',
    course_id: [],
  };

  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.csvDataStore
      .getCurrentUser()
      .subscribe((user) => {
        this.user = user ?? {
          username: '',
          password: '',
          role: '',
          name: '',
          course_id: [],
        };
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  getEnrollment(enrollment: EnrollmentDetails[], allState: boolean) {
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
}
