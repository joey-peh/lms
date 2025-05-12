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
import {
  ColumnConfig
} from '../../models/lms-models';
import {
  EntryWithDetails,
  TopicWithDetails,
} from '../../service/csv-data-service.service';
import { CommonService as CommonService } from '../../service/common-service.service';

@Component({
  selector: 'app-discussions',
  standalone: false,
  templateUrl: './discussions.component.html',
  styleUrl: './discussions.component.css',
})
export class DiscussionsComponent implements OnInit, AfterViewInit {
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);
  private commonService = inject(CommonService);

  topics$!: Observable<TopicWithDetails[]>;

  discussionData: {
    dataSource: MatTableDataSource<TopicWithDetails>;
    columnConfigs: ColumnConfig[];
    displayedColumns: string[];
  } = {
    dataSource: new MatTableDataSource<TopicWithDetails>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  entry: {
    dataSource: MatTableDataSource<EntryWithDetails>;
    columnConfigs: ColumnConfig[];
    displayedColumns: string[];
  } = {
    dataSource: new MatTableDataSource<EntryWithDetails>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.topics$ = this.store.getTopicsWithDetails();
    // Update table with processed data
    this.topics$.subscribe((topics) => {
      this.configureDiscussionTable(topics);
      this.cdr.markForCheck();
    });
  }
  ngAfterViewInit(): void {
    this.discussionData.dataSource.paginator = this.paginator;
  }

  selectTopic(row: TopicWithDetails): void {
    console.log('selected row', row);
    var entries = row.entries;
    var { columnConfigs, displayedColumns } =
      this.commonService.configureBaseColumnConfig(
        entries,
        ['entry_by_user'],
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

  private configureDiscussionTable(topics: TopicWithDetails[]): void {
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

    this.discussionData.dataSource.data = topics;
    this.discussionData.columnConfigs = columnConfigs;
    this.discussionData.displayedColumns = displayedColumns;
  }
}
