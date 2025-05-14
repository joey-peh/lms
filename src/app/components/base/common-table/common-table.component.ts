import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  TableDetails,
  TableRow,
  TopicDetails,
} from '../../../models/lms-models';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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
  @Input() sortFn?: (data: any) => void;
  @Input() showDeleteButtonFn?: (element: any) => boolean;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columnFilters: { [key: string]: string } = {};

  ngOnInit(): void {
    this.tableData.dataSource.filterPredicate = (
      data: any,
      filter: string
    ): boolean => {
      const filters: { id: string; value: string }[] = JSON.parse(filter);

      return filters.every(({ id, value }) => {
        const config = this.tableData.columnConfigs.find(
          (col) => col.columnDef === id
        );

        if (!config || !config.filterable) {
          return true;
        }

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
    this.tableData.dataSource.sort = this.sort;
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

  applySorting(sort: Sort): void {
    if (this.sortFn) {
      this.sortFn(sort);
    } else {
      const dataSource = this.tableData
        .dataSource as MatTableDataSource<TableRow>;
      const topicsData = dataSource.data as TableRow[];

      if (!sort.active || sort.direction === '') {
        this.cdr.markForCheck();
        return;
      }

      dataSource.data = topicsData.slice().sort((a: TableRow, b: TableRow) => {
        const isAsc = sort.direction === 'asc';
        var valueA = dataSource.sortingDataAccessor(a, sort.active);
        var valueB = dataSource.sortingDataAccessor(b, sort.active);

        if (valueA == undefined || valueB == undefined) {
          valueA = this.getNestedValue(a, sort.active);
          valueB = this.getNestedValue(b, sort.active);
        }

        if (valueA == null || valueB == null) {
          return (valueA == null ? -1 : 1) * (isAsc ? 1 : -1);
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB) * (isAsc ? 1 : -1);
        }

        const numA =
          typeof valueA === 'number' ? valueA : parseFloat(valueA as string);
        const numB =
          typeof valueB === 'number' ? valueB : parseFloat(valueB as string);

        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA < numB ? -1 : 1) * (isAsc ? 1 : -1);
        }

        return String(valueA).localeCompare(String(valueB)) * (isAsc ? 1 : -1);
      });
    }
  }

  getNestedValue(obj: any, path: string) {
    return path
      .split('.')
      .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  }
}
