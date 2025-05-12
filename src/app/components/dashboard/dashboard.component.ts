import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import { Course, User, Topic, Enrollment } from '../../models/lms-models';
import { TopicWithDetails } from '../../service/csv-data-service.service';

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
export class DashboardComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(CsvDataStoreService);
  private cdr = inject(ChangeDetectorRef);

  courses$ = this.store.getCourses();
  users$ = this.store.getUsers();
  enrollments$ = this.store.getEnrollments();
  topics$ = this.store.getTopics();
  loading$ = this.store.getLoading();
  error$ = this.store.getError();

  topicsWithDetails$!: Observable<TopicWithDetails[]>;
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
    // Initialize derived Observables
    this.miniCardData$ = combineLatest([
      this.courses$,
      this.users$,
      this.topics$,
    ]).pipe(
      map(([courses, users, topics]) =>
        this.createMiniCardData(courses, users, topics)
      )
    );

    this.topicData$ = combineLatest([
      this.courses$,
      this.users$,
      this.topics$,
      this.store.getTopicsWithDetails(),
    ]).pipe(
      map(([courses, users, topics, topicsWithDetails]) => {
        var commonChartList: CommonChart[] = [];

        var data = this.getGroupCounts(topicsWithDetails, 'course_id');

        const labels: string[] = Object.keys(data).map(
          (x) =>
            courses.find((c) => c.course_id.toString() == x)?.course_name ?? ''
        );
        const counts = Object.entries(data).map((x) => x[1]);
        const barChartData: ChartDataset[] = [
          { data: counts, label: 'Entries' },
        ];

        const barChartConfig: CommonChart = {
          title: 'Entries per Course',
          subtitle: "Number of entries created per course",
          barChartLabels: labels.length ? labels : ['No Data'],
          barChartData,
          barChartType: 'bar',
          barChartLegend: true,
          height: '20vh',
          maxValue: this.getMaxValue(barChartData),
        };

        commonChartList.push(barChartConfig);
        const chart = this.createTopicCommonChartStats(courses, users, topics);
        commonChartList.push(...chart);

        return commonChartList;
      })
    );

    this.enrollmentData$ = combineLatest([
      this.courses$,
      this.enrollments$,
    ]).pipe(
      map(([courses, enrollments]) =>
        this.createEnrollmentChartStats(courses, enrollments)
      )
    );

    this.studentData$ = this.users$.pipe(
      map((users) => this.createStudentChartStats(users))
    );
  }

  private getGroupCounts<T, K extends keyof T>(
    array: T[],
    key: K
  ): { [key: string]: number } {
    return array.reduce((result, current) => {
      const groupValue = current[key];
      result[groupValue as any] = (result[groupValue as any] || 0) + 1;
      return result;
    }, {} as { [key: string]: number });
  }

  ngOnInit(): void {
    this.store.loadData();
    this.topicsWithDetails$ = this.store.getTopicsWithDetails();
    this.topicsWithDetails$.subscribe((topics) => {});
  }

  private createMiniCardData(
    courses: Course[],
    users: User[],
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
        title: 'Total Students',
        value: users.length,
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
            e.course_id === course.course_id && e.enrollment_state === 'active'
        ).length
    );

    const barChartData: ChartDataset[] = [
      { data: counts, label: 'Enrollments' },
    ];
    return {
      title: 'Enrollments by Course',
      subtitle: "Number of enrollment per course",
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '50vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private createStudentChartStats(users: User[]): CommonChart {
    const activeUsers = users.filter(
      (user) => user.user_state === 'active'
    ).length;
    const deletedUsers = users.filter(
      (user) => user.user_state === 'deleted'
    ).length;

    const labels = ['Active', 'Deleted'];
    const data = [activeUsers, deletedUsers];
    const barChartData: ChartDataset[] = [
      { data: data.filter((count) => count > 0), label: 'Users' },
    ];

    return {
      title: 'User Status Distribution',
      subtitle: "No idea",
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
    users: User[],
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
      subtitle: "Track number of topics created per course",
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
      subtitle: "Useful for getting peak of creation",
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
      subtitle: "Track the topic states",
      barChartLabels: labels,
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getTopicsPerUser(users: User[], topics: Topic[]): CommonChart {
    const topicsPerUser: { [key: number]: number } = {};
    topics.forEach((topic) => {
      const userId = topic.topic_posted_by_user_id;
      topicsPerUser[userId] = (topicsPerUser[userId] || 0) + 1;
    });

    const filteredUsers = users.filter((user) => topicsPerUser[user.user_id]);
    const labels = filteredUsers.map(
      (user) => user.user_name || `User ${user.user_id}`
    );
    const data = filteredUsers.map((user) => topicsPerUser[user.user_id] || 0);
    const barChartData: ChartDataset[] = [
      { data: labels.length ? data : [0], label: 'Topics' },
    ];

    return {
      title: 'Topics per User',
      subtitle: "To know who is frequent poster",
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
