// src/app/home-page/home-page.component.ts

import { Component, OnInit } from '@angular/core';
import { PredictionEvent } from '../prediction-event';
import { MusicPlayer } from '../services/music-player';
import { MusicData } from '../data/music-data';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; // Adjust path as needed

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  gesture: string = '';
  isQueueVisible: boolean = false;
  
  // Holds the raw File objects before we convert them
  currentFile: File | null = null;
  currentImg: File | null = null;

  // Optional: For displaying messages to the user
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    public MusicPlayer: MusicPlayer,
    private router: Router,
    private http: HttpClient // Inject HttpClient
  ) {}

  ngOnInit(): void {
    // If there's something in the queue, load the first track
    if (this.MusicPlayer.getQueue().length > 0) {
      this.updateAudioPlayer(this.MusicPlayer.getQueue()[0]);
    }
  }

  //-------------------------
  //  QUEUE OPERATIONS
  //-------------------------
  addToQueue(track: MusicData) {
    this.MusicPlayer.addToQueue(track);
  }

  clearQueue() {
    this.MusicPlayer.clearQueue();
    // Optionally hide the queue dropdown
    // this.isQueueVisible = false;
  }

  toggleQueue() {
    this.isQueueVisible = !this.isQueueVisible;
  }

  //-------------------------
  //  TRACK ADDITION
  //-------------------------
  addTrackToLibrary() {
    // Make sure we have an audio file
    if (!this.currentFile) {
      console.error('No audio file selected!');
      this.errorMessage = 'Please upload an audio file.';
      return;
    }

    // Get user-entered data
    const trackNameInput = document.getElementById('trackName') as HTMLInputElement;
    const artistNameInput = document.getElementById('artistName') as HTMLInputElement;
    if (!trackNameInput || !artistNameInput) {
      console.error('Track name or artist name input not found');
      this.errorMessage = 'Track name or artist name input not found.';
      return;
    }

    const trackName = trackNameInput.value.trim();
    const artistName = artistNameInput.value.trim();
    if (!trackName || !artistName) {
      console.error('Track name or artist name is empty');
      this.errorMessage = 'Track name and artist name are required.';
      return;
    }

    // Prepare FormData
    const formData: FormData = new FormData();
    formData.append('trackName', trackName);
    formData.append('artistName', artistName);
    formData.append('audio', this.currentFile);

    if (this.currentImg) {
      formData.append('coverArt', this.currentImg);
    }

    // Get JWT token from AuthService or localStorage
    const token = this.MusicPlayer.getToken(); // Implement getToken in MusicPlayer or AuthService
    if (!token) {
      console.error('User is not authenticated.');
      this.errorMessage = 'You must be logged in to add tracks.';
      return;
    }

    const headers = new HttpHeaders({
      // 'Content-Type': 'multipart/form-data' // Do NOT set Content-Type; let the browser set it
      Authorization: `Bearer ${token}`
    });

    // Make HTTP POST request to add track
    this.http.post(`http://localhost:3000/api/user/tracks`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Track added successfully:', response);
          this.successMessage = 'Track added successfully!';
          this.errorMessage = '';

          // Optionally, update the local library by fetching it again
          this.fetchLibrary();

          // Reset file inputs & placeholders
          (document.getElementById('audioInput') as HTMLInputElement).value = '';
          (document.getElementById('img') as HTMLInputElement).value = '';
          (document.getElementById('file-upload-placeholder') as HTMLSpanElement).innerText = 'Upload Audio File';
          (document.getElementById('img-upload-placeholder') as HTMLSpanElement).innerText = 'Upload Cover Art';
          trackNameInput.value = '';
          artistNameInput.value = '';

          this.currentFile = null;
          this.currentImg = null;

          // If queue is empty, start playing this track immediately
          if (this.MusicPlayer.getQueue().length === 0) {
            const newTrack = new MusicData(
              trackName,
              artistName,
              response.library[response.library.length - 1].audioUrl,
              response.library[response.library.length - 1].coverArtUrl
            );
            this.updateAudioPlayer(newTrack);
            this.addToQueue(newTrack);
          }
        },
        error: (err: any) => {
          console.error('Error adding track:', err);
          this.errorMessage = err.error.message || 'An error occurred while adding the track.';
          this.successMessage = '';
        }
      });
  }

  fetchLibrary() {
    const token = this.MusicPlayer.getToken();
    if (!token) {
      console.error('User is not authenticated.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get(`http://localhost:3000/api/user/tracks`)
      .subscribe({
        next: (response: any) => {
          console.log('Library fetched successfully:', response);
          this.MusicPlayer.setLibrary(response.library);
        },
        error: (err: any) => {
          console.error('Error fetching library:', err);
        }
      });
  }

  //-------------------------
  //  PLAYBACK CONTROL
  //-------------------------
  updateAudioPlayer(track: MusicData) {
    const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
    const trackInfo = document.getElementById('trackInfo');
    const cover = document.getElementById('coverArt') as HTMLImageElement;

    if (!audioPlayer) {
      console.error('Audio player element not found');
      return;
    }

    // Set the src to the audio URL from the backend
    audioPlayer.src = track.url();

    // Update text info
    if (trackInfo) {
      trackInfo.textContent = `${track.trackArtist} - ${track.trackName}`;
    }

    // Cover art
    if (cover) {
      // If there's a cover art URL, use it; otherwise default
      cover.src = track.coverArt ?? '../assets/images/cover.png';
    }

    // Autoplay logic if desired
    // audioPlayer.play();

    // When song ends, proceed to next
    audioPlayer.onended = () => {
      this.playNextSong();
    };
  }

  playNextSong() {
    if (this.MusicPlayer.getQueue().length > 1) {
      // Move current track to history
      this.MusicPlayer.addToHistory(this.MusicPlayer.getQueue()[0]);
      // Remove it from the queue
      this.MusicPlayer.queueShift();
      
      // Update with next track
      const nextTrack = this.MusicPlayer.getQueue()[0];
      if (nextTrack) {
        this.updateAudioPlayer(nextTrack);
      } else {
        // No next track, stop
        const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
        audioPlayer.pause();
        audioPlayer.src = '';
        const trackInfo = document.getElementById('trackInfo');
        if (trackInfo) {
          trackInfo.textContent = 'Not Playing';
        }
        (document.getElementById('coverArt') as HTMLImageElement).src = '../assets/images/cover.png';
      }
    } else {
      // No more songs in queue
      const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
      audioPlayer.pause();
      audioPlayer.src = '';
      const trackInfo = document.getElementById('trackInfo');
      if (trackInfo) {
        trackInfo.textContent = 'Not Playing';
      }
      (document.getElementById('coverArt') as HTMLImageElement).src = '../assets/images/cover.png';
    }
  }

  skipBack() {
    // Example logic: if the current track is more than 3s in, 
    // just restart it; otherwise pop from history
    const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;

    if (audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
    } else {
      const lastSong = this.MusicPlayer.getLastSong();
      if (lastSong) {
        // Add the current song to history
        this.MusicPlayer.addToHistory(this.MusicPlayer.getQueue()[0]);
        // Update the player to play the lastSong
        this.updateAudioPlayer(lastSong);
        // Put that lastSong at the front of the queue
        this.MusicPlayer.queueFront(lastSong);
      } else {
        // No history
        audioPlayer.currentTime = 0;
        audioPlayer.pause();
      }
    }
  }

  //-------------------------
  //  GESTURE CONTROL
  //-------------------------
  prediction(event: PredictionEvent) {
    this.gesture = event.getPrediction();
    const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
    console.log('Gesture:', this.gesture);

    switch (this.gesture) {
      case 'Closed Hand':
        audioPlayer?.pause();
        break;
      case 'Open Hand':
        if (audioPlayer && audioPlayer.paused) {
          audioPlayer.play();
        }
        break;
      case 'Hand Pinching':
        this.adjustVolume(-0.25);
        break;
      case 'Two Hands Open':
        this.adjustVolume(0.25);
        break;
      case 'Two Hands Pointing':
        this.toggleQueue();
        break;
      case 'Two Closed Hands':
        this.router.navigate(['/library']); // Ensure absolute path
        break;
      case 'Swiping Right':
        this.playNextSong();
        break;
      case 'Swiping Left':
        this.skipBack();
        break;
    }
  }

  adjustVolume(change: number) {
    const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement;
    if (audioPlayer) {
      let newVolume = audioPlayer.volume + change;
      newVolume = Math.max(0, Math.min(1, newVolume));
      audioPlayer.volume = newVolume;
    }
  }

  //-------------------------
  //  INPUT HANDLERS
  //-------------------------
  updateFileLabel() {
    const fileInput = document.getElementById('audioInput') as HTMLInputElement;
    const fileLabel = document.getElementById('file-upload-placeholder') as HTMLSpanElement;

    if (fileInput.files && fileInput.files.length > 0) {
      fileLabel.innerText = fileInput.files[0].name;
      this.currentFile = fileInput.files[0];
    } else {
      fileLabel.innerText = 'Upload Audio File';
      this.currentFile = null;
    }
  }

  updateImgLabel() {
    const fileInput = document.getElementById('img') as HTMLInputElement;
    const fileLabel = document.getElementById('img-upload-placeholder') as HTMLSpanElement;

    if (fileInput.files && fileInput.files.length > 0) {
      fileLabel.innerText = fileInput.files[0].name;
      this.currentImg = fileInput.files[0];
    } else {
      fileLabel.innerText = 'Upload Cover Art';
      this.currentImg = null;
    }
  }

  //-------------------------
  //  LIBRARY & SHUFFLE
  //-------------------------
  showLibrary() {
    const libraryList = document.getElementById('libraryList');
    if (libraryList) {
      libraryList.innerHTML = '';
      this.MusicPlayer.getLibrary().forEach(track => {
        const listItem = document.createElement('li');
        listItem.textContent = `${track.trackArtist} - ${track.trackName}`;
        libraryList.appendChild(listItem);
      });
    }
  }

  shuffleLibrary() {
    // Basic shuffle
    const library = [...this.MusicPlayer.getLibrary()];
    let currentIndex = library.length;
    let randomIndex;

    // Clear the queue first
    this.MusicPlayer.clearQueue(true);

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [library[currentIndex], library[randomIndex]] = [library[randomIndex], library[currentIndex]];
      this.MusicPlayer.addToQueue(library[currentIndex]);
    }

    // Play the first track in the shuffled queue
    this.updateAudioPlayer(library[0]);
  }
}
