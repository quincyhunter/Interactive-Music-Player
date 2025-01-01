// src/app/signup/signup.component.ts

import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  message: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    console.log('SignupComponent: Attempting to register user:', this.email);
    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        console.log('SignupComponent: Registration successful');
        this.message = 'Account created successfully!';
        // Navigate to login after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // 2 seconds delay
      },
      error: (err: any) => {
        console.error('SignupComponent: Registration error:', err);
        this.errorMessage = err.error.message || 'Signup failed';
      }
    });
  }
}
