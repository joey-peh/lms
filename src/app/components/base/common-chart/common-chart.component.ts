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

  private roundType = ['pie', 'doughnut'];

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
      plugins: {
        //   datalabels: {
        //     anchor: 'end',
        //     align: 'top',
        //     color: '##3f51b5',
        //     formatter: (value) => value,
        //   },
        legend: {
          position: this.roundType.includes(this.barChartType)
            ? 'right'
            : 'top',
        },
      },
    };

    if (this.barChartData.length > 2) {
      if (this.roundType.includes(this.barChartType)) {
        this.barChartOptions.scales = {
          y: {
            beginAtZero: true,
            max: this.maxValue,
          },
        };
      } else {
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
}
