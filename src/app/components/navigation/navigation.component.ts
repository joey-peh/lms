import { Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BaseUserComponent } from '../base/base-user.component';

interface MenuItem {
  label: string;
  icon: string;
  link: string;
  roles: string[];
}

@Component({
  selector: 'app-nav',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: false,
})
export class NavComponent extends BaseUserComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  filteredMenuItems: MenuItem[] = [];

  private readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      link: 'home',
      icon: 'home',
      roles: ['admin', 'instructor'],
    },
    {
      label: 'Discussions',
      link: 'discussions',
      icon: 'forum',
      roles: ['admin', 'instructor'],
    },
  ];

  readonly isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(1)
    );

  override ngOnInit(): void {
    super.ngOnInit(); // Call the base class's ngOnInit to set up the user subscription
    this.filterMenuItems(); // Filter menu items after user is set
  }

  private filterMenuItems(): void {
    this.filteredMenuItems = this.menuItems.filter((item) =>
      item.roles.includes(this.user.role)
    );
  }

  signOut(): void {
    this.csvDataStore.setCurrentUser(null);
    this.router.navigate(['/login']);
  }
}
