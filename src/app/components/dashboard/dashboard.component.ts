import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { CsvDataService } from '../../service/csv-data-service.service';
import { ChartDataset, ChartType } from 'chart.js';
import { Course } from '../../models/course';
import { Enrollment } from '../../models/enrollment';
import { User } from '../../models/user';
import { Topic } from '../../models/topic';

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
  topicData: TopicCardSummary[] = [];

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
        this.topicData = this.createTopicStats(courses, users, topics);
      },
      error: (err) => console.error('Error loading data:', err)
    });
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

  private createTopicStats(courses: Course[], users: User[], topics: Topic[]): TopicCardSummary[] {
    return [
      this.getTopicsPerCourse(courses, topics),
      this.getTopicsOverTime(topics),
      this.getTopicStatesDistribution(topics),
      this.getTopicsPerUser(users, topics)
    ];
  }

  private getTopicsPerCourse(courses: Course[], topics: Topic[]): TopicCardSummary {
    const perCourseLabel = courses.map(course => course.course_name);
    const courseCounts = courses.map(course =>
      topics.filter(topic => topic.course_id === course.course_id && topic.topic_deleted_at === 'NA').length
    );

    return {
      title: 'Topics per Course',
      barChartLabels: perCourseLabel,
      barChartData: [{ data: courseCounts, label: 'Topics' }],
      barChartType: 'bar',
      barChartLegend: false
    };
  }

  private getTopicsOverTime(topics: Topic[]): TopicCardSummary {
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

    return {
      title: 'Topics Over Time',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData: [{ data: labels.length ? data : [0], label: 'Topics Created' }],
      barChartType: 'line',
      barChartLegend: false
    };
  }

  private getTopicStatesDistribution(topics: Topic[]): TopicCardSummary {
    const stateCounts = {
      Active: topics.filter(topic => topic.topic_state === 'active').length,
      Unpublished: topics.filter(topic => topic.topic_state === 'unpublished').length,
      Deleted: topics.filter(topic => topic.topic_state === 'deleted').length
    };

    const labels = ['Active', 'Unpublished', 'Deleted'];
    const data = [stateCounts.Active, stateCounts.Unpublished, stateCounts.Deleted];

    return {
      title: 'Topic States Distribution',
      barChartLabels: labels,
      barChartData: [{ data: data.filter(count => count > 0), label: 'Topics' }],
      barChartType: 'pie',
      barChartLegend: false
    };
  }

  private getTopicsPerUser(users: User[], topics: Topic[]): TopicCardSummary {
    const topicsPerUser: { [key: number]: number } = {};
    topics.forEach(topic => {
      const userId = topic.topic_posted_by_user_id;
      topicsPerUser[userId] = (topicsPerUser[userId] || 0) + 1;
    });

    const filteredUsers = users.filter(user => topicsPerUser[user.user_id]);
    const labels = filteredUsers.map(user => user.user_name || `User ${user.user_id}`);
    const data = filteredUsers.map(user => topicsPerUser[user.user_id] || 0);

    return {
      title: 'Topics per User',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData: [{ data: labels.length ? data : [0], label: 'Topics' }],
      barChartType: 'bar',
      barChartLegend: false
    };
  }

  toggleChart(type: 'course' | 'students' | 'topics' | '') {
    this.show = {
      course: false,
      students: false,
      topics: false,
      [type]: true
    };
    console.log("toggleChart called", type, this.show);
    this.cdr.detectChanges();
  }

}

interface MiniCard {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

interface TopicCardSummary {
  title: string;
  barChartLabels: string[];
  barChartData: ChartDataset[];
  barChartType: ChartType;
  barChartLegend: boolean;
}
