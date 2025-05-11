import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { CsvDataService } from '../../service/csv-data-service.service';

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

  show = {course: false, students: false, topics: false};
  
  miniCardData: MiniCardSummary[] = [];
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

  ngOnInit() {
    this.csvDataService.loadAllData().subscribe({
      next: ({ courses, users, enrollments, topics }) => {
        const stats = [
          { title: 'Total Courses', value: courses.length, icon: "school", link: () => this.toggleChart('course') },
          { title: 'Total Students', value: users.length, icon: "group", link: () => this.toggleChart('students') },
          { title: 'Total Topics', value: topics.length, icon: "forum", link: () => this.toggleChart('topics') }
        ];

        this.miniCardData = stats.map(stat => ({
          title: stat.title,
          textValue: stat.value.toString(),
          icon: stat.icon.toString(),
          link: stat.link,
        }));

        const topicStats: TopicCardSummary[] = [
          { title: 'Topics per Course', textValue: '', icon: '', link: '', chartType: 'bar' },
          { title: 'Topics Over Time', textValue: '', icon: '', link: '', chartType: 'line' },
          { title: 'Topic States Distribution', textValue: '', icon: '', link: '', chartType: 'pie' },
          { title: 'Topics per User', textValue: '', icon: '', link: '', chartType: 'bar' },
        ];

        this.topicData = topicStats;
      }
    });
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

interface MiniCardSummary {
  title: string;
  textValue: string;
  icon: string;
  link: () => void;
}

interface TopicCardSummary {
  title: string;
  textValue: string;
  icon: string;
  link: string;
  chartType: string;
}
