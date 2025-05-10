import { Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
  standalone: false
})
export class NavComponent implements OnInit {
  private router = inject(Router);
  
  userName: string = "";
  userRole: string = "";
  filteredMenuItems: { label: string, icon: string, link: string, roles: string[] }[] = [];

  constructor() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRole = user?.role || ''; // Assume role is saved in the user object
    this.userName = user.name;
  }

  ngOnInit(): void {
    this.filterMenuItems();
  }  
  
  filterMenuItems() {
    this.filteredMenuItems = this.menuItems.filter(item =>
      item.roles.includes(this.userRole)
    );
  }

  signOut(): void {
    localStorage.clear();
    this.router.navigate(['/login']); // Redirect to the login page
  }

  menuItems = [
    { label: 'home',  link: 'home', icon: 'home', roles: ['admin', 'instructor'] },
    { label: 'courses',  link: 'courses', icon: 'school', roles: ['instructor', 'admin'] },
    { label: 'users',  link: 'user', icon: 'group', roles: ['admin'] },
    { label: 'settings',  link: '', icon: 'settings', roles: ['admin'] },
  ];

  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
