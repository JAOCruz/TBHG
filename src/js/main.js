// Main JavaScript file for The Bay Harbor Gooner
console.log('🔪 MAIN.JS: The Bay Harbor Gooner - Starting...');

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

// Function to launch the game
async function launchGame() {
  try {
    console.log('🎮 Launching Bay Harbor Gooner Game...');
    const { BayHarborGame } = await import('./game/game.js');
    
    // Create game instance if it doesn't exist
    if (!window.gameInstance) {
      window.gameInstance = new BayHarborGame();
    }
    
    // Check if game is already running
    if (window.gameInstance.container) {
      console.log('🎮 Game already running');
      return;
    }
    
    // Initialize the game
    window.gameInstance.init(document.body, () => {
      console.log('🎮 Game closed');
    });
    
    console.log('🎮 Game launched successfully');
  } catch (error) {
    console.error('❌ Error launching game:', error);
    alert('Error launching game. Check console for details.');
  }
}

// Function to show leaderboard
async function showLeaderboard() {
  try {
    console.log('🏆 Opening leaderboard...');
    const { LeaderboardUI } = await import('./leaderboard.js');
    
    if (!window.leaderboardUI) {
      window.leaderboardUI = new LeaderboardUI();
    }
    
    window.leaderboardUI.showLeaderboard();
  } catch (error) {
    console.error('❌ Error opening leaderboard:', error);
    alert('Error opening leaderboard. Check console for details.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔪 MAIN.JS: DOM Content Loaded');
  
  // Auto-load the music player when page loads
  console.log('🎵 Auto-loading Bay Harbor Gooner music player with lyrics...');
  await initAudioPlayer();
  
  // Create buttons after a short delay
  setTimeout(() => {
    console.log('🎮 Creating functional buttons...');
    
    // Create PLAY button that actually launches the game
    const playButton = document.createElement('button');
    playButton.innerHTML = '🎮 PLAY GAME';
    playButton.id = 'play-game-button';
    playButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
    `;
    
    playButton.addEventListener('mouseenter', () => {
      playButton.style.transform = 'translateY(-2px)';
      playButton.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
    });
    
    playButton.addEventListener('mouseleave', () => {
      playButton.style.transform = 'translateY(0)';
      playButton.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
    });
    
    playButton.addEventListener('click', () => {
      launchGame();
    });
    
    document.body.appendChild(playButton);
    console.log('✅ Functional play button added');
    
    // Create music toggle button
    const musicButton = document.createElement('button');
    musicButton.innerHTML = '🎵';
    musicButton.id = 'music-toggle-button';
    musicButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 99999;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
    `;
    
    musicButton.addEventListener('mouseenter', () => {
      musicButton.style.transform = 'translateY(-2px)';
      musicButton.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
    });
    
    musicButton.addEventListener('mouseleave', () => {
      musicButton.style.transform = 'translateY(0)';
      musicButton.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
    });
    
    musicButton.addEventListener('click', async () => {
      if (!audioPlayer) {
        console.log('🔄 Re-opening Bay Harbor Gooner music player...');
        musicButton.innerHTML = '⏳';
        const success = await initAudioPlayer();
        musicButton.innerHTML = success ? '🎵' : '❌';
      } else {
        console.log('❌ Closing Bay Harbor Gooner music player...');
        try {
          audioPlayer.close();
          audioPlayer = null;
          musicButton.innerHTML = '🎵';
        } catch (error) {
          console.error('❌ Error closing music player:', error);
        }
      }
    });
    
    document.body.appendChild(musicButton);
    console.log('✅ Functional music button added');
    
    // Create leaderboard button
    const leaderboardButton = document.createElement('button');
    leaderboardButton.innerHTML = '🏆 SCORES';
    leaderboardButton.id = 'leaderboard-button';
    leaderboardButton.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #dc2626;
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
    `;
    
    leaderboardButton.addEventListener('mouseenter', () => {
      leaderboardButton.style.transform = 'translateY(-2px)';
      leaderboardButton.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
    });
    
    leaderboardButton.addEventListener('mouseleave', () => {
      leaderboardButton.style.transform = 'translateY(0)';
      leaderboardButton.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
    });
    
    leaderboardButton.addEventListener('click', () => {
      showLeaderboard();
    });
    
    document.body.appendChild(leaderboardButton);
    console.log('✅ Functional leaderboard button added');
    
    // Add responsive behavior
    const updateButtonPositions = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // On mobile, move music button to top-right corner
        musicButton.style.bottom = 'auto';
        musicButton.style.top = '80px';
        musicButton.style.right = '20px';
        
        // Move leaderboard to top-left
        leaderboardButton.style.top = '20px';
        leaderboardButton.style.left = '20px';
      } else {
        // On desktop, keep music at bottom-right
        musicButton.style.top = 'auto';
        musicButton.style.bottom = '20px';
        musicButton.style.right = '20px';
        
        // Keep leaderboard at top-left
        leaderboardButton.style.top = '20px';
        leaderboardButton.style.left = '20px';
      }
    };
    
    window.addEventListener('resize', updateButtonPositions);
    updateButtonPositions(); // Call once to set initial positions
    
  }, 1000);
});

console.log('🔪 MAIN.JS: Script loaded completely'); 