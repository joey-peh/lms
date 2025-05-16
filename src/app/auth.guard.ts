import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginUser as LoginUser } from './models/lms-models';
import { map, Observable } from 'rxjs';
import { LmsSandboxService } from './store/sandbox/lms-sandbox-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  private sandbox = inject(LmsSandboxService); // Inject the store service

  canActivate(): Observable<boolean> {
    return this.sandbox.getCurrentUser().pipe(
      map((user: LoginUser | null) => {
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
