import { Component } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-enrolment-chart',
  standalone: false,
  templateUrl: './enrolment-chart.component.html',
  styleUrl: './enrolment-chart.component.css'
})
export class EnrolmentChartComponent {
  checkData = "";
  constructor(private http: HttpClient) {
    this.http.get('./assets/courses.csv', { responseType: 'text' })
      .subscribe(data => {
        this.checkData = data;
      });
  }

  barChartOptions: ChartOptions = {
    responsive: true,
  };

  barChartLabels = ['January', 'February', 'March', 'April'];
  barChartType: ChartType = 'bar';
  barChartLegend = true;

  barChartData: ChartDataset[] = [
    { data: [30, 45, 60, 25], label: 'Enrolments' },
  ];
}
