import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginUserInformation } from '../../models/lms-models';

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

  users: LoginUserInformation[] = [
    { username: 'instructor', password: 'test123', role: 'instructor', name: 'John' },
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Mary' }
  ];

  constructor(private router: Router) { }

  login() {
    const user = this.users.find(u => u.username === this.username);
    
    if (user && user.password === this.password) {
      localStorage.setItem('user', JSON.stringify(user));
      this.router.navigate(['/home']);
    } else {
      this.error = 'Invalid username or password';
    }
  }

}
