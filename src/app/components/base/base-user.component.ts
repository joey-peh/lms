import { OnInit, OnDestroy, inject, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';
import { LoginUser } from '../../models/lms-models';

@Directive()
export abstract class BaseUserComponent implements OnInit, OnDestroy {
  protected csvDataStore = inject(CsvDataStoreService);
  protected user: LoginUser = {
    username: '',
    password: '',
    role: '',
    name: '',
    course_id: [],
  };

  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.csvDataStore
      .getCurrentUser()
      .subscribe((user) => {
        this.user = user ?? {
          username: '',
          password: '',
          role: '',
          name: '',
          course_id: [],
        };
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }
}
