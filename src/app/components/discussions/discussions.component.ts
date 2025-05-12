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
import { ColumnConfig, TableDetails } from '../../models/lms-models';
import {
  EntryDetails,
  TopicDetails,
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

  topics$!: Observable<TopicDetails[]>;

  discussionData: TableDetails<TopicDetails> = {
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

  ngOnInit(): void {
    this.topics$ = this.store.getTopicsWithDetails();
    // Update table with processed data
    this.topics$.subscribe((topics) => {
      this.configureDiscussionTable(topics);
      this.cdr.markForCheck();
    });

    this.discussionData.dataSource.filterPredicate = (
      data: TopicDetails,
      filter: string
    ): boolean => {
      const filters: { id: string; value: string }[] = JSON.parse(filter);

      return filters.every(({ id, value }) => {
        const config = this.discussionData.columnConfigs.find(
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

  ngAfterViewInit(): void {
    this.discussionData.dataSource.paginator = this.paginator;
  }

  selectTopic(row: TopicDetails): void {
    console.log('selected row', row);
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

    this.discussionData.dataSource.data = topics;
    this.discussionData.columnConfigs = columnConfigs;
    this.discussionData.displayedColumns = displayedColumns;
  }

  applyFilter(event: Event, column: string): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.columnFilters[column] = value;

    const tableFilters = Object.keys(this.columnFilters).map((key) => ({
      id: key,
      value: this.columnFilters[key],
    }));

    this.discussionData.dataSource.filter = JSON.stringify(tableFilters);
  }
}
