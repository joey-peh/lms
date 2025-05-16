import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginUser } from '../../models/lms-models';
import { LmsSandboxService } from '../../store/sandbox/lms-sandbox-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private sandbox = inject(LmsSandboxService);

  username = '';
  password = '';
  error = '';

  users: LoginUser[] = [
    {
      user_login_id: 'o6v7dy55',
      user_id: '80299',
      username: 'user_115',
      password: 'i123',
      role: 'instructor',
      course_id: [23409],
    },
    {
      user_login_id: 'admin',
      user_id: 'admin',
      username: 'admin',
      password: 'a123',
      role: 'admin',
      course_id: [23409, 75861, 34290, 15697, 22376],
    },
  ];

  login() {
    const user = this.users.find((u) => u.user_login_id === this.username);
    if (user && user.password === this.password) {
      // Store the user in the store instead of localStorage
      this.sandbox.setCurrentUser(user);
      this.router.navigate(['/home']);
    } else {
      this.error = 'Invalid username or password';
    }
  }
}
