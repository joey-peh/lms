import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import { Course, Topic, Enrollment, User } from '../../models/lms-models';
import {
  EnrollmentDetails,
  TopicDetails,
} from '../../service/csv-data-service.service';
import { BaseUserComponent } from '../base/base-user.component';

interface MiniCard {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

interface CommonChart {
  title: string;
  subtitle: string;
  barChartLabels: string[];
  barChartData: ChartDataset[];
  barChartType: ChartType;
  barChartLegend: boolean;
  height: string;
  maxValue: number;
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

  courses$ = this.store.getCourses();

  miniCardData$: Observable<MiniCard[]>;
  topicData$: Observable<CommonChart[]>;
  enrollmentData$: Observable<CommonChart>;
  studentData$: Observable<CommonChart>;

  show = { course: false, students: false, topics: false };

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
      map(([courses, users, topics]) =>
        this.createMiniCardData(courses, users, topics)
      )
    );

    this.topicData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
      this.store.getTopicDetails(),
    ]).pipe(
      map(([courses, users, topicsWithDetails]) => {
        var commonChartList: CommonChart[] = [];
        commonChartList.push(
          this.getEntriesPerCourse(topicsWithDetails, courses)
        );
        commonChartList.push(this.getEntriesPerUser(topicsWithDetails, users));
        const chart = this.createTopicCommonChartStats(
          courses,
          users,
          topicsWithDetails
        );
        commonChartList.push(...chart);

        return commonChartList;
      })
    );

    this.enrollmentData$ = combineLatest([
      this.courses$,
      this.store.getEnrollmentDetails(),
    ]).pipe(
      map(([courses, enrollments]) =>
        this.createEnrollmentChartStats(courses, enrollments)
      )
    );

    this.studentData$ = this.store
      .getEnrollmentDetails()
      .pipe(map((users) => this.createStudentChartStats(users)));
  }

  private getEntriesPerCourse(
    topicsWithDetails: TopicDetails[],
    courses: Course[]
  ) {
    var data: { [key: string]: number } = topicsWithDetails.reduce(
      (previousVal: any, currentVal) => {
        const groupValue = currentVal['course_id'];
        previousVal[groupValue] =
          (previousVal[groupValue] || 0) + currentVal.entries.length;
        return previousVal;
      },
      {} as { [key: string]: number }
    );

    const labels: string[] = Object.keys(data).map(
      (x) => courses.find((c) => c.course_id.toString() == x)?.course_name ?? ''
    );
    const counts: number[] = Object.entries(data).map((x) => x[1]);
    const barChartData: ChartDataset[] = [{ data: counts, label: 'Entries' }];

    const barChartConfig: CommonChart = {
      title: 'Entries per Course',
      subtitle: 'Number of entries created per course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
    return barChartConfig;
  }

  private getEntriesPerUser(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[]
  ) {
    var data: { [key: string]: number } = topicsWithDetails.reduce(
      (previousVal: any, currentVal) => {
        const groupValue = currentVal['topic_posted_by_user_id'];
        previousVal[groupValue] =
          (previousVal[groupValue] || 0) + currentVal.entries.length;
        return previousVal;
      },
      {} as { [key: string]: number }
    );

    const labels: string[] = Object.keys(data).map(
      (x) => users.find((c) => c.user_id.toString() == x)?.user.user_name ?? ''
    );
    const counts: number[] = Object.entries(data).map((x) => x[1]);
    const barChartData: ChartDataset[] = [{ data: counts, label: 'Entries' }];

    const barChartConfig: CommonChart = {
      title: 'Entries by User',
      subtitle: 'Number of entries created by user',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
    return barChartConfig;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.store.loadData();
  }

  private createMiniCardData(
    courses: Course[],
    enrollments: EnrollmentDetails[],
    topics: Topic[]
  ): MiniCard[] {
    return [
      {
        title: 'Total Courses',
        value: courses.length,
        icon: 'school',
        link: () => this.toggleChart('course'),
      },
      {
        title: 'Total Topics',
        value: topics.length,
        icon: 'forum',
        link: () => this.toggleChart('topics'),
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

  private createEnrollmentChartStats(
    courses: Course[],
    enrollments: Enrollment[]
  ): CommonChart {
    const labels = courses.map((course) => course.course_name);
    const counts = courses.map(
      (course) =>
        enrollments.filter(
          (e) =>
            e.course_id === course.course_id &&
            e.enrollment_state === 'active' &&
            e.enrollment_type == 'student'
        ).length
    );

    const barChartData: ChartDataset[] = [
      { data: counts, label: 'Student Enrollments' },
    ];
    return {
      title: 'Student Enrollments by Course',
      subtitle: 'Number of enrollment per course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '50vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private createStudentChartStats(users: EnrollmentDetails[]): CommonChart {
    const activeUsers = users.filter(
      (user) => user.user.user_state === 'active'
    ).length;
    const deletedUsers = users.filter(
      (user) => user.user.user_state === 'deleted'
    ).length;

    const labels = ['Active', 'Deleted'];
    const data = [activeUsers, deletedUsers];
    const barChartData: ChartDataset[] = [
      { data: data.filter((count) => count > 0), label: 'Users' },
    ];

    return {
      title: 'User Status Distribution',
      subtitle: 'No idea',
      barChartLabels: labels,
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private createTopicCommonChartStats(
    courses: Course[],
    users: EnrollmentDetails[],
    topics: Topic[]
  ): CommonChart[] {
    return [
      this.getTopicsPerCourse(courses, topics),
      this.getTopicsOverTime(topics),
      this.getTopicStatesDistribution(topics),
      this.getTopicsPerUser(users, topics),
    ].filter((chart) => chart.barChartLabels.length > 0); // Filter out empty charts
  }

  private getTopicsPerCourse(courses: Course[], topics: Topic[]): CommonChart {
    const labels = courses.map((course) => course.course_name);
    const counts = courses.map(
      (course) =>
        topics.filter(
          (topic) =>
            topic.course_id === course.course_id &&
            topic.topic_deleted_at != 'NA'
        ).length
    );

    const barChartData: ChartDataset[] = [{ data: counts, label: 'Topics' }];
    return {
      title: 'Topics per Course',
      subtitle: 'Number of topics created per course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getTopicsOverTime(topics: Topic[]): CommonChart {
    const topicsByMonth: { [key: string]: number } = {};
    topics.forEach((topic) => {
      const dateStr = topic.topic_created_at;
      if (dateStr && dateStr !== 'N/A') {
        const date = new Date(
          dateStr.split(', ')[0].split('/').reverse().join('-')
        ); // Parse dd/MM/yyyy
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
          topicsByMonth[monthYear] = (topicsByMonth[monthYear] || 0) + 1;
        }
      }
    });

    const sortedKeys = Object.keys(topicsByMonth).sort();
    const labels = sortedKeys;
    const data = sortedKeys.map((key) => topicsByMonth[key]);
    const barChartData: ChartDataset[] = [
      { data: labels.length ? data : [0], label: 'Topics Created' },
    ];

    return {
      title: 'Topics Over Time',
      subtitle: 'Useful for getting peak of creation',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getTopicStatesDistribution(topics: Topic[]): CommonChart {
    const stateCounts = {
      active: topics.filter((topic) => topic.topic_state === 'active').length,
      unpublished: topics.filter((topic) => topic.topic_state === 'unpublished')
        .length,
      deleted: topics.filter((topic) => topic.topic_state === 'deleted').length,
    };

    const labels = ['Active', 'Unpublished', 'Deleted'];
    const data = [
      stateCounts.active,
      stateCounts.unpublished,
      stateCounts.deleted,
    ];
    const barChartData: ChartDataset[] = [
      { data: data.filter((count) => count > 0), label: 'Topics' },
    ];

    return {
      title: 'Topic States Distribution',
      subtitle: 'Track distribution state',
      barChartLabels: labels,
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getTopicsPerUser(
    users: EnrollmentDetails[],
    topics: Topic[]
  ): CommonChart {
    const topicsPerUser: { [key: number]: number } = {};
    topics.forEach((topic) => {
      const userId = topic.topic_posted_by_user_id;
      topicsPerUser[userId] = (topicsPerUser[userId] || 0) + 1;
    });

    const filteredUsers = users.filter((user) => topicsPerUser[user.user_id]);
    const labels = filteredUsers.map(
      (user) => user.user.user_name || `User ${user.user_id}`
    );
    const data = filteredUsers.map((user) => topicsPerUser[user.user_id] || 0);
    const barChartData: ChartDataset[] = [
      { data: labels.length ? data : [0], label: 'Topics' },
    ];

    return {
      title: 'Topics by User',
      subtitle: 'Find out frequent poster',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getMaxValue(barChartData: ChartDataset[]): number {
    const data = barChartData
      .flatMap((dataset) =>
        Array.isArray(dataset.data)
          ? dataset.data.filter((val): val is number => val != null)
          : []
      )
      .filter((val) => val > 0);
    return data.length ? Math.ceil(Math.max(...data) * 1.2) : 1;
  }

  toggleChart(type: 'course' | 'students' | 'topics'): void {
    this.show = { course: false, students: false, topics: false, [type]: true };
    this.cdr.markForCheck();
  }
}
