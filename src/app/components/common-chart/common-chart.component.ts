import { Component, Input, OnInit } from '@angular/core';
import { ChartOptions, ChartDataset, ChartType, Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-common-chart',
  standalone: false,
  templateUrl: './common-chart.component.html',
  styleUrl: './common-chart.component.css',
})
export class CommonChartComponent implements OnInit {
  @Input() barChartLabels: string[] = [];
  @Input() barChartType: ChartType = 'bar';
  @Input() barChartLegend = true;
  @Input() barChartData: ChartDataset[] = [];
  @Input() height = '30vh';
  @Input() width : string | undefined = '100%';
  @Input() maxValue: number = 0;

  barChartOptions: ChartOptions = {};
  ngOnInit(): void {
    this.barChartOptions = {
      responsive: true,
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 30,
          bottom: 20,
        },
      },
      scales:
        this.barChartType == 'pie'
          ? {}
          : {
              y: {
                beginAtZero: true,
                max: this.maxValue,
              },
            },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '##3f51b5',
          formatter: (value) => value,
        },
        legend: { position: this.barChartType == 'pie' ? 'right' : 'top' },
      },
    };
  }
}
