import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import {
  Course,
  Topic,
  Enrollment,
  User,
  TableDetails,
} from '../../models/lms-models';
import {
  EnrollmentDetails,
  EntryDetails,
  TopicDetails,
} from '../../service/csv-data-service.service';
import { BaseUserComponent } from '../base/base-user.component';
import { CommonService } from '../../service/common-service.service';
import { ChartService } from '../../service/chart.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

interface MiniCard {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

export interface CommonChart {
  title: string;
  subtitle: string;
  barChartLabels: string[];
  barChartData: ChartDataset[];
  barChartType: ChartType;
  barChartLegend: boolean;
  height: string;
  width: string | undefined;
  maxValue: number;
}

export interface ParticipationRow {
  name: string;
  [key: string]: string | number; // dynamic keys for each month
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false,
})
export class DashboardComponent
  extends BaseUserComponent
  implements OnInit, AfterViewInit
{
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);
  private chartService = inject(ChartService);

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  courses$ = this.store.getCourses();

  miniCardData$: Observable<MiniCard[]>;
  topicData$: Observable<CommonChart[]>;
  entryData$: Observable<CommonChart[]>;
  enrollmentData$: Observable<CommonChart>;

  show = { course: false, students: false, topics: false, entries: false };

  cardLayout = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => ({
      columns: matches ? 1 : 4,
      miniCard: { cols: 1, rows: 1 },
      midCard: { cols: matches ? 1 : 2, rows: 2 },
      largeCard: { cols: matches ? 1 : 4, rows: 4 },
    }))
  );

  participationData: TableDetails<ParticipationRow> = {
    dataSource: new MatTableDataSource<ParticipationRow>([]),
    columnConfigs: [],
    displayedColumns: [],
  };

  constructor() {
    super();
    this.miniCardData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topics]) =>
        this.createMiniCardData(courses, users, topics)
      )
    );

    this.topicData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topicDetails]) => {
        var commonChartList: CommonChart[] = [
          this.chartService.getTopicsByRole(topicDetails, users),
          this.chartService.getTopicsPerCourse(courses, topicDetails),
          this.chartService.getTopicsPerUser(users, topicDetails),
          this.chartService.getTopicsOverTime(topicDetails),
          this.chartService.getTopicStatesDistribution(topicDetails),
        ];
        return commonChartList;
      })
    );

    this.entryData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topicDetails]) => {
        var commonChartList: CommonChart[] = [
          this.chartService.getEntriesByRole(topicDetails, users),
          this.chartService.getEntriesByStudent(topicDetails, users),
          this.chartService.getEngagementByCourse(topicDetails, courses, users),
          this.chartService.getDiscussionActivityOverTime(topicDetails),
          this.chartService.getEntriesOverTime(topicDetails),
          this.chartService.getEntriesPerCourse(topicDetails, courses, users),
        ];
        return commonChartList;
      })
    );

    this.enrollmentData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
    ]).pipe(
      map(([courses, enrollments]) =>
        this.chartService.createEnrollmentChartStats(courses, enrollments)
      )
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.store.loadData();

    combineLatest([
      this.store.getTopicDetails(),
      this.store.getEnrollmentDetails(),
    ]).subscribe(([topics, enrollments]) => {
      const participationTable = this.getParticipationTable(
        topics,
        enrollments
      );

      // Build table structure
      const columns = ['name', ...participationTable.headers.slice(1)];
      this.participationData.displayedColumns = columns;

      this.participationData.columnConfigs = columns.map((col) => ({
        columnDef: col,
        displayName: col === 'name' ? 'Student Name' : col,
        cell: (row: ParticipationRow) => `${row[col] ?? ''}`,
        sortable: false,
        filterable: false,
      }));

      // Convert row objects to ParticipationRow format
      const tableRows: ParticipationRow[] = participationTable.rows.map(
        (row) => {
          const participationRow: ParticipationRow = { name: row.name };
          participationTable.headers.slice(1).forEach((month, idx) => {
            participationRow[month] = row.values[idx];
          });
          return participationRow;
        }
      );

      this.participationData.dataSource =
        new MatTableDataSource<ParticipationRow>(tableRows);

      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.participationData.dataSource = new MatTableDataSource(
        this.participationData.dataSource.data
      );
      this.participationData.dataSource.paginator = this.paginator;
    });
  }

  getParticipationTable(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[]
  ): { headers: string[]; rows: { name: string; values: number[] }[] } {
    const engagementByMonth: { [month: string]: { [userId: string]: number } } =
      {};

    for (const topic of topicsWithDetails) {
      for (const entry of topic.entries) {
        const dateStr = entry.entry_created_at;
        const userId = entry.entry_posted_by_user_id.toString();

        if (!dateStr || dateStr === 'N/A') continue;

        const date = new Date(
          dateStr.split(', ')[0].split('/').reverse().join('-')
        );
        if (isNaN(date.getTime())) continue;

        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        engagementByMonth[monthKey] = engagementByMonth[monthKey] || {};
        engagementByMonth[monthKey][userId] =
          (engagementByMonth[monthKey][userId] || 0) + 1;
      }
    }

    // Sort months
    const sortedMonths = Object.keys(engagementByMonth).sort();

    // Map users by ID
    const usersById: Record<string, string> = {};
    users.forEach(
      (user) => (usersById[user.user_id.toString()] = user.user.user_name)
    );

    // Collect all unique userIds from data
    const allUserIds = new Set<string>();
    Object.values(engagementByMonth).forEach((monthData) =>
      Object.keys(monthData).forEach((userId) => allUserIds.add(userId))
    );

    const rows = Array.from(allUserIds).map((userId) => {
      const name = usersById[userId] ?? 'Unknown';
      const values = sortedMonths.map(
        (month) => engagementByMonth[month]?.[userId] ?? 0
      );
      return { name, values };
    });

    const headers = ['Student Name', ...sortedMonths];

    return { headers, rows };
  }

  private createMiniCardData(
    courses: Course[],
    enrollments: EnrollmentDetails[],
    topics: TopicDetails[]
  ): MiniCard[] {
    return [
      {
        title: 'Total Courses',
        value: courses.length,
        icon: 'school',
        link: () => this.toggleChart('course'),
      },
      {
        title: 'Topics',
        value: topics.length,
        icon: 'forum',
        link: () => this.toggleChart('topics'),
      },
      {
        title: 'Entries',
        value: topics.map((x) => x.entries).flat().length,
        icon: 'comments',
        link: () => this.toggleChart('entries'),
      },
      {
        title:
          this.user.role === 'admin' ? 'Active Enrollments' : 'Active Students',
        value: this.getEnrollment(enrollments, false).length,
        icon: 'group',
        link: () => this.toggleChart('students'),
      },
    ].map((stat) => ({
      title: stat.title,
      textValue: stat.value.toString(),
      icon: stat.icon,
      link: stat.link,
    }));
  }

  // private createStudentChartStats(users: EnrollmentDetails[]): CommonChart {
  //   const activeUsers = users.filter(
  //     (user) => user.user.user_state === 'active'
  //   ).length;
  //   const deletedUsers = users.filter(
  //     (user) => user.user.user_state === 'deleted'
  //   ).length;

  //   const labels = ['Active', 'Deleted'];
  //   const data = [activeUsers, deletedUsers];
  //   const barChartData: ChartDataset[] = [
  //     { data: data.filter((count) => count > 0), label: 'Users' },
  //   ];

  //   return {
  //     title: 'User Status Distribution',
  //     subtitle: 'No idea',
  //     barChartLabels: labels,
  //     barChartData,
  //     barChartType: 'pie',
  //     barChartLegend: true,
  //     height: '20vh',
  //     maxValue: this.getMaxValue(barChartData),
  //     width: undefined,
  //   };
  // }

  toggleChart(type: 'course' | 'students' | 'topics' | 'entries'): void {
    this.show = {
      course: false,
      students: false,
      topics: false,
      entries: false,
      [type]: true,
    };
    this.cdr.markForCheck();
  }
}
