import { Component, OnInit } from '@angular/core';
import { MusicPlayer } from '../services/music-player';
import { MusicData } from '../data/music-data';
import { PredictionEvent } from '../prediction-event';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  library: MusicData[] = [];
  gesture: string = '';
  
  // For quick sample playback
  currentSong: HTMLAudioElement;
  currentPlayingTrack: MusicData | null = null;

  // Toggle queue display
  isQueueVisible: boolean = false;

  constructor(
    public musicPlayer: MusicPlayer,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    // If there's only 1 track in queue, we might clear it (per your existing logic)
    if (this.musicPlayer.getQueue().length === 1) {
      this.musicPlayer.clearQueue(true);
    }
  }

  ngOnInit(): void {
    // Load library from the MusicPlayer service
    this.library = this.musicPlayer.getLibrary();
  }

  // Toggle the queue dropdown
  toggleQueue() {
    this.isQueueVisible = !this.isQueueVisible;
  }

  // Gesture predictions
  prediction(event: PredictionEvent) {
    this.gesture = event.getPrediction();

    if (this.gesture === 'Two Hands Pointing') {
      this.toggleQueue();
    } else if (this.gesture === 'Two Closed Hands') {
      // Go back to home
      this.router.navigate(['./']);
    }
  }

  // Add a track from library to the main queue
  addToQueue(track: MusicData) {
    this.musicPlayer.addToQueue(track);
    console.log('Queue:', this.musicPlayer.getQueue());
  }

  // Clear entire queue
  clearQueue() {
    this.musicPlayer.clearQueue();
  }

  /**
   * Returns the cover art URL for a given track as a SafeUrl.
   * If `track.art()` is `null`, returns a default image path.
   * If it’s a normal URL or Blob URL, we sanitize it.
   */
  getCoverArtUrl(track: MusicData): SafeUrl {
    const artworkUrl = track.art() ?? '../assets/images/cover.png';
    return this.sanitizer.bypassSecurityTrustResourceUrl(artworkUrl);
  }

  /**
   * Plays a 10-second sample preview of the selected track.
   * If the same track is already playing, it pauses it.
   */
  playSample(track: MusicData, event: Event) {
    event.stopPropagation(); // Prevent any outer clicks from interfering

    // If we're already playing this exact track, pause it
    if (this.currentPlayingTrack === track) {
      if (this.currentSong) {
        this.currentSong.pause();
      }
      this.currentPlayingTrack = null;

    } else {
      // If another track is playing, pause it first
      if (this.currentPlayingTrack && this.currentSong) {
        this.currentSong.pause();
      }

      // Create new Audio object using the stored URL (Blob or remote)
      this.currentSong = new Audio(track.url());
      this.currentSong.play();
      this.currentPlayingTrack = track;

      // Stop playback after 10 seconds
      setTimeout(() => {
        if (this.currentPlayingTrack === track) {
          this.currentSong.pause();
          this.currentPlayingTrack = null;
        }
      }, 10_000);
    }
  }
}
