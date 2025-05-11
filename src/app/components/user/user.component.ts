import { Component, inject, Input, OnInit } from '@angular/core';
import { User } from '../../models/user';
import { MatTableDataSource } from '@angular/material/table';
import { ColumnConfig } from '../../models/topic';
import { CsvDataService } from '../../service/csv-data-service.service';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  private csvDataService = inject(CsvDataService);

  users: User[] = [];
  userData: {
    dataSource: MatTableDataSource<User>;
    columnConfigs: ColumnConfig[];
    displayedColumns: string[];
  } =
    {
      dataSource: new MatTableDataSource<User>([]),
      columnConfigs: [],
      displayedColumns: []
    };

  ngOnInit(): void {
    console.log("this.users", this.users);
    this.userData.dataSource.data = this.users;
    const labels = Object.keys(this.users[0]);
    this.userData.displayedColumns = labels;
    labels.forEach((key) => {
      this.userData.columnConfigs.push({
        columnDef: key, 
        displayName: this.formatDisplayName(key), 
        cell: (element: User) => element[key as keyof User], 
        sortable: true,
        filterable: key !== 'user_created_at' && key !== 'user_deleted_at'
      });
    });

    console.log("this.userData", this.userData);
  }

  selectTopic(row: any) {

  }

  private formatDisplayName(key: string): string {
    return key
      .replace(/user_/g, '') // Remove 'user_' prefix
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '); // Convert to title case
  }
}
