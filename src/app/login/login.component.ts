import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  users = {
    instructor: { username: 'instructor', password: 'test123', role: 'instructor' },
    admin: { username: 'admin', password: 'admin123', role: 'admin' }
  };

  constructor(private router: Router) { }

  login() {
    const user = this.users[this.username as keyof typeof this.users];
    if (user && user.password === this.password) {
      localStorage.setItem('user', JSON.stringify(user));
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Invalid username or password';
    }
  }

}
