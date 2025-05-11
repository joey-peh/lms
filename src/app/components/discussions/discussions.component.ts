import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Topic, ColumnConfig } from '../../models/topic';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { combineLatest, map, Observable } from 'rxjs';
import { Course } from '../../models/course';
import { User } from '../../models/user';
import { Entries } from '../../models/entries';

interface ProcessedTopic extends Topic {
  course_name: string | null;
  user_name: string | null;
  entries: Entries[];
}

@Component({
  selector: 'app-discussions',
  standalone: false,
  templateUrl: './discussions.component.html',
  styleUrl: './discussions.component.css',
})
export class DiscussionsComponent implements OnInit, AfterViewInit {
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);

  courses$ = this.store.getCourses();
  users$ = this.store.getUsers();
  topics$ = this.store.getTopics();
  entries$ = this.store.getEntries();

  processedData$: Observable<ProcessedTopic[]>;

  discussionData: {
    dataSource: MatTableDataSource<ProcessedTopic>;
    columnConfigs: ColumnConfig[];
    displayedColumns: string[];
  } = {
    dataSource: new MatTableDataSource<ProcessedTopic>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    // Initialize processed data
    this.processedData$ = combineLatest([
      this.courses$,
      this.users$,
      this.topics$,
      this.entries$,
    ]).pipe(
      map(([courses, users, topics, entries]) =>
        this.getProcessedData(courses, users, topics, entries)
      )
    );
  }

  ngOnInit(): void {
    this.store.loadData();
    // Update table with processed data
    this.processedData$.subscribe((processedTopics) => {
      this.discussionData.dataSource.data = processedTopics;
      this.configureDiscussionTable(processedTopics);
      this.cdr.markForCheck();
    });
  }
  ngAfterViewInit(): void {
    this.discussionData.dataSource.paginator = this.paginator;
    this.paginator.page.subscribe((event: PageEvent) => {
      console.log('Page:', event.pageIndex, 'Size:', event.pageSize);
    });
  }

  selectTopic(row: Topic): void {
    console.log('Topic selected:', row);
  }

  getProcessedData(
    courses: Course[],
    users: User[],
    topics: Topic[],
    entries: Entries[]
  ): any {
    return topics.map((topic) => ({
      ...topic,
      course:
        courses.find((course) => course.course_id === topic.course_id)
          ?.course_name || null,
      user:
        users.find((user) => user.user_id === topic.topic_posted_by_user_id)
          ?.user_name || null,
      entries: entries.find((entries) => entries.topic_id === topic.topic_id),
    }));
  }

  private configureDiscussionTable(topics: ProcessedTopic[]): void {
    this.discussionData.columnConfigs = [];
    this.discussionData.displayedColumns = [];

    if (topics.length > 0) {
      const labels = Object.keys(topics[0]).filter(
        (key) => key !== 'course_id' && key !== 'topic_posted_by_user_id' && key !== 'entries'
      ); // Exclude large content
      this.discussionData.displayedColumns = labels;

      labels.forEach((key) => {
        this.discussionData.columnConfigs.push({
          columnDef: key,
          displayName: this.formatDisplayName(key),
          cell: (element: Topic) => element[key as keyof Topic],
          sortable: true,
          filterable: key !== 'topic_created_at' && key !== 'topic_deleted_at',
        });
      });
    }
  }

  private formatDisplayName(key: string): string {
    return key
      .replace(/topic_|user_/g, '')
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
