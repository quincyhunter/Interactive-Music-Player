import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service'; // A service you'll create for auth
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res:any) => {
        // Suppose res contains { token, user } from your server
        this.authService.setToken(res.token);
        // Possibly store user info in a global service or local storage
        this.router.navigate(['/home']); 
      },
      error: (err:any) => {
        // Show an error
        this.errorMessage = err.error.message || 'Login failed';
      }
    });
  }
}
