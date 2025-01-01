// src/app/services/music-player.ts

import { Injectable } from '@angular/core';
import { MusicData } from '../data/music-data';

@Injectable({
  providedIn: 'root',
})
export class MusicPlayer {
  library: MusicData[] = [];
  private tokenKey: string = 'token'; // Key used to store token in localStorage
  private userKey: string = 'user'; // Key used to store user info

  constructor() {
    // Optionally, load library from localStorage or elsewhere
    this.loadLibrary();
  }

  // Set token
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set user information
  setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Get user information
  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Clear token and user info
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.library = [];
  }

  // Queue operations
  private queue: MusicData[] = [];
  private history: MusicData[] = [];

  addToQueue(track: MusicData) {
    this.queue.push(track);
  }

  getQueue(): MusicData[] {
    return this.queue;
  }

  clearQueue(force: boolean = false) {
    if (force) {
      this.queue = [];
    } else {
      this.queue.length = 0;
    }
  }

  addToHistory(track: MusicData) {
    this.history.push(track);
  }

  getLastSong(): MusicData | null {
    return this.history.pop() || null;
  }

  queueShift() {
    this.queue.shift();
  }

  queueFront(track: MusicData) {
    this.queue.unshift(track);
  }

  // Library operations
  getLibrary(): MusicData[] {
    return this.library;
  }

  setLibrary(library: MusicData[]) {
    this.library = library;
  }

  // Load library from localStorage or other source
  loadLibrary() {
    // Optionally implement this method to load the library on service initialization
  }
}
