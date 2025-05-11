import { Component, inject, Input } from '@angular/core';
import { ChartOptions, ChartDataset, ChartType } from 'chart.js';
import { CsvDataService } from '../../service/csv-data-service.service';

@Component({
  selector: 'app-common-chart',
  standalone: false,
  templateUrl: './common-chart.component.html',
  styleUrl: './common-chart.component.css'
})
export class CommonChartComponent {
  private csvDataService = inject(CsvDataService);
  barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '##3f51b5',
        font: {
          weight: 'bold'
        },
        formatter: (value) => value
      }
    }
  };

  @Input() barChartLabels: string[] = [];
  @Input() barChartData: ChartDataset[] = [];
  @Input() barChartType: ChartType = 'bar';
  @Input() barChartLegend = true;

  // courses: Course[] = [];
  // users: User[] = [];
  // enrollments: Enrollment[] = [];

  // ngOnInit(): void {
  //   this.csvDataService.loadAllData().subscribe(data => {
  //     this.courses = data.courses;
  //     this.users = data.users;
  //     this.enrollments = data.enrollments;

  //     this.barChartLabels = [];
  //     const enrolmentCounts: number[] = [];

  //     this.courses.forEach(course => {
  //       this.barChartLabels.push(course.course_name);
  //       const count = this.enrollments.filter(e => e.course_id === course.course_id && e.enrollment_state === 'active').length;
  //       enrolmentCounts.push(count);
  //     });

  //     this.barChartData = [
  //       { data: enrolmentCounts, label: 'Enrolments' }
  //     ];

  //     console.log('All data loaded:', data);
  //   });
// }
}
