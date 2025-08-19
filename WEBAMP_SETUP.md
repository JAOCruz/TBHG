# Bay Harbor Gooner Webamp Player Setup

This document explains how to set up and customize the Webamp player for The Bay Harbor Gooner website.

## What is Webamp?

[Webamp](https://github.com/captbaritone/webamp) is a reimplementation of Winamp in HTML5 and JavaScript with full skin support. It's a nostalgic music player that runs in your browser.

## Features

- 🎵 Full Winamp 2 functionality
- 🎨 Custom Bay Harbor Gooner theming
- 📱 Mobile responsive design
- 🔔 Desktop notifications for track changes
- 🎛️ Equalizer and visualizer support
- 📝 Custom playlist support
- 🌐 Streaming URL support

## How to Use

1. **Toggle Player**: Click the music note button in the bottom-right corner
2. **Add Songs**: Edit the playlist files (see below)
3. **Controls**: Use standard Winamp controls (play, pause, stop, next, previous)
4. **Playlist**: Right-click to access playlist window
5. **Equalizer**: Double-click the EQ button for equalizer

## Adding Your Own Songs

### Method 1: Edit the JSON Playlist

Edit `/public/playlist.json` with your streaming URLs:

```json
[
  {
    "metaData": {
      "artist": "Your Artist Name",
      "title": "Your Song Title",
      "album": "Your Album Name",
      "year": "2025"
    },
    "url": "https://your-streaming-url.com/song.mp3",
    "duration": 180
  }
]
```

### Method 2: Edit the JavaScript Configuration

Edit `/src/js/playlist-config.js` and update the `customPlaylist` array:

```javascript
export const customPlaylist = [
  {
    metaData: {
      artist: "Your Artist",
      title: "Your Song",
      album: "Your Album",
    },
    url: "https://your-streaming-url.com/song.mp3",
    duration: 180, // Duration in seconds
  },
  // Add more tracks...
];
```

## Supported Audio Formats

- **Direct URLs**: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`
- **Streaming Services**: SoundCloud, YouTube (with proper API setup)
- **Self-hosted**: Any audio file served from your domain

## Streaming URL Examples

### Direct Audio Files
```
https://example.com/audio/song.mp3
https://yourdomain.com/music/track.wav
```

### Internet Archive
```
https://archive.org/download/item-name/audio-file.mp3
```

### SoundCloud (requires API setup)
```javascript
// You'll need to implement SoundCloud API integration
// See: https://developers.soundcloud.com/
```

### YouTube (requires backend service)
```javascript
// You'll need a backend service to extract audio URLs
// Consider using youtube-dl or similar tools
```

## CORS Issues

If you encounter CORS (Cross-Origin Resource Sharing) issues with streaming URLs:

1. **Use your own domain**: Host audio files on the same domain
2. **Proxy service**: Create a backend proxy for external URLs
3. **CORS-enabled services**: Use services that allow cross-origin requests

## Customization

### Styling
The player includes custom CSS in `/src/js/webamp-player.js`. You can modify:
- Colors and theming
- Size and positioning
- Mobile responsiveness

### Skins
To use custom Winamp skins:
1. Download `.wsz` skin files
2. Place them in `/public/skins/`
3. Update the `initialSkin` configuration in webamp-player.js

### Notifications
The player can show desktop notifications for track changes. Users will be prompted to allow notifications.

## Development

### Testing Locally
```bash
npm run dev
```

### Adding New Features
1. Edit `/src/js/webamp-player.js` for player functionality
2. Edit `/src/js/playlist-config.js` for playlist management
3. Edit `/src/js/main.js` for UI integration

## Troubleshooting

### Player Won't Load
- Check browser console for errors
- Ensure all streaming URLs are accessible
- Verify CORS headers for external URLs

### Audio Won't Play
- Test URLs directly in browser
- Check audio file formats
- Verify HTTPS for secure contexts

### Mobile Issues
- Player automatically scales on small screens
- Touch controls are supported
- Some features may be limited on mobile

## External Resources

- [Webamp Documentation](https://docs.webamp.org/)
- [Webamp GitHub](https://github.com/captbaritone/webamp)
- [Winamp Skins Archive](https://skins.webamp.org/)
- [Internet Archive Audio](https://archive.org/details/audio)

## Bay Harbor Gooner Theme

The player includes custom theming to match the Bay Harbor Gooner aesthetic:
- Red-tinted interface
- Dark color scheme
- Custom notifications with knife emoji
- Dexter-themed console messages

Enjoy your killer playlist! 🔪🎵 