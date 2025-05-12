import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginUserInformation } from './models/lms-models';
import { CsvDataStoreService } from './service/csv-data-store-service.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  private csvDataStore = inject(CsvDataStoreService); // Inject the store service

  canActivate(): Observable<boolean> {
    return this.csvDataStore.getCurrentUser().pipe(
      map((user: LoginUserInformation | null) => {
        if (user) {
          if (user.role === 'instructor' || user.role === 'admin') {
            return true;
          } else {
            this.router.navigate(['/login']);
            return false;
          }
        }
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
