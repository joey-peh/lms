import { Injectable } from '@angular/core';
import { ColumnDefinition } from '../models/lms-models';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor() {}

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
          filterable: true
        });
      });
    }

    return { displayedColumns, columnConfigs };
  }

  private formatDisplayName(key: string): string {
    return key
      .replace(/topic_|user_/g, '')
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
