// Enhanced Bay Harbor Gooner Audio Player
import { customPlaylist } from './playlist-config.js';
import { createLyricsPlayer } from './lyrics-player.js';

export function createFallbackPlayer() {
  console.log('🎵 Creating Bay Harbor Gooner audio player...');
  
  // Create lyrics player
  const lyricsPlayer = createLyricsPlayer();
  
  const player = document.createElement('div');
  player.id = 'bay-harbor-player';
  player.className = 'fixed bottom-20 right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-40 w-80 border-2 border-red-600';
  
  player.innerHTML = `
    <div class="bg-red-800 text-white p-3 rounded-t-lg flex justify-between items-center">
      <div>
        <h3 class="font-bold text-sm">🔪 Bay Harbor Gooner Player</h3>
        <p class="text-xs opacity-75">The Dark Passenger's Playlist</p>
      </div>
      <div class="flex space-x-2">
        <button id="lyrics-toggle" class="text-white hover:text-red-300 text-lg" title="Toggle Lyrics">📝</button>
        <button id="close-player" class="text-white hover:text-red-300 text-xl font-bold">&times;</button>
      </div>
    </div>
    
    <div class="p-4">
      <div id="track-info" class="mb-3 text-center">
        <div id="track-title" class="font-bold text-red-400">Select a track...</div>
        <div id="track-artist" class="text-sm text-gray-300">Bay Harbor Gooner</div>
      </div>
      
      <audio id="main-audio" class="w-full mb-3 bg-gray-800 rounded hidden">
        <source src="" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
      
      <div class="mb-3">
        <div id="progress-container" class="w-full bg-gray-700 rounded-full h-2 cursor-pointer">
          <div id="progress-bar" class="bg-red-600 h-2 rounded-full" style="width: 0%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span id="current-time">0:00</span>
          <span id="duration">0:00</span>
        </div>
      </div>
      
      <div class="flex justify-center items-center space-x-4 mb-3">
        <button id="prev-btn" class="bg-red-600 hover:bg-red-700 p-2 rounded-full transition">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9H17a1 1 0 110 2h-5.586l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <button id="play-pause-btn" class="bg-red-600 hover:bg-red-700 p-3 rounded-full transition">
          <svg id="play-icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          <svg id="pause-icon" class="w-6 h-6 hidden" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
        <button id="next-btn" class="bg-red-600 hover:bg-red-700 p-2 rounded-full transition">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div class="flex items-center space-x-2 mb-3">
        <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-1.929 5.657 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-1.636-.491-3.154-1.343-4.243a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        <input id="volume-slider" type="range" min="0" max="100" value="70" class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
      </div>
      
      <div class="border-t border-gray-700 pt-3">
        <h4 class="text-sm font-bold text-red-400 mb-2">🎵 Playlist</h4>
        <div id="playlist" class="max-h-32 overflow-y-auto space-y-1">
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(player);
  
  // Get player elements
  const audio = player.querySelector('#main-audio');
  const playPauseBtn = player.querySelector('#play-pause-btn');
  const prevBtn = player.querySelector('#prev-btn');
  const nextBtn = player.querySelector('#next-btn');
  const progressBar = player.querySelector('#progress-bar');
  const progressContainer = player.querySelector('#progress-container');
  const currentTimeSpan = player.querySelector('#current-time');
  const durationSpan = player.querySelector('#duration');
  const volumeSlider = player.querySelector('#volume-slider');
  const trackTitle = player.querySelector('#track-title');
  const trackArtist = player.querySelector('#track-artist');
  const playlistContainer = player.querySelector('#playlist');
  const closeBtn = player.querySelector('#close-player');
  const lyricsToggleBtn = player.querySelector('#lyrics-toggle');
  const playIcon = player.querySelector('#play-icon');
  const pauseIcon = player.querySelector('#pause-icon');
  
  let currentTrackIndex = 0;
  let isPlaying = false;
  
  // Initialize playlist
  function initPlaylist() {
    playlistContainer.innerHTML = '';
    customPlaylist.forEach((track, index) => {
      const playlistItem = document.createElement('div');
      playlistItem.className = `p-2 rounded cursor-pointer transition ${index === currentTrackIndex ? 'bg-red-600' : 'hover:bg-gray-700'}`;
      playlistItem.innerHTML = `
        <div class="text-sm font-medium">${track.metaData.title}</div>
        <div class="text-xs text-gray-400">${track.metaData.artist}</div>
      `;
      
      playlistItem.addEventListener('click', () => {
        loadTrack(index);
        // Show lyrics when track is selected
        lyricsPlayer.updateLyrics(index, track.metaData.title, track.metaData.artist);
      });
      
      playlistContainer.appendChild(playlistItem);
    });
  }
  
  // Load track
  function loadTrack(index) {
    if (index < 0 || index >= customPlaylist.length) return;
    
    currentTrackIndex = index;
    const track = customPlaylist[index];
    
    // Reset audio state
    audio.pause();
    audio.currentTime = 0;
    
    // Set new source
    audio.src = track.url;
    trackTitle.textContent = track.metaData.title;
    trackArtist.textContent = track.metaData.artist;
    
    // Update playlist highlighting
    const items = playlistContainer.children;
    for (let i = 0; i < items.length; i++) {
      items[i].className = `p-2 rounded cursor-pointer transition ${i === index ? 'bg-red-600' : 'hover:bg-gray-700'}`;
    }
    
    console.log(`🎵 Loaded: ${track.metaData.title} by ${track.metaData.artist}`);
    console.log(`📁 Audio source: ${track.url}`);
    
    // Force reload the audio element
    audio.load();
  }
  
  // Format time
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Event listeners
  playPauseBtn.addEventListener('click', async () => {
    console.log('🎵 Play/Pause button clicked!', { isPlaying, audioSrc: audio.src });
    
    if (isPlaying) {
      audio.pause();
      console.log('⏸️ Pausing audio...');
    } else {
      try {
        console.log('▶️ Attempting to play audio...');
        await audio.play();
        console.log('✅ Audio playing successfully');
      } catch (error) {
        console.error('❌ Error playing audio:', error);
        // Try to reload the track if there's an error
        if (currentTrackIndex >= 0 && currentTrackIndex < customPlaylist.length) {
          console.log('🔄 Reloading track due to play error...');
          loadTrack(currentTrackIndex);
          try {
            await audio.play();
          } catch (retryError) {
            console.error('❌ Retry failed:', retryError);
            alert('Error playing audio. Please check if the MP3 files are in the /public folder.');
          }
        }
      }
    }
  });
  
  prevBtn.addEventListener('click', async () => {
    const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : customPlaylist.length - 1;
    loadTrack(prevIndex);
    if (isPlaying) {
      try {
        await audio.play();
      } catch (error) {
        console.error('❌ Error playing previous track:', error);
      }
    }
  });
  
  nextBtn.addEventListener('click', async () => {
    const nextIndex = currentTrackIndex < customPlaylist.length - 1 ? currentTrackIndex + 1 : 0;
    loadTrack(nextIndex);
    if (isPlaying) {
      try {
        await audio.play();
      } catch (error) {
        console.error('❌ Error playing next track:', error);
      }
    }
  });
  
  // Lyrics toggle
  lyricsToggleBtn.addEventListener('click', () => {
    lyricsPlayer.toggle();
    // If showing lyrics, update with current track
    if (customPlaylist[currentTrackIndex]) {
      const track = customPlaylist[currentTrackIndex];
      lyricsPlayer.updateLyrics(currentTrackIndex, track.metaData.title, track.metaData.artist);
    }
  });
  
  // Progress bar click
  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });
  
  // Volume control
  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
  });
  
  // Audio events
  audio.addEventListener('play', () => {
    isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    console.log('🎵 Audio started playing');
  });
  
  audio.addEventListener('pause', () => {
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    console.log('⏸️ Audio paused');
  });
  
  audio.addEventListener('loadstart', () => {
    console.log('📥 Audio loading started...');
  });
  
  audio.addEventListener('canplay', () => {
    console.log('✅ Audio can start playing');
  });
  
  audio.addEventListener('error', (e) => {
    console.error('❌ Audio error:', e);
    console.error('❌ Audio error details:', {
      error: audio.error,
      src: audio.src,
      networkState: audio.networkState,
      readyState: audio.readyState
    });
  });
  
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = percent + '%';
      currentTimeSpan.textContent = formatTime(audio.currentTime);
      durationSpan.textContent = formatTime(audio.duration);
    }
  });
  
  audio.addEventListener('ended', () => {
    const nextIndex = currentTrackIndex < customPlaylist.length - 1 ? currentTrackIndex + 1 : 0;
    loadTrack(nextIndex);
    audio.play().catch(error => {
      console.error('❌ Error auto-playing next track:', error);
    });
  });
  
  // Close button
  closeBtn.addEventListener('click', () => {
    player.remove();
    lyricsPlayer.hide(); // Also hide lyrics when player closes
    console.log('🎵 Bay Harbor Gooner player closed');
  });
  
  // Initialize
  audio.volume = 0.7;
  initPlaylist();
  loadTrack(0); // Load first track by default
  
  console.log('✅ Bay Harbor Gooner player with lyrics ready!');
  
  return {
    close: () => {
      player.remove();
      lyricsPlayer.hide();
    },
    play: () => audio.play(),
    pause: () => audio.pause(),
    showLyrics: () => lyricsPlayer.show(),
    hideLyrics: () => lyricsPlayer.hide()
  };
} 