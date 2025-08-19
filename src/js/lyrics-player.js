// Bay Harbor Gooner Lyrics Player
import { getLyricsForTrack } from './playlist-config.js';

export function createLyricsPlayer() {
  console.log('📝 Creating Bay Harbor Gooner lyrics display...');
  
  // Create responsive lyrics container
  const lyricsContainer = document.createElement('div');
  lyricsContainer.id = 'bay-harbor-lyrics';
  
  // Responsive positioning - desktop vs mobile
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    // Mobile: Full width below player
    lyricsContainer.className = 'fixed bottom-4 left-0 right-0 mx-4 bg-gray-900 text-white rounded-lg shadow-2xl z-30 border-2 border-red-600 max-h-[40vh]';
  } else {
    // Desktop: Left side position
    lyricsContainer.className = 'fixed bottom-20 left-4 bg-gray-900 text-white rounded-lg shadow-2xl z-30 w-80 border-2 border-red-600';
    // Set explicit max height for desktop
    lyricsContainer.style.maxHeight = 'calc(70vh - 40px)';
  }
  
  lyricsContainer.style.display = 'none'; // Hidden by default
  
  lyricsContainer.innerHTML = `
    <div class="bg-red-800 text-white p-3 rounded-t-lg flex justify-between items-center">
      <div>
        <h3 class="font-bold text-sm">📝 Bay Harbor Lyrics</h3>
        <p class="text-xs opacity-75" id="lyrics-track-info">Select a track to view lyrics</p>
      </div>
      <button id="close-lyrics" class="text-white hover:text-red-300 text-xl font-bold">&times;</button>
    </div>
    
    <div class="lyrics-content-wrapper overflow-y-auto" style="max-height: ${isMobile ? '30vh' : 'calc(70vh - 90px)'}; padding-bottom: 20px;">
      <div id="lyrics-content" class="p-4 pb-8 text-sm leading-relaxed text-gray-300 whitespace-pre-line">
        🎵 Select a track from the player to view lyrics...
        
        Bay Harbor Gooner tracks feature original lyrics inspired by the Dexter series with a unique twist!
        
        Click on any song in the player to see its full lyrics here.
      </div>
    </div>
  `;
  
  document.body.appendChild(lyricsContainer);
  
  // Add custom CSS for better scrolling and to fix overflow
  const style = document.createElement('style');
  style.textContent = `
    #bay-harbor-lyrics .lyrics-content-wrapper {
      scrollbar-width: thin;
      scrollbar-color: #dc2626 #1f2937;
    }
    #bay-harbor-lyrics .lyrics-content-wrapper::-webkit-scrollbar {
      width: 8px;
    }
    #bay-harbor-lyrics .lyrics-content-wrapper::-webkit-scrollbar-track {
      background: #1f2937;
      border-radius: 4px;
    }
    #bay-harbor-lyrics .lyrics-content-wrapper::-webkit-scrollbar-thumb {
      background-color: #dc2626;
      border-radius: 4px;
    }
    
    /* Fix overflow issues */
    #bay-harbor-lyrics {
      display: flex;
      flex-direction: column;
    }
    
    #bay-harbor-lyrics .lyrics-content-wrapper {
      flex: 1;
      overflow-y: auto;
    }
    
    #bay-harbor-lyrics #lyrics-content {
      padding-right: 16px;
      padding-bottom: 32px;
    }
    
    /* Ensure last line is visible */
    #bay-harbor-lyrics #lyrics-content::after {
      content: '';
      display: block;
      height: 20px;
    }
  `;
  document.head.appendChild(style);
  
  // Handle window resize for responsive layout
  window.addEventListener('resize', () => {
    const isMobileNow = window.innerWidth < 768;
    
    if (isMobileNow) {
      // Mobile layout
      lyricsContainer.className = 'fixed bottom-4 left-0 right-0 mx-4 bg-gray-900 text-white rounded-lg shadow-2xl z-30 border-2 border-red-600 max-h-[40vh]';
      lyricsContainer.querySelector('.lyrics-content-wrapper').style.maxHeight = '30vh';
    } else {
      // Desktop layout
      lyricsContainer.className = 'fixed bottom-20 left-4 bg-gray-900 text-white rounded-lg shadow-2xl z-30 w-80 border-2 border-red-600';
      lyricsContainer.style.maxHeight = 'calc(70vh - 40px)';
      lyricsContainer.querySelector('.lyrics-content-wrapper').style.maxHeight = 'calc(70vh - 90px)';
    }
  });
  
  // Close button functionality
  const closeBtn = lyricsContainer.querySelector('#close-lyrics');
  closeBtn.addEventListener('click', () => {
    lyricsContainer.style.display = 'none';
    console.log('📝 Lyrics player closed');
  });
  
  return {
    show: () => {
      lyricsContainer.style.display = 'flex'; // Use flex instead of block
      console.log('📝 Lyrics player shown');
    },
    hide: () => {
      lyricsContainer.style.display = 'none';
      console.log('📝 Lyrics player hidden');
    },
    updateLyrics: (trackIndex, trackTitle, trackArtist) => {
      const lyrics = getLyricsForTrack(trackIndex);
      const lyricsContent = lyricsContainer.querySelector('#lyrics-content');
      const trackInfo = lyricsContainer.querySelector('#lyrics-track-info');
      
      // Update track info
      trackInfo.textContent = `${trackTitle} - ${trackArtist}`;
      
      // Update lyrics content
      lyricsContent.textContent = lyrics;
      
      // Show the lyrics container
      lyricsContainer.style.display = 'flex'; // Use flex instead of block
      
      // Scroll to top of lyrics
      lyricsContainer.querySelector('.lyrics-content-wrapper').scrollTop = 0;
      
      console.log(`📝 Updated lyrics for: ${trackTitle}`);
    },
    toggle: () => {
      if (lyricsContainer.style.display === 'none') {
        lyricsContainer.style.display = 'flex'; // Use flex instead of block
      } else {
        lyricsContainer.style.display = 'none';
      }
    },
    // Method to reposition based on player position (for mobile layout)
    positionBelowPlayer: (playerHeight) => {
      if (window.innerWidth < 768) {
        const playerBottom = playerHeight + 20; // 20px gap
        lyricsContainer.style.bottom = `${playerBottom}px`;
      }
    }
  };
} 