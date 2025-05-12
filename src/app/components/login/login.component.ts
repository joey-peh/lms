import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginUserInformation } from '../../models/lms-models';
import { CsvDataStoreService } from '../../service/csv-data-store-service.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private csvDataStore = inject(CsvDataStoreService);

  username = '';
  password = '';
  error = '';

  users: LoginUserInformation[] = [
    {
      username: 'instructor',
      password: 'i123',
      role: 'instructor',
      name: 'John',
    },
    { username: 'admin', password: 'a123', role: 'admin', name: 'Mary' },
  ];

  login() {
    const user = this.users.find((u) => u.username === this.username);
    if (user && user.password === this.password) {
      // Store the user in the store instead of localStorage
      this.csvDataStore.setCurrentUser(user);
      this.router.navigate(['/home']);
    } else {
      this.error = 'Invalid username or password';
    }
  }
}
