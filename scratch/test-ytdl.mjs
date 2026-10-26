import ytdl from '@distube/ytdl-core';

async function test() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll as standard test
    console.log('Testing video info...');
    const info = await ytdl.getInfo(videoUrl);
    console.log('Title:', info.videoDetails.title);
    console.log('Description length:', info.videoDetails.description?.length);
    
    // Check audio formats
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    console.log('Audio formats found:', audioFormats.length);
    if (audioFormats.length > 0) {
      console.log('Lowest audio bitrate format:', audioFormats[audioFormats.length - 1].container, audioFormats[audioFormats.length - 1].audioBitrate);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

test();
