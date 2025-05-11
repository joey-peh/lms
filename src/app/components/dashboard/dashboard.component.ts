import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { CsvDataService } from '../../service/csv-data-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import { Course } from '../../models/course';
import { Enrollment } from '../../models/enrollment';
import { User } from '../../models/user';
import { ColumnConfig, Topic } from '../../models/topic';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false
})
export class DashboardComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private csvDataService = inject(CsvDataService);
  private cdr = inject(ChangeDetectorRef);

  show = { course: false, students: false, topics: false };

  miniCardData: MiniCard[] = [];
  topicData: CommonChart[] = [];
  enrollmentData!: CommonChart;
  studentData: CommonChart | undefined;
  
  discussionData!: { dataSource: Topic[]; displayedColumns: string[] };
  columnConfigs: ColumnConfig[] = [
    { columnDef: 'topic_id', header: 'Topic ID', cell: (element: { topic_id: any; }) => element.topic_id },
    { columnDef: 'topic_title', header: 'Title', cell: (element: { topic_title: any; }) => element.topic_title },
    { columnDef: 'topic_content', header: 'Content', cell: (element: { topic_content: any; }) => element.topic_content },
    {
      columnDef: 'topic_created_at',
      header: 'Created At',
      cell: (element: { topic_created_at: string | number | Date; }) => new Date(element.topic_created_at).toLocaleString()
    },
    { columnDef: 'topic_state', header: 'State', cell: (element: { topic_state: any; }) => element.topic_state }
  ];

  cardLayout = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {

      //handset
      if (matches) {
        return {
          columns: 1,
          miniCard: { cols: 1, rows: 1 },
          midCard: { cols: 1, rows: 2 },
          largeCard: { cols: 1, rows: 4 },
        };
      }

      return {
        columns: 4,
        miniCard: { cols: 1, rows: 1 },
        midCard: { cols: 2, rows: 2 },
        largeCard: { cols: 4, rows: 4 },
      };
    })
  );

  ngOnInit(): void {
    this.csvDataService.loadAllData().subscribe({
      next: ({ courses, users, enrollments, topics }: { courses: Course[], users: User[], enrollments: Enrollment[], topics: Topic[] }) => {
        this.miniCardData = this.createMiniCardData(courses, users, topics);
        this.topicData = this.createTopicCommonChartStats(courses, users, topics);
        this.enrollmentData = this.createEnrollmentChartStats(courses, enrollments);

        this.discussionData = {
          dataSource: topics,
          displayedColumns: ['topic_id', 'topic_title', 'topic_content', 'topic_created_at', 'topic_state']
        };

        console.log("this.discussionData", this.discussionData);
      },
      error: (err) => console.error('Error loading data:', err)
    });
  }

  private createEnrollmentChartStats(courses: Course[], enrollments: Enrollment[]): CommonChart {
    var label = courses.map(course => course.course_name);
    var counts: number[] = [];
    courses.forEach(course => {
      const count = enrollments.filter(e => e.course_id === course.course_id && e.enrollment_state === 'active').length;
      counts.push(count);
    });
    const barChartData = [{ data: counts, label: 'Topics' }];
    return {
      title: 'Number of Enrollments by Course',
      barChartLabels: label,
      barChartData: barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '50vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private createMiniCardData(courses: Course[], users: User[], topics: Topic[]): MiniCard[] {
    return [
      { title: 'Total Courses', value: courses.length, icon: 'school', link: () => this.toggleChart('course') },
      { title: 'Total Students', value: users.length, icon: 'group', link: () => this.toggleChart('students') },
      { title: 'Total Topics', value: topics.length, icon: 'forum', link: () => this.toggleChart('topics') }
    ].map(stat => ({
      title: stat.title,
      textValue: stat.value.toString(),
      icon: stat.icon,
      link: stat.link
    }));
  }

  private createTopicCommonChartStats(courses: Course[], users: User[], topics: Topic[]): CommonChart[] {
    return [
      this.getTopicsPerCourse(courses, topics),
      this.getTopicsOverTime(topics),
      this.getTopicStatesDistribution(topics),
      this.getTopicsPerUser(users, topics)
    ];
  }

  private getTopicsPerCourse(courses: Course[], topics: Topic[]): CommonChart {
    const perCourseLabel = courses.map(course => course.course_name);
    const courseCounts = courses.map(course =>
      topics.filter(topic => topic.course_id === course.course_id && topic.topic_deleted_at === 'NA').length
    );

    const barChartData = [{ data: courseCounts, label: 'Topics' }];
    return {
      title: 'Topics per Course',
      barChartLabels: perCourseLabel,
      barChartData: barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private getTopicsOverTime(topics: Topic[]): CommonChart {
    // Group topics by month/year
    const topicsByMonth: { [key: string]: number } = {};
    topics.forEach(topic => {
      const date = new Date(topic.topic_created_at);
      if (!isNaN(date.getTime())) { // Validate date
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g., "2024-6"
        topicsByMonth[monthYear] = (topicsByMonth[monthYear] || 0) + 1;
      }
    });

    const sortedKeys = Object.keys(topicsByMonth).sort((a, b) => a.localeCompare(b)); // Chronological sort
    const labels = sortedKeys.map(key => key);
    const data = sortedKeys.map(key => topicsByMonth[key]);
    const barChartData = [{ data: labels.length ? data : [0], label: 'Topics Created' }];

    return {
      title: 'Topics Over Time',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData: barChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  private getTopicStatesDistribution(topics: Topic[]): CommonChart {
    const stateCounts = {
      Active: topics.filter(topic => topic.topic_state === 'active').length,
      Unpublished: topics.filter(topic => topic.topic_state === 'unpublished').length,
      Deleted: topics.filter(topic => topic.topic_state === 'deleted').length
    };

    const labels = ['Active', 'Unpublished', 'Deleted'];
    const data = [stateCounts.Active, stateCounts.Unpublished, stateCounts.Deleted];
    const barChartData = [{ data: data.filter(count => count > 0), label: 'Topics' }];

    return {
      title: 'Topic States Distribution',
      barChartLabels: labels,
      barChartData: barChartData,
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
    const barChartData = [{ data: labels.length ? data : [0], label: 'Topics' }];

    console.log("this.getMaxValue(barChartData)", this.getMaxValue(barChartData));
    return {
      title: 'Topics per User',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData: barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData)
    };
  }

  toggleChart(type: 'course' | 'students' | 'topics' | '') {
    this.show = {
      course: false,
      students: false,
      topics: false,
      [type]: true
    };
    this.cdr.detectChanges();
  }

  private getMaxValue(barChartData: ChartDataset[]): number {
    const data = barChartData?.flatMap(dataset =>
      Array.isArray(dataset.data) ? dataset.data.filter((val): val is number => val != null) : [1]
    ) ?? [1];
    return Math.ceil(Math.max(...data) * 1.2);
  }

}

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
