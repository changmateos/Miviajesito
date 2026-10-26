import { Ytdl } from '@distube/ytdl-core';

async function testAudio() {
  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  console.log('Downloading audio chunk...');
  const ytdl = new Ytdl();
  const stream = ytdl.download(videoUrl, {
    filter: { hasAudio: true, hasVideo: false },
    quality: 'lowestaudio',
  });

  const chunks = [];
  let totalBytes = 0;

  await new Promise((resolve) => {
    stream.on('data', (chunk) => {
      chunks.push(chunk);
      totalBytes += chunk.length;
      if (totalBytes >= 500000) { // 500 KB
        stream.destroy();
        console.log(`Success! Captured ${totalBytes} bytes of audio.`);
        resolve();
      }
    });

    stream.on('error', (err) => {
      console.log('Stream error or finished:', err.message);
      resolve();
    });

    setTimeout(() => {
      stream.destroy();
      console.log('Timeout reached, captured bytes:', totalBytes);
      resolve();
    }, 8000);
  });
}

testAudio();
