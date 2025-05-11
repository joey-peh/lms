import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { Course } from '../../models/course';
import { Enrollment } from '../../models/enrollment';
import { User } from '../../models/user';
import { ColumnConfig, Topic } from '../../models/topic';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ChartDataset, ChartType } from 'chart.js';

interface MiniCard {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

interface CommonChart {
  title: string;
  barChartLabels: string[];
  barChartData: ChartDataset[];
  barChartType: ChartType;
  barChartLegend: boolean;
  height: string;
  maxValue: number;
}

interface CardLayout {
  columns: number;
  miniCard: { cols: number; rows: number };
  midCard: { cols: number; rows: number };
  largeCard: { cols: number; rows: number };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);

  // Observables from store
  courses$ = this.store.getCourses();
  users$ = this.store.getUsers();
  enrollments$ = this.store.getEnrollments();
  topics$ = this.store.getTopics();
  loading$ = this.store.getLoading();
  error$ = this.store.getError();

  // Derived Observables for transformed data
  miniCardData$: Observable<MiniCard[]>;
  topicData$: Observable<CommonChart[]>;
  enrollmentData$: Observable<CommonChart>;
  studentData$: Observable<CommonChart>;

  // UI state
  show = { course: false, students: false, topics: false };

  // Discussion table configuration
  discussionData: {
    dataSource: MatTableDataSource<Topic>;
    columnConfigs: ColumnConfig[];
    displayedColumns: string[];
  } = {
    dataSource: new MatTableDataSource<Topic>([]),
    columnConfigs: [],
    displayedColumns: []
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Responsive layout
  cardLayout = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => ({
      columns: matches ? 1 : 4,
      miniCard: { cols: 1, rows: 1 },
      midCard: { cols: matches ? 1 : 2, rows: 2 },
      largeCard: { cols: matches ? 1 : 4, rows: 4 }
    }))
  );

  constructor() {
    // Initialize derived Observables
    this.miniCardData$ = combineLatest([this.courses$, this.users$, this.topics$]).pipe(
      map(([courses, users, topics]) => this.createMiniCardData(courses, users, topics))
    );

    this.topicData$ = combineLatest([this.courses$, this.users$, this.topics$]).pipe(
      map(([courses, users, topics]) => this.createTopicCommonChartStats(courses, users, topics))
    );

    this.enrollmentData$ = combineLatest([this.courses$, this.enrollments$]).pipe(
      map(([courses, enrollments]) => this.createEnrollmentChartStats(courses, enrollments))
    );

    this.studentData$ = this.users$.pipe(
      map(users => this.createStudentChartStats(users))
    );
  }

  ngOnInit(): void {
    this.store.loadData(); // Trigger data loading

    // Configure discussion table when topics change
    this.topics$.subscribe(topics => {
      this.configureDiscussionTable(topics);
      this.cdr.markForCheck(); // Trigger change detection for OnPush
    });
  }

  ngAfterViewInit(): void {
    this.discussionData.dataSource.paginator = this.paginator;
    this.paginator.page.subscribe((event: PageEvent) => {
      console.log('Page:', event.pageIndex, 'Size:', event.pageSize);
    });
  }

  private createMiniCardData(courses: Course[], users: User[], topics: Topic[]): MiniCard[] {
    return [
      { title: 'Total Courses', value: courses.length, icon: 'school', link: () => this.toggleChart('course') },
      { title: 'Total Topics', value: topics.length, icon: 'forum', link: () => this.toggleChart('topics') }
    ].map(stat => ({
      title: stat.title,
      textValue: stat.value.toString(),
      icon: stat.icon,
      link: stat.link
    }));
  }

  private createEnrollmentChartStats(courses: Course[], enrollments: Enrollment[]): CommonChart {
    const labels = courses.map(course => course.course_name);
    const counts = courses.map(course =>
      enrollments.filter(e => e.course_id === course.course_id && e.enrollment_state === 'active').length
    );

    const barChartData: ChartDataset[] = [{ data: counts, label: 'Enrollments' }];
    return {
      title: 'Enrollments by Course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '50vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private createStudentChartStats(users: User[]): CommonChart {
    const activeUsers = users.filter(user => user.user_state === 'active').length;
    const deletedUsers = users.filter(user => user.user_state === 'deleted').length;

    const labels = ['Active', 'Deleted'];
    const data = [activeUsers, deletedUsers];
    const barChartData: ChartDataset[] = [{ data: data.filter(count => count > 0), label: 'Users' }];

    return {
      title: 'User Status Distribution',
      barChartLabels: labels,
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private createTopicCommonChartStats(courses: Course[], users: User[], topics: Topic[]): CommonChart[] {
    return [
      this.getTopicsPerCourse(courses, topics),
      this.getTopicsOverTime(topics),
      this.getTopicStatesDistribution(topics),
      this.getTopicsPerUser(users, topics)
    ].filter(chart => chart.barChartLabels.length > 0); // Filter out empty charts
  }

  private getTopicsPerCourse(courses: Course[], topics: Topic[]): CommonChart {
    const labels = courses.map(course => course.course_name);
    const counts = courses.map(course =>
      topics.filter(topic => topic.course_id === course.course_id && topic.topic_deleted_at != "NA").length
    );

    const barChartData: ChartDataset[] = [{ data: counts, label: 'Topics' }];
    console.log("getTopicsPerCourse counts",counts);
    return {
      title: 'Topics per Course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private getTopicsOverTime(topics: Topic[]): CommonChart {
    const topicsByMonth: { [key: string]: number } = {};
    topics.forEach(topic => {
      const dateStr = topic.topic_created_at;
      if (dateStr && dateStr !== 'N/A') {
        const date = new Date(dateStr.split(', ')[0].split('/').reverse().join('-')); // Parse dd/MM/yyyy
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
          topicsByMonth[monthYear] = (topicsByMonth[monthYear] || 0) + 1;
        }
      }
    });

    const sortedKeys = Object.keys(topicsByMonth).sort();
    const labels = sortedKeys;
    const data = sortedKeys.map(key => topicsByMonth[key]);
    const barChartData: ChartDataset[] = [{ data: labels.length ? data : [0], label: 'Topics Created' }];

    return {
      title: 'Topics Over Time',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private getTopicStatesDistribution(topics: Topic[]): CommonChart {
    const stateCounts = {
      active: topics.filter(topic => topic.topic_state === 'active').length,
      unpublished: topics.filter(topic => topic.topic_state === 'unpublished').length,
      deleted: topics.filter(topic => topic.topic_state === 'deleted').length
    };

    const labels = ['Active', 'Unpublished', 'Deleted'];
    const data = [stateCounts.active, stateCounts.unpublished, stateCounts.deleted];
    const barChartData: ChartDataset[] = [{ data: data.filter(count => count > 0), label: 'Topics' }];

    return {
      title: 'Topic States Distribution',
      barChartLabels: labels,
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private getTopicsPerUser(users: User[], topics: Topic[]): CommonChart {
    const topicsPerUser: { [key: number]: number } = {};
    topics.forEach(topic => {
      const userId = topic.topic_posted_by_user_id;
      topicsPerUser[userId] = (topicsPerUser[userId] || 0) + 1;
    });

    const filteredUsers = users.filter(user => topicsPerUser[user.user_id]);
    const labels = filteredUsers.map(user => user.user_name || `User ${user.user_id}`);
    const data = filteredUsers.map(user => topicsPerUser[user.user_id] || 0);
    const barChartData: ChartDataset[] = [{ data: labels.length ? data : [0], label: 'Topics' }];

    return {
      title: 'Topics per User',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private configureDiscussionTable(topics: Topic[]): void {
    this.discussionData.dataSource.data = topics;
    this.discussionData.columnConfigs = [];
    this.discussionData.displayedColumns = [];

    if (topics.length > 0) {
      const labels = Object.keys(topics[0]).filter(key => key !== 'topic_content'); // Exclude large content
      this.discussionData.displayedColumns = labels;

      labels.forEach(key => {
        this.discussionData.columnConfigs.push({
          columnDef: key,
          displayName: this.formatDisplayName(key),
          cell: (element: Topic) => element[key as keyof Topic],
          sortable: true,
          filterable: key !== 'topic_created_at' && key !== 'topic_deleted_at'
        });
      });
    }
  }

  private formatDisplayName(key: string): string {
    return key
      .replace(/topic_|user_/g, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getMaxValue(barChartData: ChartDataset[]): number {
    const data = barChartData
      .flatMap(dataset => (Array.isArray(dataset.data) ? dataset.data.filter((val): val is number => val != null) : []))
      .filter(val => val > 0);
    return data.length ? Math.ceil(Math.max(...data) * 1.2) : 1;
  }

  toggleChart(type: 'course' | 'students' | 'topics'): void {
    this.show = { course: false, students: false, topics: false, [type]: true };
    this.cdr.markForCheck();
  }

  selectTopic(row: Topic): void {
    console.log('Topic selected:', row);
  }
}