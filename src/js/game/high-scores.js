// High Scores Manager for Bay Harbor Gooner Game
export class HighScoresManager {
  constructor() {
    this.storageKey = 'bay-harbor-gooner-scores';
    this.maxScores = 10;
    
    // Random Bay Harbor Gooner names
    this.randomNames = [
      'Dark Passenger Dan', 'Miami Gooner Mike', 'Blood Slide Billy', 'Dexter Devotee', 
      'Bay Harbor Beast', 'Plastic Wrap Pete', 'Kill Room Kevin', 'Forensic Frank',
      'Slide Collector Sam', 'Harbor Hunter', 'Miami Midnight', 'Code Keeper Carl',
      'Butcher Bob', 'Gooner Guardian', 'Ritual Randy', 'Shadow Stalker Steve',
      'Crimson Chris', 'Vigilante Victor', 'Night Prowler Nick', 'Silent Slayer',
      'Trinity Tracker', 'Ice Truck Ian', 'Skinner Stan', 'Barrel Bob',
      'Doomsday Dave', 'Brain Surgeon Ben', 'Saxon Sam', 'Oliver Owen'
    ];
  }
  
  // Get all high scores from localStorage
  getHighScores() {
    try {
      const scores = localStorage.getItem(this.storageKey);
      return scores ? JSON.parse(scores) : [];
    } catch (error) {
      console.error('Error loading high scores:', error);
      return [];
    }
  }
  
  // Add a new score
  addScore(score, playerName = null, carInfo = null) {
    const scores = this.getHighScores();
    const name = playerName || this.getRandomName();
    
    const newScore = {
      name: name,
      score: score,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      carSprite: carInfo?.sprite || 'van', // Store the car sprite name
      carName: carInfo?.name || 'Van' // Store the car display name
    };
    
    scores.push(newScore);
    
    // Sort by score (highest first) and keep only top scores
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, this.maxScores);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(topScores));
      return {
        isHighScore: scores.indexOf(newScore) < this.maxScores,
        rank: scores.indexOf(newScore) + 1,
        scores: topScores
      };
    } catch (error) {
      console.error('Error saving high score:', error);
      return { isHighScore: false, rank: -1, scores: topScores };
    }
  }
  
  // Get a random Bay Harbor Gooner name
  getRandomName() {
    return this.randomNames[Math.floor(Math.random() * this.randomNames.length)];
  }
  
  // Check if a score qualifies as a high score
  isHighScore(score) {
    const scores = this.getHighScores();
    if (scores.length < this.maxScores) return true;
    return score > scores[scores.length - 1].score;
  }
  
  // Clear all high scores (for testing)
  clearHighScores() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing high scores:', error);
      return false;
    }
  }
  
  // Format score for display
  formatScore(score) {
    return score.toLocaleString();
  }
  
  // Get formatted leaderboard HTML
  getLeaderboardHTML() {
    const scores = this.getHighScores();
    
    if (scores.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500">
          <p class="text-xl mb-2">🏆 No scores yet!</p>
          <p>Be the first to make the leaderboard!</p>
        </div>
      `;
    }
    
    return scores.map((score, index) => {
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      
      // Create car image element
      const carImage = score.carSprite ? 
        `<img src="/kenny-pack/PNG/Cars/${score.carSprite}.png" alt="${score.carName}" class="w-8 h-8 object-contain" style="image-rendering: pixelated;">` : 
        `<div class="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs">🚗</div>`;
      
      return `
        <div class="flex justify-between items-center py-3 px-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <span class="text-lg font-bold text-red-600 w-8">${rankEmoji}</span>
            <div class="flex items-center space-x-2">
              ${carImage}
              <div>
                <p class="font-semibold text-gray-800">${score.name}</p>
                <p class="text-sm text-gray-500">${score.date} • ${score.carName}</p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold text-red-600">${this.formatScore(score.score)}</p>
            <p class="text-xs text-gray-500">points</p>
          </div>
        </div>
      `;
    }).join('');
  }
} 