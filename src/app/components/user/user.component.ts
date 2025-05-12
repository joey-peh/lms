import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { TableDetails } from '../../models/lms-models';
import { EnrollmentDetails } from '../../service/csv-data-service.service';
import { Observable } from 'rxjs';
import { CommonService } from '../../service/common-service.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { BaseUserComponent } from '../base/base-user.component';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent
  extends BaseUserComponent
  implements OnInit, AfterViewInit
{
  private dialog = inject(MatDialog);
  private store = inject(CsvDataStoreService);
  private commonService = inject(CommonService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  enrollmentData$!: Observable<EnrollmentDetails[]>;
  userData: TableDetails<EnrollmentDetails> = {
    dataSource: new MatTableDataSource<EnrollmentDetails>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  override ngOnInit(): void {
    super.ngOnInit();
    this.enrollmentData$ = this.store.getEnrollmentsWithDetails();
    this.enrollmentData$.subscribe((enrollment) => {
      const studentEnrollment = enrollment.filter(
        (x) => x.enrollment_type === 'student'
      );
      var { columnConfigs, displayedColumns } =
        this.commonService.configureBaseColumnConfig(
          studentEnrollment,
          ['user', 'course'],
          [
            {
              key: 'user_name',
              displayName: 'Username',
              selector: (enrollment) => enrollment.user.user_name,
            },
            {
              key: 'course',
              displayName: 'Course',
              selector: (enrollment) => enrollment.course.course_name,
            },
          ]
        );

      // Add delete button column
      if (this.user.role === 'admin') {
        columnConfigs.push({
          columnDef: 'action',
          displayName: '', // No header for action column
          cell: () => '',
          sortable: false,
          filterable: false,
        });
        displayedColumns.push('action');
      }
      this.userData.dataSource.data = studentEnrollment;
      this.userData.columnConfigs = columnConfigs;
      this.userData.displayedColumns = displayedColumns;
    });
  }

  ngAfterViewInit(): void {
    this.userData.dataSource.paginator = this.paginator;
    this.paginator.page.subscribe((event: PageEvent) => {
      console.log('Page:', event.pageIndex, 'Size:', event.pageSize);
    });
  }

  deleteEnrollment(enrollment: EnrollmentDetails) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete ${enrollment.user.user_name}'s enrollment?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.deleteEnrollment(enrollment).subscribe(() => {
          this.enrollmentData$ = this.store.getEnrollmentsWithDetails();
          this.enrollmentData$.subscribe((enrollments) => {
            const studentEnrollment = enrollments.filter(
              (x) => x.enrollment_type === 'student'
            );
            this.userData.dataSource.data = studentEnrollment;
          });
        });
      }
    });
  }
}
