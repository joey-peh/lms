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
  @Input() height = "30vh";
}
