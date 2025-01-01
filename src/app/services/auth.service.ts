// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use environment variable for better flexibility
  private baseUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Register user
  register(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}/register`;
    console.log('Registering at URL:', url); // Debugging
    return this.http.post(url, { email, password });
  }

  // Login user
  login(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}/login`;
    console.log('Logging in at URL:', url); // Debugging
    return this.http.post(url, { email, password });
  }

  // Store token in localStorage
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Retrieve token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Logout user
  logout() {
    localStorage.removeItem('token');
  }
}
