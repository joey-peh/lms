import {
  AfterViewInit,
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
import { BaseUserComponent } from '../base/base-user.component';
import { ConfirmDialogComponent } from '../base/confirm-dialog/confirm-dialog.component';
import { TableRow } from '../base/common-table/common-table.component';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent extends BaseUserComponent implements OnInit {
  private store = inject(CsvDataStoreService);
  private commonService = inject(CommonService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  enrollmentData$!: Observable<EnrollmentDetails[]>;
  userData: TableDetails<TableRow> = {
    dataSource: new MatTableDataSource<TableRow>([]),
    columnConfigs: [],
    displayedColumns: [],
    title: '',
  };

  override ngOnInit(): void {
    super.ngOnInit();
    this.enrollmentData$ = this.store.getEnrollmentDetails();
    this.enrollmentData$.subscribe((enrollment) => {
      const studentEnrollment = this.getEnrollment(enrollment, true);
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

  deleteEnrollment = (enrollment: EnrollmentDetails) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete ${enrollment.user.user_name}'s enrollment?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.deleteEnrollment(enrollment).subscribe(() => {
          this.enrollmentData$ = this.store.getEnrollmentDetails();
          this.enrollmentData$.subscribe((enrollments) => {
            const studentEnrollment = this.getEnrollment(enrollments, true);
            this.userData.dataSource.data = studentEnrollment;
          });
        });
      }
    });
  };
}
