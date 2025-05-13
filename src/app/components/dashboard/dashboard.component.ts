import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import { Course, TableDetails } from '../../models/lms-models';
import {
  EnrollmentDetails,
  TopicDetails,
} from '../../service/csv-data-service.service';
import { BaseUserComponent } from '../base/base-user.component';
import { ChartService } from '../../service/chart.service';
import { MatTableDataSource } from '@angular/material/table';
import { TableRow } from '../base/common-table/common-table.component';

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
  maxValue: number;
  [key: string]: any;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false,
})
export class DashboardComponent extends BaseUserComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);
  private chartService = inject(ChartService);

  courses$ = this.store.getCourses();

  miniCardData$: Observable<MiniCard[]>;
  topicData$: Observable<CommonChart[]>;
  entryData$: Observable<CommonChart[]>;
  enrollmentData$: Observable<CommonChart>;
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
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topics]) => {
        courses = this.filterCourse(courses);
        users = this.filterEnrolment(users);
        topics = this.filterTopicDetails(topics);
        return this.createMiniCardData(courses, users, topics);
      })
    );

    this.topicData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topicDetails]) => {
        courses = this.filterCourse(courses);
        users = this.filterEnrolment(users);
        topicDetails = this.filterTopicDetails(topicDetails);
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
        courses = this.filterCourse(courses);
        users = this.filterEnrolment(users);
        topicDetails = this.filterTopicDetails(topicDetails);
        var commonChartList: CommonChart[] = [
          this.chartService.getEntriesByRole(topicDetails, users),
          this.chartService.getEntriesByStudent(topicDetails, users),
          this.chartService.getEngagementByCourse(topicDetails, courses, users),
          this.chartService.getDiscussionActivityOverTime(topicDetails),
          this.chartService.getEntriesOverTime(topicDetails),

          this.chartService.getEntriesPerCourse(topicDetails, courses, users),
        ];
        console.log(this.chartService.getEntriesOverTime(topicDetails));
        return commonChartList;
      })
    );

    this.enrollmentData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
    ]).pipe(
      map(([courses, enrollments]) => {
        courses = this.filterCourse(courses);
        enrollments = this.filterEnrolment(enrollments);
        return this.chartService.createEnrollmentChartStats(
          courses,
          enrollments
        );
      })
    );

    this.tableData$ = combineLatest([
      this.store.getTopicDetails(),
      this.store.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, enrollments]) => {
        topics = this.filterTopicDetails(topics);
        enrollments = this.filterEnrolment(enrollments);
        return [
          this.buildParticipationTable(topics, enrollments),
          this.buildZeroParticipationTable(topics, enrollments),
        ];
      })
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.store.loadData();
  }

  private buildParticipationTable(
    topics: TopicDetails[],
    enrollments: EnrollmentDetails[]
  ): TableDetails<TableRow> {
    const participationTable = this.getParticipationTable(topics, enrollments);

    const columns = ['name', ...participationTable.headers.slice(1)];
    var columnConfigs = columns.map((col) => ({
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
      columnConfigs: columnConfigs,
      displayedColumns: columns,
      title: 'Student Participation',
      subtitle: 'Get list of students who has participated'
    };
  }

  private buildZeroParticipationTable(
    topics: TopicDetails[],
    enrollments: EnrollmentDetails[]
  ): TableDetails<TableRow> {
    const displayedColumns = ['name'];
    const columnConfigs = [
      {
        columnDef: 'name',
        displayName: 'Student Name',
        cell: (row: { name: string }) => row.name,
        sortable: false,
        filterable: false,
      },
    ];
    const zeroStudents = this.getZeroParticipationStudents(topics, enrollments);
    const data: TableRow[] = zeroStudents.map((name) => ({ name }));
    return {
      dataSource: new MatTableDataSource(data),
      columnConfigs: columnConfigs,
      displayedColumns: displayedColumns,
      title: 'Student with Zero Participation',
      subtitle: 'Got list of students who have not participated'
    };
  }

  getZeroParticipationStudents(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[]
  ): string[] {
    const participationMap: Record<string, number> = {};

    for (const topic of topicsWithDetails) {
      for (const entry of topic.entries) {
        const userId = entry.entry_posted_by_user_id.toString();
        if (!userId) continue;
        participationMap[userId] = (participationMap[userId] || 0) + 1;
      }
    }

    return users
      .filter((user) => !participationMap[user.user_id.toString()])
      .map((user) => user.user.user_name);
  }

  getParticipationTable(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[],
    groupBy: 'course' | 'topic' = 'course' // 👈 you can toggle this
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

    // Sort group names
    const sortedGroupNames = Object.keys(engagementByGroup).sort();

    // Map users by ID
    const usersById: Record<string, string> = {};
    users.forEach((user) => {
      usersById[user.user_id.toString()] = user.user.user_name;
    });

    // Collect all user IDs
    const allUserIds = new Set<string>();
    Object.values(engagementByGroup).forEach((groupData) => {
      Object.keys(groupData).forEach((userId) => allUserIds.add(userId));
    });

    const rows = Array.from(allUserIds)
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
        value: this.filterEnrolmentList(enrollments, false).length,
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
