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
  @Input() width: string | undefined = '100%';
  @Input() maxValue: number = 0;
  @Input() displayLabel: boolean = true;

  private roundType = ['pie', 'doughnut'];

  barChartOptions: ChartOptions = {};
  ngOnInit(): void {
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 30,
          bottom: 20,
        },
      },
      plugins: {
        datalabels: {
          display: this.displayLabel,
          anchor: 'end',
          align: 'top',
          color: 'black',
          formatter: (value) => Math.round(value),
        },
        legend: {
          position: this.roundType.includes(this.barChartType)
            ? 'right'
            : 'top',
        },
      },
    };

    this.barChartOptions.scales = this.roundType.includes(this.barChartType)
      ? {}
      : {
          y: {
            beginAtZero: true,
            max: this.maxValue,
          },
        };

    if (this.barChartData.length > 2) {
      this.barChartOptions = {
        ...this.barChartOptions,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      };
    }
  }
}
