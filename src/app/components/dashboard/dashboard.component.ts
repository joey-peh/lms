import { Component, inject, OnInit } from '@angular/core';
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

  cardLayout = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return {
          columns: 1,
          miniCard: { cols: 1, rows: 1 },
          chart: { cols: 1, rows: 2 },
          table: { cols: 1, rows: 4 },
        };
      }

      return {
        columns: 4,
        miniCard: { cols: 1, rows: 1 },
        // chart: { cols: 2, rows: 2 },
        table: { cols: 4, rows: 4 },
      };
    })
  );

  miniCardData: Summary[] = [];

  ngOnInit() {
    this.csvDataService.loadAllData().subscribe({
      next: ({ courses, users, enrollments }) => {
        const stats = [
          { title: 'Total Courses', value: courses.length, icon: "school", link: "/course" },
          { title: 'Total Students', value: users.length, icon: "group", link: "/user" }
        ];

        this.miniCardData = stats.map(stat => ({
          title: stat.title,
          textValue: stat.value.toString(),
          icon: stat.icon.toString(),
          link: stat.link.toString(),
        }));
      }
    });
  }
}

interface Summary {
  title: string;
  textValue: string;
  icon: string;
  link: string;
}
