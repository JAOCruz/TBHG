import Webamp from 'webamp';
import { customPlaylist, playerConfig } from './playlist-config.js';

// Initialize Webamp with Bay Harbor Gooner theme
export function initializeWebamp() {
  console.log('🎵 Creating Webamp instance...');
  
  const webamp = new Webamp({
    initialTracks: customPlaylist,
    
    // Disable any features that might cause new page navigation
    enableHotkeys: false, // Disable hotkeys that might interfere
    zIndex: 10000,
    
    // Simple window layout - position in bottom right
    windowLayout: {
      main: { 
        position: { 
          x: Math.max(0, window.innerWidth - 275), 
          y: Math.max(0, window.innerHeight - 200) 
        } 
      }
    },
  });

  console.log('🔄 Rendering Webamp to current page...');
  
  // Render Webamp to the CURRENT page body only
  return webamp.renderWhenReady(document.body).then(() => {
    console.log('✅ Webamp rendered successfully on current page!');
    
    // Force positioning as overlay
    const webampElement = document.getElementById('webamp');
    if (webampElement) {
      webampElement.style.cssText = `
        position: fixed !important;
        z-index: 10000 !important;
        bottom: 60px !important;
        right: 20px !important;
      `;
      console.log('🎯 Webamp positioned as fixed overlay');
    }
    
    // Add custom styling
    addCustomStyling();
    
    // Auto-minimize on mobile
    if (window.innerWidth < 768) {
      webamp.store.dispatch({ type: 'MINIMIZE_WINAMP' });
    }
    
    return webamp;
  }).catch((error) => {
    console.error('❌ Error rendering Webamp:', error);
    throw error;
  });
}

// Add custom CSS styling to make Webamp fit the Bay Harbor Gooner theme
function addCustomStyling() {
  // Remove any existing styles first
  const existingStyle = document.getElementById('webamp-custom-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'webamp-custom-styles';
  style.textContent = `
    /* Bay Harbor Gooner Webamp Styling */
    #webamp {
      position: fixed !important;
      z-index: 10000 !important;
      bottom: 60px !important;
      right: 20px !important;
      filter: hue-rotate(0deg) saturate(1.2) brightness(0.9);
    }
    
    /* Make the player slightly red-tinted */
    #webamp .window {
      filter: sepia(0.1) hue-rotate(-10deg) saturate(1.1);
      background-color: #1a1a1a !important;
    }
    
    /* Dark background for Webamp */
    #webamp .window .title-bar {
      background-color: #2d1b1b !important;
    }
    
    /* Custom scrollbar for playlist */
    #webamp .playlist-scrollbar {
      background-color: #1f1f1f;
    }
    
    #webamp .playlist-scrollbar-handle {
      background-color: #dc2626;
    }
    
    /* Glow effect for active elements */
    #webamp .selected {
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
    }
    
    /* Prevent any white backgrounds */
    #webamp * {
      background-color: transparent;
    }
    
    #webamp .window {
      background-color: #1a1a1a !important;
    }
    
    /* Hide Webamp on very small screens */
    @media (max-width: 480px) {
      #webamp {
        transform: scale(0.8);
        transform-origin: bottom right;
        bottom: 70px !important;
        right: 10px !important;
      }
    }
  `;
  document.head.appendChild(style);
  console.log('🎨 Custom Webamp styles applied');
}

// Custom event listeners for Bay Harbor Gooner theme
export function setupWebampEvents(webamp) {
  console.log('🔧 Setting up Webamp event listeners...');
  
  // Listen for track changes
  webamp.onTrackDidChange((track) => {
    if (track && track.metaData) {
      console.log(`🎵 Now playing: ${track.metaData.artist} - ${track.metaData.title}`);
      
      // Update page title with current track
      document.title = `🔪 ${track.metaData.title} - The Bay Harbor Gooner`;
    }
  });

  // Listen for play/pause events
  webamp.onWillPlay(() => {
    console.log('🎵 The ritual begins...');
  });

  webamp.onWillPause(() => {
    console.log('⏸️ The dark passenger rests...');
  });
  
  // Listen for close event
  webamp.onClose(() => {
    console.log('❌ Webamp closed - The hunt is over... for now.');
    // Reset page title
    document.title = 'The Bay Harbor Gooner | Meme Coin';
    
    // Clean up styles
    const customStyles = document.getElementById('webamp-custom-styles');
    if (customStyles) {
      customStyles.remove();
    }
  });
}

// Function to add custom tracks (for user's streaming URLs)
export function addCustomTracks(webamp, tracks) {
  if (Array.isArray(tracks)) {
    tracks.forEach(track => {
      if (track.url && track.metaData) {
        webamp.appendTracks([track]);
      }
    });
    console.log(`Added ${tracks.length} custom tracks to playlist`);
  }
}

// Example of how to add streaming URLs dynamically
export const exampleStreamingTracks = [
  {
    metaData: {
      artist: "Your Artist",
      title: "Your Song Title",
      album: "Your Album",
    },
    url: "https://your-streaming-url.com/song.mp3",
    duration: 180,
  }
  // Add more tracks here...
];

// Utility function to load tracks from a JSON file
export async function loadTracksFromJSON(jsonUrl) {
  try {
    const response = await fetch(jsonUrl);
    const tracks = await response.json();
    return tracks;
  } catch (error) {
    console.error('Error loading tracks from JSON:', error);
    return [];
  }
} 