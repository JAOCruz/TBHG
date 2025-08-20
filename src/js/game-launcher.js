// Bay Harbor Gooner Game Launcher
import { BayHarborGame } from './game/game.js';

// Create a single game instance
let gameInstance = null;

// Initialize the game launcher
export function initGameLauncher() {
  console.log('🎮 Initializing Bay Harbor Gooner Game Launcher...');
  
  // Create game instance
  gameInstance = new BayHarborGame();
  
  // Find all game launcher links
  const gameLinks = document.querySelectorAll('[data-game="bay-harbor-gooner"]');
  
  if (gameLinks.length > 0) {
    console.log(`🎮 Found ${gameLinks.length} game launcher links`);
    
    // Add click event to each link
    gameLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        launchGame();
      });
      
      // Add game icon to link
      const gameIcon = document.createElement('span');
      gameIcon.innerHTML = ' 🎮';
      gameIcon.className = 'ml-1 text-red-500';
      link.appendChild(gameIcon);
      
      console.log('🎮 Game launcher link ready');
    });
  } else {
    console.log('❌ No game launcher links found. Add data-game="bay-harbor-gooner" to links');
    
    // Add a fallback game button
    addFallbackGameButton();
  }
}

// Launch the game
function launchGame() {
  console.log('🎮 Launching Bay Harbor Gooner Game...');
  
  // Check if game is already active by checking if container exists
  if (gameInstance && gameInstance.container) {
    console.log('⚠️ Game is already running');
    return;
  }
  
  // Initialize the game
  if (gameInstance) {
    gameInstance.init(document.body, () => {
      console.log('🎮 Game closed');
    });
  }
  
  console.log('🎮 Game launched successfully');
}

// Add a fallback game button if no links are found
function addFallbackGameButton() {
  const gameButton = document.createElement('button');
  gameButton.id = 'game-launcher-button';
  gameButton.className = 'fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg z-40 flex items-center';
  gameButton.innerHTML = `
    <span class="mr-1">Play</span>
    <span class="text-lg">🎮</span>
  `;
  gameButton.title = 'Play Bay Harbor Gooner Game';
  
  gameButton.addEventListener('click', (e) => {
    e.preventDefault();
    launchGame();
  });
  
  document.body.appendChild(gameButton);
  console.log('🎮 Added fallback game button');
}

// Export the game launcher functions
export default {
  init: initGameLauncher,
  launch: launchGame
}; 