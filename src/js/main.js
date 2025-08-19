// Main JavaScript file for The Bay Harbor Gooner
let audioPlayer = null;

// Function to initialize the Bay Harbor Gooner audio player
async function initAudioPlayer() {
  try {
    console.log('🎵 Loading Bay Harbor Gooner audio player...');
    const { createFallbackPlayer } = await import('./fallback-player.js');
    
    audioPlayer = createFallbackPlayer();
    console.log('✅ Bay Harbor Gooner player with lyrics loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading audio player:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔪 The Bay Harbor Gooner - The ritual begins...');
  
  // Auto-load the music player when page loads
  console.log('🎵 Auto-loading Bay Harbor Gooner music player with lyrics...');
  await initAudioPlayer();
  
  // Check if mobile
  const isMobile = window.innerWidth < 768;
  
  // Add Bay Harbor Gooner music toggle button (now for closing/opening)
  const addMusicToggle = () => {
    console.log('📍 Adding Bay Harbor Gooner music toggle button...');
    
    const toggleButton = document.createElement('button');
    toggleButton.id = 'music-toggle-button';
    
    // Position differently based on screen size
    if (isMobile) {
      toggleButton.className = 'fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-300';
    } else {
      toggleButton.className = 'fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-300';
    }
    
    // Ensure maximum z-index and explicit positioning
    toggleButton.style.cssText = `
      position: fixed !important;
      ${isMobile ? 'top: 16px !important;' : 'bottom: 16px !important;'}
      right: 16px !important;
      z-index: 99999 !important;
      background-color: #dc2626 !important;
      color: white !important;
      padding: 12px !important;
      border-radius: 50% !important;
      border: none !important;
      cursor: pointer !important;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
      width: 56px !important;
      height: 56px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    // Start with close icon since player is already open
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    toggleButton.title = 'Close Bay Harbor Gooner Music Player';
    
    // Toggle player visibility
    toggleButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🎵 Music toggle button clicked!');
      
      if (!audioPlayer) {
        console.log('🔄 Re-opening Bay Harbor Gooner music player...');
        
        // Show loading state
        toggleButton.disabled = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.innerHTML = '⏳';
        
        try {
          const success = await initAudioPlayer();
          
          // Re-enable button
          toggleButton.disabled = false;
          toggleButton.style.opacity = '1';
          
          if (success) {
            toggleButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            `;
            toggleButton.title = 'Close Bay Harbor Gooner Music Player';
            console.log('✅ Bay Harbor Gooner player with lyrics re-opened');
          } else {
            // Reset button if failed
            toggleButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            `;
            toggleButton.title = 'Open Bay Harbor Gooner Music Player';
          }
        } catch (error) {
          console.error('❌ Error re-opening player:', error);
          // Reset button
          toggleButton.disabled = false;
          toggleButton.style.opacity = '1';
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          `;
          toggleButton.title = 'Open Bay Harbor Gooner Music Player';
        }
      } else {
        console.log('❌ Closing Bay Harbor Gooner music player...');
        try {
          audioPlayer.close();
          audioPlayer = null;
          
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          `;
          toggleButton.title = 'Open Bay Harbor Gooner Music Player';
          console.log('✅ Bay Harbor Gooner player closed');
        } catch (error) {
          console.error('❌ Error closing music player:', error);
        }
      }
    });
    
    // Handle window resize for responsive layout
    window.addEventListener('resize', () => {
      const isMobileNow = window.innerWidth < 768;
      if (isMobileNow) {
        toggleButton.style.top = '16px';
        toggleButton.style.bottom = 'auto';
      } else {
        toggleButton.style.bottom = '16px';
        toggleButton.style.top = 'auto';
      }
    });
    
    // Add to page
    document.body.appendChild(toggleButton);
    console.log('✅ Bay Harbor Gooner music toggle button added');
  };
  
  // Add lyrics toggle button in top-left (only on desktop)
  const addLyricsToggle = () => {
    // On mobile, we don't need a separate lyrics toggle
    if (isMobile) return;
    
    const lyricsButton = document.createElement('button');
    lyricsButton.id = 'lyrics-toggle-main';
    lyricsButton.className = 'fixed top-4 left-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-300';
    lyricsButton.style.cssText = `
      position: fixed !important;
      top: 16px !important;
      left: 16px !important;
      z-index: 99998 !important;
      background-color: #dc2626 !important;
      color: white !important;
      padding: 12px !important;
      border-radius: 50% !important;
      border: none !important;
      cursor: pointer !important;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
      width: 56px !important;
      height: 56px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    lyricsButton.innerHTML = '📝';
    lyricsButton.title = 'Toggle Bay Harbor Gooner Lyrics';
    
    lyricsButton.addEventListener('click', () => {
      if (audioPlayer) {
        // Toggle lyrics through the player
        const lyricsContainer = document.getElementById('bay-harbor-lyrics');
        if (lyricsContainer) {
          if (lyricsContainer.style.display === 'none') {
            audioPlayer.showLyrics();
          } else {
            audioPlayer.hideLyrics();
          }
        }
      } else {
        console.log('⚠️ Music player not loaded yet');
      }
    });
    
    // Hide on mobile
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        lyricsButton.style.display = 'none';
      } else {
        lyricsButton.style.display = 'flex';
      }
    });
    
    document.body.appendChild(lyricsButton);
    console.log('✅ Bay Harbor Gooner lyrics toggle button added');
  };
  
  // Add some dark atmosphere effects
  const addBloodDropEffect = () => {
    const header = document.querySelector('header');
    if (header) {
      console.log('🩸 Adding blood drop effects...');
      setInterval(() => {
        const drop = document.createElement('div');
        drop.className = 'absolute w-1 h-8 bg-red-600 rounded-b-full opacity-70 animate-pulse';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.top = '0';
        drop.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        header.appendChild(drop);
        
        // Remove the drop after animation
        setTimeout(() => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        }, 5000);
      }, 15000); // Every 15 seconds
    } else {
      console.warn('⚠️ Header element not found for blood drops');
    }
  };
  
  // Initialize features
  console.log('🚀 Initializing Bay Harbor Gooner features...');
  addBloodDropEffect();
  addMusicToggle();
  addLyricsToggle();
  
  // Add click tracking for analytics
  document.addEventListener('click', (e) => {
    if (e.target.textContent?.includes('$GOONER') || e.target.textContent?.includes('Buy')) {
      console.log('💰 User interested in buying $GOONER - The hunt begins!');
    }
  });
  
  // Verify everything is working
  setTimeout(() => {
    const button = document.getElementById('music-toggle-button');
    const player = document.getElementById('bay-harbor-player');
    const lyricsButton = document.getElementById('lyrics-toggle-main');
    
    if (button && player) {
      console.log('✅ Bay Harbor Gooner music player with lyrics is auto-loaded and ready!');
      console.log('🎵 New tracks loaded: Double Life Gooner, Black Gooner, Future Gooning, We Are The Gooners');
      console.log('📝 Click any song to view lyrics in the left panel!');
      
      if (isMobile) {
        console.log('📱 Mobile layout active - lyrics will appear below player');
      }
    } else {
      console.error('❌ Something went wrong with auto-loading');
    }
  }, 1000);
}); 