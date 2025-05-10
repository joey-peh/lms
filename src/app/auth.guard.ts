import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  
  canActivate(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    console.log("checking user role:", user);

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
  }
}
