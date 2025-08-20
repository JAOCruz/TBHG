// Leaderboard UI Manager for Main Page
import { HighScoresManager } from './game/high-scores.js';

export class LeaderboardUI {
  constructor() {
    this.highScoresManager = new HighScoresManager();
    this.isVisible = false;
    this.container = null;
  }
  
  init() {
    this.createLeaderboardButton();
  }
  
  createLeaderboardButton() {
    // Check if mobile to adjust positioning
    const isMobile = window.innerWidth < 768;
    
    // Create the leaderboard button
    const button = document.createElement('button');
    button.innerHTML = '🏆 Leaderboard';
    button.className = 'leaderboard-btn';
    
    // Position based on screen size to avoid conflict with music button
    const buttonStyles = isMobile ? `
      position: fixed;
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    ` : `
      position: fixed;
      top: 20px;
      right: 90px;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    button.style.cssText = buttonStyles;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
    });
    
    button.addEventListener('click', () => this.toggleLeaderboard());
    
    // Responsive positioning
    const updatePosition = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        button.style.top = '20px';
        button.style.left = '20px';
        button.style.right = 'auto';
      } else {
        button.style.top = '20px';
        button.style.right = '90px';
        button.style.left = 'auto';
      }
    };
    
    window.addEventListener('resize', updatePosition);
    
    document.body.appendChild(button);
    this.button = button;
  }
  
  toggleLeaderboard() {
    if (this.isVisible) {
      this.hideLeaderboard();
    } else {
      this.showLeaderboard();
    }
  }
  
  showLeaderboard() {
    if (this.container) {
      this.hideLeaderboard();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    
    // Create leaderboard container
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border-radius: 15px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white;
      padding: 20px 60px 20px 20px;
      text-align: center;
      position: relative;
    `;
    
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 24px; font-weight: bold;">🏆 Bay Harbor Gooner Leaderboard</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Top Gooners of all time</p>
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      color: white;
      font-size: 30px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'none';
    });
    
    closeBtn.addEventListener('click', () => this.hideLeaderboard());
    
    header.appendChild(closeBtn);
    
    // Scores container
    const scoresContainer = document.createElement('div');
    scoresContainer.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      padding: 0;
    `;
    
    scoresContainer.innerHTML = this.highScoresManager.getLeaderboardHTML();
    
    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 15px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    `;
    
    const totalScores = this.highScoresManager.getHighScores().length;
    footer.innerHTML = `
      <p style="margin: 0;">Showing top ${Math.min(totalScores, 10)} of ${totalScores} scores</p>
      <button id="clear-scores" style="
        margin-top: 10px;
        background: #ef4444;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
      ">Clear All Scores</button>
    `;
    
    // Clear scores functionality
    footer.querySelector('#clear-scores').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all high scores? This cannot be undone.')) {
        this.highScoresManager.clearHighScores();
        scoresContainer.innerHTML = this.highScoresManager.getLeaderboardHTML();
        footer.querySelector('p').textContent = 'Showing top 0 of 0 scores';
      }
    });
    
    container.appendChild(header);
    container.appendChild(scoresContainer);
    container.appendChild(footer);
    overlay.appendChild(container);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideLeaderboard();
      }
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideLeaderboard();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(overlay);
    this.container = overlay;
    this.isVisible = true;
    
    // Add CSS animations
    this.addAnimationStyles();
  }
  
  hideLeaderboard() {
    if (this.container) {
      this.container.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.isVisible = false;
      }, 300);
    }
  }
  
  addAnimationStyles() {
    if (!document.querySelector('#leaderboard-animations')) {
      const style = document.createElement('style');
      style.id = 'leaderboard-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
} 