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
import { MatSort, Sort } from '@angular/material/sort'; // Import MatSort
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { Observable } from 'rxjs';
import {
  EntryDetails,
  TableDetails,
  TableRow,
  TopicDetails,
} from '../../models/lms-models';
import { CommonService } from '../../service/common-service.service';
import { BaseUserComponent } from '../base/base-user.component';
import { ConfirmDialogComponent } from '../base/confirm-dialog/confirm-dialog.component';

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

  topicList: TableDetails<TableRow> = {
    dataSource: new MatTableDataSource<TableRow>([]),
    columnConfigs: [],
    displayedColumns: [],
    title: '',
    subtitle: '',
  };

  entry: TableDetails<TableRow> = {
    dataSource: new MatTableDataSource<TableRow>([]),
    columnConfigs: [],
    displayedColumns: [],
    title: '',
    subtitle: '',
  };

  columnFilters: { [key: string]: string } = {};
  selectedTopic: any = null; // Track selected topic

  canDeleteTopic = (element: TopicDetails) => {
    return (
      element.topic_state !== 'deleted' &&
      (element.topic_posted_by_user_id.toString() === this.user.user_id ||
        this.user.role === 'admin')
    );
  };

  override ngOnInit(): void {
    super.ngOnInit();
    this.topicDetails$ = this.store.getTopicDetails();

    this.topicDetails$.subscribe((topics) => {
      topics = this.filterTopicDetails(topics);
      this.configureDiscussionTable(topics);
      this.cdr.markForCheck();
    });

    this.topicList.dataSource.filterPredicate = (
      data: TableRow,
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

  ngAfterViewInit(): void {
    // // Custom sorting accessor for topics
    // this.topicList.dataSource.sortingDataAccessor = (
    //   data: TableRow,
    //   property: string
    // ) => {
    //   const config = this.topicList.columnConfigs.find(
    //     (col) => col.columnDef === property
    //   );
    //   if (config) {
    //     const value = config.cell(data);
    //     return typeof value === 'string' ? value.toLowerCase() : value;
    //   }
    //   return '';
    // };
    // // Custom sorting accessor for entries
    // this.entry.dataSource.sortingDataAccessor = (
    //   data: TableRow,
    //   property: string
    // ) => {
    //   const config = this.entry.columnConfigs.find(
    //     (col) => col.columnDef === property
    //   );
    //   if (config) {
    //     const value = config.cell(data);
    //     return typeof value === 'string' ? value.toLowerCase() : value;
    //   }
    //   return '';
    // };
  }

  selectTopic(row: TopicDetails): void {
    if (row.topic_state !== 'active') {
      return;
    }
    this.selectedTopic = row;
    const entries = row.entries;
    const { columnConfigs, displayedColumns } =
      this.commonService.configureBaseColumnConfig(
        entries,
        ['entry_by_user', 'entry_deleted_at'],
        [
          {
            key: 'user',
            displayName: 'Entry by user',
            selector: (entry) => entry.entry_by_user.user_name,
            sortable: true, // Enable sorting
            filterable: true,
          },
        ]
      );
    this.entry.dataSource.data = entries;
    this.entry.columnConfigs = columnConfigs;
    this.entry.displayedColumns = displayedColumns;
    this.cdr.markForCheck();
  }

  private configureDiscussionTable(topics: TopicDetails[]): void {
    // topics = topics.sort((a, b) => {
    //   const isAUserEntry =
    //     a.topic_posted_by_user_id.toString() === this.user.user_id;
    //   const isBUserEntry =
    //     b.topic_posted_by_user_id.toString() === this.user.user_id;

    //   if (isAUserEntry && !isBUserEntry) return -1;
    //   if (!isAUserEntry && isBUserEntry) return 1;

    //   const aEntries = a.entries.length;
    //   const bEntries = b.entries.length;

    //   if (aEntries !== bEntries) {
    //     return bEntries - aEntries; // Sort by number of entries descending
    //   }

    //   return b.topic_created_at.localeCompare(a.topic_created_at);
    // });

    const { columnConfigs, displayedColumns } =
      this.commonService.configureBaseColumnConfig(
        topics,
        ['entries', 'course', 'user', 'topic_by_user', 'topic_deleted_at'],
        [
          {
            key: 'course.course_name',
            displayName: 'Course',
            selector: (topic) => topic.course.course_name,
            sortable: true, // Enable sorting
            filterable: true,
          },
          {
            key: 'topic_by_user.user_name',
            displayName: 'Created by user',
            selector: (topic) => topic.topic_by_user.user_name,
            sortable: true, // Enable sorting
            filterable: true,
          },
          {
            key: 'entries',
            displayName: 'No. of entries',
            selector: (topic) => topic.entries.length,
            sortable: true, // Enable sorting
            filterable: true,
          },
        ]
      );

    columnConfigs.push({
      columnDef: 'action',
      displayName: '',
      cell: () => '',
      sortable: false, // Disable sorting for action column
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

  deleteTopic = (element: TopicDetails) => {
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
            topics = this.filterTopicDetails(topics);
            this.topicList.dataSource.data = topics;
            this.entry = {
              dataSource: new MatTableDataSource<TableRow>([]),
              columnConfigs: [],
              displayedColumns: [],
              title: '',
              subtitle: '',
            };
            this.cdr.markForCheck();
          });
        });
      }
    });
  };

  sortTopics = (sort: Sort) => {
    const dataSource = this.topicList
      .dataSource as MatTableDataSource<TableRow>;
    const topicsData = dataSource.data as TopicDetails[];

    if (!sort.active || sort.direction === '') {
      this.configureDiscussionTable(topicsData);
      this.cdr.markForCheck();
      return;
    }

    dataSource.data = topicsData
      .slice()
      .sort((a: TopicDetails, b: TopicDetails) => {
        const isAsc = sort.direction === 'asc';
        var valueA = dataSource.sortingDataAccessor(a, sort.active);
        var valueB = dataSource.sortingDataAccessor(b, sort.active);

        if (valueA == undefined || valueB == undefined) {
          valueA = this.getNestedValue(a, sort.active);
          valueB = this.getNestedValue(b, sort.active);
        }

        if (valueA == null || valueB == null) {
          return (valueA == null ? -1 : 1) * (isAsc ? 1 : -1);
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB) * (isAsc ? 1 : -1);
        }

        const numA =
          typeof valueA === 'number' ? valueA : parseFloat(valueA as string);
        const numB =
          typeof valueB === 'number' ? valueB : parseFloat(valueB as string);

        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA < numB ? -1 : 1) * (isAsc ? 1 : -1);
        }

        return String(valueA).localeCompare(String(valueB)) * (isAsc ? 1 : -1);
      });
    this.cdr.markForCheck();
  };

  sortEntries = (sort: Sort) => {
    const dataSource = this.entry.dataSource as MatTableDataSource<TableRow>;
    const entriesData = dataSource.data as EntryDetails[];

    if (!sort.active || sort.direction === '') {
      dataSource.data = entriesData.slice();
      this.cdr.markForCheck();
      return;
    }

    dataSource.data = entriesData
      .slice()
      .sort((a: EntryDetails, b: EntryDetails) => {
        const isAsc = sort.direction === 'asc';
        var valueA = dataSource.sortingDataAccessor(a, sort.active);
        var valueB = dataSource.sortingDataAccessor(b, sort.active);

        if (valueA == undefined || valueB == undefined) {
          valueA = this.getNestedValue(a, sort.active);
          valueB = this.getNestedValue(b, sort.active);
        }

        if (valueA == null || valueB == null) {
          return (valueA == null ? -1 : 1) * (isAsc ? 1 : -1);
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB) * (isAsc ? 1 : -1);
        }

        const numA =
          typeof valueA === 'number' ? valueA : parseFloat(valueA as string);
        const numB =
          typeof valueB === 'number' ? valueB : parseFloat(valueB as string);

        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA < numB ? -1 : 1) * (isAsc ? 1 : -1);
        }

        return String(valueA).localeCompare(String(valueB)) * (isAsc ? 1 : -1);
      });

    this.cdr.markForCheck();
  };

  getNestedValue(obj: any, path: string) {
    return path
      .split('.')
      .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  }
}
