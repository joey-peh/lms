import { Injectable } from '@angular/core';
import { ChartDataset } from 'chart.js';

interface ColumnDefinition<T> {
  key: string;
  displayName: string;
  selector: (element: T) => T[keyof T];
  sortable?: boolean;
  filterable?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor() {}

  configureColumnConfig<T>(
    data: T[],
    columns: ColumnDefinition<T>[]
  ): {
    columnConfigs: {
      columnDef: string;
      displayName: string;
      cell: (element: T) => any;
      sortable: boolean;
      filterable: boolean;
    }[];
    displayedColumns: string[];
  } {
    const columnConfigs = columns.map((col) => ({
      columnDef: col.key,
      displayName: col.displayName,
      cell: col.selector,
      sortable: col.sortable ?? true,
      filterable: col.filterable ?? true,
    }));

    const displayedColumns = columns.map((col) => col.key);

    return { columnConfigs, displayedColumns };
  }

  configureBaseColumnConfig<T extends Record<string, any>>(
    data: T[],
    excludedKeys: string[] = [
      'course_id',
      'topic_posted_by_user_id',
      'entries',
    ],
    columns: ColumnDefinition<T>[] = []
  ): {
    columnConfigs: {
      columnDef: string;
      displayName: string;
      cell: (element: T) => T[keyof T];
      sortable: boolean;
      filterable: boolean;
    }[];
    displayedColumns: string[];
  } {
    const columnConfigs: {
      columnDef: string;
      displayName: string;
      cell: (element: T) => T[keyof T];
      sortable: boolean;
      filterable: boolean;
    }[] = [];
    const displayedColumns: string[] = [];

    if (data.length > 0 && columns != null && columns.length > 0) {
      columns.map((col) =>
        columnConfigs.push({
          columnDef: col.key,
          displayName: col.displayName,
          cell: col.selector,
          sortable: col.sortable ?? true,
          filterable: col.filterable ?? true,
        })
      );
      columns.map((col) => displayedColumns.push(col.key));
    }

    if (data.length > 0) {
      const labels = Object.keys(data[0]).filter(
        (key) => !excludedKeys.includes(key) && !key.includes('id')
      );

      displayedColumns.push(...labels);

      labels.forEach((key) => {
        columnConfigs.push({
          columnDef: key,
          displayName: this.formatDisplayName(key),
          cell: (element: T) => element[key as keyof T],
          sortable: true,
          filterable: !['topic_created_at', 'topic_deleted_at'].includes(key),
        });
      });
    }

    return { displayedColumns, columnConfigs };
  }

  flattenObject<T extends Record<string, any>>(
    obj: T,
    prefix: string = '',
    excludeArrays: string[] = []
  ): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      // Skip arrays if specified (e.g., 'entries')
      if (excludeArrays.includes(key) && Array.isArray(value)) {
        flattened[key] = value;
        continue;
      }

      // If value is an object and not an array, flatten it
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenObject(value, newKey, excludeArrays);
        Object.assign(flattened, nested);
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  formatDisplayName(key: string): string {
    return key
      .replace(/topic_|user_/g, '')
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getMaxValue(barChartData: ChartDataset[]): number {
    const data = barChartData
      .flatMap((dataset) =>
        Array.isArray(dataset.data)
          ? dataset.data.filter((val): val is number => val != null)
          : []
      )
      .filter((val) => val > 0);
    return data.length ? Math.ceil(Math.max(...data) * 1.2) : 1;
  }
}
