import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CommonChart,
  Course,
  EnrollmentDetails,
  MiniCard,
  TableDetails,
  TableRow,
  TopicDetails,
} from '../../models/lms-models';
import { BaseUserComponent } from '../base/base-user.component';
import { ChartService } from '../../service/chart.service';
import { MatTableDataSource } from '@angular/material/table';
import { LmsSandboxService } from '../../store/sandbox/lms-sandbox-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false,
})
export class DashboardComponent extends BaseUserComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private cdr = inject(ChangeDetectorRef);
  private chartService = inject(ChartService);

  courses$ = this.sandbox.getCourses();

  miniCardData$: Observable<MiniCard[]>;
  topicData$: Observable<CommonChart[]>;
  entryData$: Observable<CommonChart[]>;
  enrollmentData$: Observable<CommonChart[]>;
  tableData$: Observable<TableDetails<TableRow>[]>;

  show = { course: false, students: false, topics: false, entries: false };

  cardLayout = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => ({
      columns: matches ? 1 : 4,
      miniCard: { cols: 1, rows: 1 },
      midCard: { cols: matches ? 1 : 2, rows: 2 },
      largeCard: { cols: matches ? 1 : 4, rows: 4 },
    }))
  );

  constructor() {
    super();
    this.miniCardData$ = combineLatest([
      this.courses$,
      this.sandbox.getEnrollmentDetails(),
      this.sandbox.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topics]) => {
        return this.createMiniCardData(courses, users, topics);
      })
    );

    this.topicData$ = combineLatest([
      this.chartService.getTopicPopularityChart(),
      this.chartService.getTopicsByRole(),
      this.chartService.getTopicsPerCourse(),
      this.chartService.getTopicsPerUser(),
      this.chartService.getTopicsOverTime(),
      this.chartService.getTopicStatesDistribution(),
    ]).pipe(map((chartObservables) => chartObservables as CommonChart[]));

    this.entryData$ = combineLatest([
      this.chartService.getEntriesByRole(),
      this.chartService.getEntriesByStudent(),
      this.chartService.getEngagementByCourse(),
      this.chartService.getDiscussionActivityOverTime(),
      this.chartService.getEntriesOverTime(),
      this.chartService.getEntriesPerCourse(),
    ]).pipe(map((chartObservables) => chartObservables as CommonChart[]));

    this.enrollmentData$ = combineLatest([
      this.chartService.createEnrollmentChartStats(),
      this.chartService.createPerCourseEnrollmentTrendChart(),
    ]).pipe(map((chartObservables) => chartObservables as CommonChart[]));

    this.tableData$ = combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, enrollments]) => [
        this.buildParticipationTable(topics, enrollments),
      ])
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  private buildParticipationTable(
    topics: TopicDetails[],
    enrollments: EnrollmentDetails[]
  ): TableDetails<TableRow> {
    const participationTable = this.getParticipationTable(topics, enrollments);

    const columns = ['name', ...participationTable.headers.slice(1)];
    const columnConfigs = columns.map((col) => ({
      columnDef: col,
      displayName: col === 'name' ? 'Student Name' : col,
      cell: (row: TableRow) => `${row[col] ?? ''}`,
      sortable: false,
      filterable: true,
    }));

    const tableRows: TableRow[] = participationTable.rows.map((row) => {
      const rowData: TableRow = { name: row.name };
      participationTable.headers.slice(1).forEach((month, idx) => {
        rowData[month] = row.values[idx];
      });
      return rowData;
    });

    return {
      dataSource: new MatTableDataSource(tableRows),
      columnConfigs,
      displayedColumns: columns,
      title: 'Student Participation',
      subtitle:
        'Details the number of posts made by each student, providing a comprehensive view of individual engagement levels.',
    };
  }

  getParticipationTable(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[],
    groupBy: 'course' | 'topic' = 'course'
  ): { headers: string[]; rows: { name: string; values: number[] }[] } {
    const engagementByGroup: {
      [groupName: string]: { [userId: string]: number };
    } = {};

    for (const topic of topicsWithDetails) {
      const groupName =
        groupBy === 'course' ? topic.course.course_name : topic.topic_title;

      for (const entry of topic.entries) {
        const userId = entry.entry_posted_by_user_id.toString();
        if (!userId || userId === 'N/A') continue;

        if (!engagementByGroup[groupName]) {
          engagementByGroup[groupName] = {};
        }

        engagementByGroup[groupName][userId] =
          (engagementByGroup[groupName][userId] || 0) + 1;
      }
    }

    const sortedGroupNames = Object.keys(engagementByGroup).sort();

    const usersById: Record<string, string> = {};
    users.forEach((user) => {
      usersById[user.user_id.toString()] = user.user.user_name;
    });

    const allUserIds = users.map((user) => user.user_id.toString());

    const rows = allUserIds
      .map((userId) => {
        const name = usersById[userId] ?? 'Unknown';
        const values = sortedGroupNames.map(
          (group) => engagementByGroup[group]?.[userId] ?? 0
        );
        const total = values.reduce((sum, val) => sum + val, 0);
        return { name, values: [...values, total] };
      })
      .sort(
        (a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1]
      );

    const headers = ['Student Name', ...sortedGroupNames, 'Total'];
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
        value:
          this.user.role === 'admin'
            ? enrollments.filter((e) => e.enrollment_state === 'active').length
            : enrollments.filter(
                (e) =>
                  e.enrollment_state === 'active' &&
                  e.enrollment_type === 'student'
              ).length,
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
