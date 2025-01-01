import { DomSanitizer } from "@angular/platform-browser";

export class MusicData {
    trackName: string;
    trackArtist: string;
    trackUrl: string;           // This is a string now
    coverArt: string | null;    // Also a string
  
    constructor(name: string, artist: string, url: string, art: string | null = null) {
      this.trackName = name;
      this.trackArtist = artist;
      this.trackUrl = url;
      this.coverArt = art;
    }
   
    name():string
    {
        return this.trackName;
    }
    artist():string
    {
        return this.trackArtist;
    }
    url():string
    {
        return this.trackUrl;
    }
    art():string | null
    {
        
        return this.coverArt;
    }
    
}