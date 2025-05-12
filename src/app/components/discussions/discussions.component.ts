import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { Observable } from 'rxjs';
import { TableDetails } from '../../models/lms-models';
import {
  EntryDetails,
  TopicDetails,
} from '../../service/csv-data-service.service';
import { CommonService as CommonService } from '../../service/common-service.service';
import { BaseUserComponent } from '../base/base-user.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-discussions',
  standalone: false,
  templateUrl: './discussions.component.html',
  styleUrl: './discussions.component.css',
})
export class DiscussionsComponent
  extends BaseUserComponent
  implements OnInit, AfterViewInit
{
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);
  private commonService = inject(CommonService);

  topicDetails$!: Observable<TopicDetails[]>;

  topicList: TableDetails<TopicDetails> = {
    dataSource: new MatTableDataSource<TopicDetails>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  entry: TableDetails<EntryDetails> = {
    dataSource: new MatTableDataSource<EntryDetails>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  columnFilters: { [key: string]: string } = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  override ngOnInit(): void {
    super.ngOnInit();
    this.topicDetails$ = this.store.getTopicDetails();

    this.topicDetails$.subscribe((topics) => {
      var filteredTopics = this.getFilteredTopics(topics);
      this.configureDiscussionTable(filteredTopics);
      this.cdr.markForCheck();
    });

    this.topicList.dataSource.filterPredicate = (
      data: TopicDetails,
      filter: string
    ): boolean => {
      const filters: { id: string; value: string }[] = JSON.parse(filter);

      return filters.every(({ id, value }) => {
        const config = this.topicList.columnConfigs.find(
          (col) => col.columnDef === id
        );
        if (!config || !config.filterable) return true;

        const cellValue = config.cell(data);
        return cellValue
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      });
    };
  }

  private getFilteredTopics(topics: TopicDetails[]) {
    return topics.filter((x) => this.user.course_id.includes(x.course_id));
  }

  ngAfterViewInit(): void {
    this.topicList.dataSource.paginator = this.paginator;
  }

  selectTopic(row: TopicDetails): void {
    if (row.topic_state != 'active') {
      return;
    }
    var entries = row.entries;
    var { columnConfigs, displayedColumns } =
      this.commonService.configureBaseColumnConfig(
        entries,
        ['entry_by_user', 'entry_deleted_at'],
        [
          {
            key: 'user',
            displayName: 'Entry by user',
            selector: (entries) => entries.entry_by_user.user_name,
          },
        ]
      );
    this.entry.dataSource.data = entries;
    this.entry.columnConfigs = columnConfigs;
    this.entry.displayedColumns = displayedColumns;
    this.cdr.markForCheck();
  }

  private configureDiscussionTable(topics: TopicDetails[]): void {
    var { columnConfigs, displayedColumns } =
      this.commonService.configureBaseColumnConfig(
        topics,
        ['entries', 'course', 'user', 'topic_by_user', 'topic_deleted_at'],
        [
          {
            key: 'course',
            displayName: 'Course',
            selector: (topics) => topics.course.course_name,
          },
          {
            key: 'username',
            displayName: 'Created by user',
            selector: (topics) => topics.topic_by_user.user_name,
          },
          {
            key: 'entries',
            displayName: 'No. of entries',
            selector: (topics) => topics.entries.length,
          },
        ]
      );

    columnConfigs.push({
      columnDef: 'action',
      displayName: '', // No header for action column
      cell: () => '',
      sortable: false,
      filterable: false,
    });
    displayedColumns.push('action');

    this.topicList.dataSource.data = topics;
    this.topicList.columnConfigs = columnConfigs;
    this.topicList.displayedColumns = displayedColumns;
  }

  applyFilter(event: Event, column: string): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.columnFilters[column] = value;

    const tableFilters = Object.keys(this.columnFilters).map((key) => ({
      id: key,
      value: this.columnFilters[key],
    }));

    this.topicList.dataSource.filter = JSON.stringify(tableFilters);
  }

  deleteTopic(element: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete topic?`,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.store.deleteTopics(element).subscribe(() => {
          this.topicDetails$ = this.store.getTopicDetails();
          this.topicDetails$.subscribe((topics) => {
            this.topicList.dataSource.data = this.getFilteredTopics(topics);
            this.entry = {
              dataSource: new MatTableDataSource<EntryDetails>([]),
              columnConfigs: [],
              displayedColumns: [],
            };
          });
        });
      }
    });
  }
}
