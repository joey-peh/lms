import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TableDetails } from '../../../models/lms-models';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

export interface TableRow {
  [key: string]: any; 
}

@Component({
  selector: 'app-common-table',
  standalone: false,
  templateUrl: './common-table.component.html',
  styleUrl: './common-table.component.css',
})
export class CommonTableComponent implements AfterViewInit, OnInit {
  private cdr = inject(ChangeDetectorRef);
  protected dialog = inject(MatDialog);
  
  @Input() tableData!: TableDetails<TableRow>;
  @Input() deleteFn?: (data: any) => void;

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  columnFilters: { [key: string]: string } = {};
  showDeleteButton: boolean = false;

  ngOnInit(): void {
    if (this.deleteFn) {
      this.showDeleteButton = true;
    }
    this.tableData.dataSource.filterPredicate = (
      data: any,
      filter: string
    ): boolean => {
      const filters: { id: string; value: string }[] = JSON.parse(filter);

      return filters.every(({ id, value }) => {
        const config = this.tableData.columnConfigs.find(
          (col) => col.columnDef === id
        );

        if (!config || !config.filterable) return true;

        const cellValue = config.cell(data);
        return cellValue
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      });
    };
  }
  ngAfterViewInit(): void {
    this.tableData.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }

  applyFilter(event: Event, column: string): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();

    this.columnFilters[column] = value;

    const tableFilters = Object.keys(this.columnFilters).map((key) => ({
      id: key,
      value: this.columnFilters[key],
    }));

    this.tableData.dataSource.filter = JSON.stringify(tableFilters);
  }

  delete(element: any) {
    if (this.deleteFn) {
      this.deleteFn(element);
    }
  }
}
