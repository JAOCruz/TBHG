// Boot Scene - Handles loading assets
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading Bay Harbor Gooner Game...',
      {
        font: '20px Arial',
        fill: '#ffffff'
      }
    );
    loadingText.setOrigin(0.5);
    
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2,
      320,
      50
    );
    
    // Loading progress event
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xdc2626, 1); // Red color
      progressBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 + 10,
        300 * value,
        30
      );
    });
    
    // Loading complete event
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Load Kenny pack assets
    this.loadKennyAssets();
    
    // Load city background image
    this.loadBackgroundAssets();
    
    // Load audio
    this.loadAudioAssets();
  }

  create() {
    // All assets loaded, start the main game
    console.log('✅ All assets loaded successfully');
    this.scene.start('MenuScene');
  }
  
  // Load Kenny pack assets
  loadKennyAssets() {
    const basePath = '/kenny-pack/PNG/';
    
    // Player character options (different cars)
    this.load.image('van', `${basePath}Cars/van.png`);
    this.load.image('sports_convertible', `${basePath}Cars/sports_convertible.png`);
    this.load.image('vintage', `${basePath}Cars/vintage.png`);
    this.load.image('sedan_vintage', `${basePath}Cars/sedan_vintage.png`);
    this.load.image('formula', `${basePath}Cars/formula.png`);
    
    // Keep 'player' as alias for van for backward compatibility
    this.load.image('player', `${basePath}Cars/van.png`);
    
    // Collectible (new floating items system)
    this.load.image('blood', '/images/glass/blood.png');
    this.load.image('water', '/images/glass/water.png');
    this.load.image('yellow', '/images/glass/yellow.png');
    this.load.image('goon', '/images/glass/goon.png');
    this.load.image('poop', '/images/glass/poop.png');
    this.load.image('puke', '/images/glass/puke.png');
    
    // Keep old collectible for backward compatibility
    this.load.image('collectible', '/kenny-pack/PNG/Props/sign_red.png');
    
    // Obstacle (plastic wrap - using barrier)
    this.load.image('obstacle', `${basePath}Props/barrier.png`);
    
    // POLICE CARS (instant arrest)
    this.load.image('police', `${basePath}Cars/police.png`);
    
    // AMBULANCE (gives +1 life, no multiplier reset)
    this.load.image('ambulance', `${basePath}Cars/ambulance.png`);
    
    // TRUCKS (lose 2 lives)
    this.load.image('truck', `${basePath}Cars/truck.png`);
    this.load.image('firetruck', `${basePath}Cars/firetruck.png`);
    
    // SPECIAL VEHICLES
    this.load.image('truckdark', `${basePath}Cars/truckdark.png`); // -1 star
    this.load.image('buggy', `${basePath}Cars/buggy.png`); // -1 star
    
    // NORMAL CARS (lose 1 life)
    this.load.image('bus', `${basePath}Cars/bus.png`);
    this.load.image('taxi', `${basePath}Cars/taxi.png`);
    this.load.image('sports_race', `${basePath}Cars/sports_race.png`);
    this.load.image('trucktank', `${basePath}Cars/trucktank.png`);
    this.load.image('vendor', `${basePath}Cars/vendor.png`);
    this.load.image('sports_yellow', `${basePath}Cars/sports_yellow.png`);
    this.load.image('suv_closed', `${basePath}Cars/suv_closed.png`);
    this.load.image('towtruck', `${basePath}Cars/towtruck.png`);
    this.load.image('vintage', `${basePath}Cars/vintage.png`);
    this.load.image('station', `${basePath}Cars/station.png`);
    this.load.image('rounded_green', `${basePath}Cars/rounded_green.png`);
    this.load.image('riot', `${basePath}Cars/riot.png`);
    
    // SMALL VEHICLES (add star but no life loss)
    this.load.image('scooter', `${basePath}Cars/scooter.png`);
    this.load.image('cycle_low', `${basePath}Cars/cycle_low.png`);
    this.load.image('cycle', `${basePath}Cars/cycle.png`);
    
    // Character sprites
    this.load.image('man_walk', `${basePath}Characters/man_walk1.png`);
    this.load.image('man_point', `${basePath}Characters/man_point.png`);
  }
  
  // Load background assets
  loadBackgroundAssets() {
    // Load the background image directly from images folder (copied from kenny-pack/1.png)
    this.load.image('city_background', '/images/city_background.png');
    
    // Load Doakes jail image for game over screen
    this.load.image('doakes_lost_jail', '/images/doakes_lost_jail.png');
    
    // If the image fails to load, try the original location
    this.load.on('fileerror', (key) => {
      if (key === 'city_background') {
        console.warn('City background image not found in /images, trying alternative location');
        this.load.image('city_background', '/kenny-pack/1.png');
        this.load.start(); // Restart the loader for the new file
      }
    });
  }
  
  // Load audio assets
  loadAudioAssets() {
    console.log('🔊 Loading audio assets...');
    
    // Game sound effects
    this.load.audio('collect', '/audio/chicken.mp3');
    this.load.audio('gameover', '/audio/police.mp3');
    this.load.audio('crash', '/audio/crash.mp3');
    this.load.audio('bump', '/audio/bump.mp3');
    this.load.audio('scream', '/audio/scream.mp3');
    this.load.audio('inside', '/audio/inside.mp3'); // Car ambience
    
    // Character voice lines for car selection
    this.load.audio('dexter_voice', '/audio/characters/dexter_char.mp3');
    this.load.audio('doakes_voice', '/audio/characters/doakes_char.mp3');
    this.load.audio('deb_voice', '/audio/characters/deb_char.mp3');
    this.load.audio('laguerta_voice', '/audio/characters/laguerta_char.mp3');
    this.load.audio('masuka_voice', '/audio/characters/masuka_char.mp3');
    
    // Music tracks - using actual file names
    this.load.audio('theme', '/Double Life Gooner - White Gooner.mp3');
    this.load.audio('black_gooner', '/TBHG - Black Gooner.mp3');
    this.load.audio('future_gooning', '/Future Gooning - Miami Gooning.mp3');
    this.load.audio('we_are_gooners', '/Sticky Wave - We are the Gooners.mp3');
    this.load.audio('full_gooner', '/The Gner - Full Gooner Mode .mp3');
    this.load.audio('soy_gooner', '/Rodrigo The Gooner - Soy un Gooner.mp3');
  }
} 