import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { combineLatest, map, Observable } from 'rxjs';
import {
  Topic,
  Entries,
  ColumnConfig,
  Course,
  User,
} from '../../models/lms-models';
import {
  EntryWithDetails,
  TopicWithDetails,
} from '../../service/csv-data-service.service';
import { CommonServiceService as CommonService } from '../../service/common-service.service';

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
    console.log("selected row", row)
    var entries = row.entries;
    var { columnConfigs, displayedColumns } =
      this.commonService.configureColumnConfig(entries);
    this.entry.dataSource.data = entries;
    this.entry.columnConfigs = columnConfigs;
    this.entry.displayedColumns = displayedColumns;
    this.cdr.markForCheck();
  }

  private configureDiscussionTable(topics: TopicWithDetails[]): void {
    var { columnConfigs, displayedColumns } =
      this.commonService.configureColumnConfig(topics);
    this.discussionData.dataSource.data = topics;
    this.discussionData.columnConfigs = columnConfigs;
    this.discussionData.displayedColumns = displayedColumns;
  }
}
