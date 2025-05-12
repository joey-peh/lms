import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonServiceService {
  constructor() {}
  configureColumnConfig<T extends Record<string, any>>(
    data: T[],
    excludedKeys: string[] = ['course_id', 'topic_posted_by_user_id', 'entries']
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

    if (data.length > 0) {
      const labels = Object.keys(data[0]).filter(
        (key) => !excludedKeys.includes(key)
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

  formatDisplayName(key: string): string {
    return key
      .replace(/topic_|user_/g, '')
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
