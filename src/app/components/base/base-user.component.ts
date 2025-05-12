import { OnInit, OnDestroy, inject, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';

export interface User {
  name: string;
  role: string;
}

@Directive()
export abstract class BaseUserComponent implements OnInit, OnDestroy {
  protected csvDataStore = inject(CsvDataStoreService);
  protected user: User = { name: '', role: '' };
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.csvDataStore
      .getCurrentUser()
      .subscribe(user => {
        this.user = user ?? { name: '', role: '' };
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }
}