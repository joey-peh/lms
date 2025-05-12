import { Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';

@Component({
  selector: 'app-nav',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
  standalone: false,
})
export class NavComponent implements OnInit {
  private router = inject(Router);
  private csvDataStore = inject(CsvDataStoreService);

  userName: string = '';
  userRole: string = '';
  filteredMenuItems: {
    label: string;
    icon: string;
    link: string;
    roles: string[];
  }[] = [];

  ngOnInit(): void {
    this.csvDataStore.getCurrentUser().subscribe((user) => {
      this.userName = user?.name ?? "";
      this.userRole = user?.role ?? "";
    });
    this.filterMenuItems();
  }

  filterMenuItems() {
    this.filteredMenuItems = this.menuItems.filter((item) =>
      item.roles.includes(this.userRole)
    );
  }

  signOut(): void {
    this.csvDataStore.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  menuItems = [
    {
      label: 'Discussions',
      link: 'discussions',
      icon: 'forum',
      roles: ['admin', 'instructor'],
    },
    {
      label: 'Dashboard',
      link: 'home',
      icon: 'home',
      roles: ['admin', 'instructor'],
    }
  ];

  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
}
