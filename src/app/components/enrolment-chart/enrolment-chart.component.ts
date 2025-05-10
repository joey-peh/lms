import { Component, inject } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset, Chart } from 'chart.js';
import { Course } from '../../models/course';
import { CsvDataService } from '../../service/csv-data-service.service';
import { Enrollment } from '../../models/enrollment';
import { User } from '../../models/user';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);
@Component({
  selector: 'app-enrolment-chart',
  standalone: false,
  templateUrl: './enrolment-chart.component.html',
  styleUrl: './enrolment-chart.component.css'
})
export class EnrolmentChartComponent {
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

  barChartLabels: string[] = [];
  barChartData: ChartDataset[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = true;

  courses: Course[] = [];
  users: User[] = [];
  enrollments: Enrollment[] = [];

  ngOnInit(): void {
    this.csvDataService.loadAllData().subscribe(data => {
      this.courses = data.courses;
      this.users = data.users;
      this.enrollments = data.enrollments;

      this.barChartLabels = [];
      const enrolmentCounts: number[] = [];

      this.courses.forEach(course => {
        this.barChartLabels.push(course.course_name);
        const count = this.enrollments.filter(e => e.course_id === course.course_id && e.enrollment_state === 'active').length;
        enrolmentCounts.push(count);
      });

      this.barChartData = [
        { data: enrolmentCounts, label: 'Enrolments' }
      ];

      console.log('All data loaded:', data);
    });
  }
}
