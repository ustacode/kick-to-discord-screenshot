import axios from 'axios';
import FormData from 'form-data';

export async function sendClip(
  webhookUrl: string,
  videoBuffer: Buffer,
  channelName: string,
  requestedBy: string,
): Promise<void> {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);

  const metadata = JSON.stringify({
    content: `30s clip of **${channelName}**'s stream (requested by **${requestedBy}**)`,
  });

  const parts: Buffer[] = [];

  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="payload_json"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    metadata + '\r\n'
  ));

  const filename = `clip-${Date.now()}.mp4`;
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files[0]"; filename="${filename}"\r\n` +
    `Content-Type: video/mp4\r\n\r\n`
  ));
  parts.push(videoBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  await axios.post(webhookUrl, body, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    timeout: 30000,
  });
}

export async function sendScreenshot(
  webhookUrl: string,
  imageBuffer: Buffer,
  channelName: string,
  requestedBy: string,
): Promise<void> {
  // Actually, we don't need the form-data package. axios can send multipart with the right setup.
  // Let's use the built-in approach.

  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);

  const metadata = JSON.stringify({
    content: `Screenshot of **${channelName}**'s stream (requested by **${requestedBy}**)`,
  });

  // Build multipart body manually
  const parts: Buffer[] = [];

  // JSON payload part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="payload_json"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    metadata + '\r\n'
  ));

  // File part
  const filename = `screenshot-${Date.now()}.jpg`;
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files[0]"; filename="${filename}"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  ));
  parts.push(imageBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  await axios.post(webhookUrl, body, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    timeout: 15000,
  });
}
