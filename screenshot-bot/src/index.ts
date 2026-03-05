import dotenv from 'dotenv';
dotenv.config();

import { getStreamInfo } from './kick/stream';
import { KickChatListener } from './kick/chat';
import { captureScreenshot } from './screenshot';
import { sendScreenshot, sendClip } from './discord';
import { RollingBuffer } from './clip';

const KICK_CHANNEL = process.env.KICK_CHANNEL!;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;

if (!KICK_CHANNEL || !DISCORD_WEBHOOK_URL) {
  console.error('Missing required env vars: KICK_CHANNEL, DISCORD_WEBHOOK_URL');
  process.exit(1);
}

async function main() {
  console.log('='.repeat(50));
  console.log('Kick Screenshot Bot');
  console.log('='.repeat(50));
  console.log(`Channel: ${KICK_CHANNEL}`);
  console.log('='.repeat(50));

  // Fetch stream info
  console.log(`\nFetching stream info for ${KICK_CHANNEL}...`);
  const streamInfo = await getStreamInfo(KICK_CHANNEL);

  if (!streamInfo.isLive || !streamInfo.playbackUrl) {
    console.error(`${KICK_CHANNEL} is not live. Start the bot when the channel is streaming.`);
    process.exit(1);
  }

  console.log(`Stream: ${streamInfo.title}`);
  console.log(`Viewers: ${streamInfo.viewerCount}`);
  console.log(`M3U8: ${streamInfo.playbackUrl.substring(0, 60)}...`);

  const m3u8Url = streamInfo.playbackUrl;

  // Start rolling buffer for clips
  const buffer = new RollingBuffer();
  console.log('\nStarting rolling buffer for !clip...');
  await buffer.start(m3u8Url);

  // Connect to chat
  const chat = new KickChatListener(streamInfo.chatroomId);
  await chat.connect();

  chat.on('pic', async ({ sender }: { sender: string }) => {
    console.log(`[Bot] Taking screenshot (requested by ${sender})...`);

    try {
      const screenshot = await captureScreenshot(m3u8Url);
      console.log(`[Bot] Screenshot captured (${(screenshot.length / 1024).toFixed(1)} KB)`);

      await sendScreenshot(DISCORD_WEBHOOK_URL!, screenshot, KICK_CHANNEL!, sender);
      console.log('[Bot] Screenshot sent to Discord!');
    } catch (error) {
      console.error('[Bot] Failed:', error instanceof Error ? error.message : error);
    }
  });

  chat.on('clip', async ({ sender }: { sender: string }) => {
    console.log(`[Bot] Capturing 30s clip (requested by ${sender})...`);

    try {
      const clip = await buffer.captureClip(30);
      console.log(`[Bot] Clip captured (${(clip.length / 1024 / 1024).toFixed(1)} MB)`);

      await sendClip(DISCORD_WEBHOOK_URL!, clip, KICK_CHANNEL!, sender);
      console.log('[Bot] Clip sent to Discord!');
    } catch (error) {
      console.error('[Bot] Clip failed:', error instanceof Error ? error.message : error);
    }
  });

  console.log('\nBot is running. Listening for !pic and !clip in chat...\n');

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    chat.disconnect();
    buffer.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
