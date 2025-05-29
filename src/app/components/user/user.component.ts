import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  EnrollmentDetails,
  TableDetails,
  TableRow,
} from '../../models/lms-models';
import { Observable } from 'rxjs';
import { CommonService } from '../../service/common-service.service';
import { BaseUserComponent } from '../base/base-user.component';
import { ConfirmDialogComponent } from '../base/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent extends BaseUserComponent implements OnInit {
  private commonService = inject(CommonService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  enrollmentData$!: Observable<EnrollmentDetails[]>;
  userData: TableDetails<TableRow> = {
    dataSource: new MatTableDataSource<TableRow>([]),
    columnConfigs: [],
    displayedColumns: [],
    title: '',
    subtitle: '',
  };

  canDelete = () => {
    return this.user.role === 'admin';
  };

  override ngOnInit(): void {
    super.ngOnInit();
    this.enrollmentData$ = this.sandbox.getEnrollmentDetails();
    this.enrollmentData$.subscribe((enrollment) => {
      if(this.user.role !== 'admin'){
        enrollment = enrollment.filter(x => x.enrollment_type === 'student');
      }

      var { columnConfigs, displayedColumns } =
        this.commonService.configureBaseColumnConfig(
          enrollment,
          ['user', 'course'],
          [
            {
              key: 'user.user_name',
              displayName: 'Username',
              selector: (enrollment) => enrollment.user.user_name,
            },
            {
              key: 'course.course_name',
              displayName: 'Course',
              selector: (enrollment) => enrollment.course.course_name,
            },
            {
              key: 'user.user_created_at',
              displayName: 'Date Joined',
              selector: (enrollment) => enrollment.user.user_created_at,
          },
          ]
        );

      if (this.user.role === 'admin') {
        columnConfigs.push({
          columnDef: 'action',
          displayName: '', // No header for action column
          cell: () => '',
          sortable: false,
          filterable: true,
        });
        displayedColumns.push('action');
      }

      this.userData.title =
        this.user.role == 'admin' ? 'Enrollments' : 'Students';
      this.userData.subtitle =
        this.user.role == 'admin'
          ? 'Get list of all enrollments'
          : 'Get list of student enrollments under instructor';

      this.userData.dataSource.data = enrollment;
      this.userData.columnConfigs = columnConfigs;
      this.userData.displayedColumns = displayedColumns;
    });
  }

  deleteEnrollment = (enrollment: EnrollmentDetails) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete ${enrollment.user.user_name}'s enrollment?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.sandbox.deleteEnrollment(enrollment);
        this.enrollmentData$ = this.sandbox.getEnrollmentDetails();
        this.enrollmentData$.subscribe((enrollments) => {
          this.userData.dataSource.data = enrollments;
        });
      }
    });
  };
}
