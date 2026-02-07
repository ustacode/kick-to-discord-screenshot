import WebSocket from 'ws';
import { EventEmitter } from 'events';

const PUSHER_WS_URL = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false';

interface PusherMessage {
  event: string;
  data: string;
  channel?: string;
}

interface ChatMessageData {
  id: string;
  content: string;
  sender: {
    id: number;
    username: string;
    slug: string;
  };
}

export class KickChatListener extends EventEmitter {
  private ws: WebSocket | null = null;
  private chatroomId: number;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(chatroomId: number) {
    super();
    this.chatroomId = chatroomId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(PUSHER_WS_URL);

      this.ws.on('open', () => {
        console.log('[Chat] Connected to Pusher');
        this.subscribe();
        this.startPing();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message: PusherMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          // ignore parse errors
        }
      });

      this.ws.on('error', (error) => {
        console.error('[Chat] WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[Chat] Disconnected');
        this.stopPing();
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          console.log('[Chat] Reconnecting...');
          this.connect().catch(console.error);
        }, 5000);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  private subscribe(): void {
    if (!this.ws) return;
    this.ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { auth: '', channel: `chatrooms.${this.chatroomId}.v2` },
    }));
    console.log(`[Chat] Subscribed to chatroom ${this.chatroomId}`);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: PusherMessage): void {
    if (message.event === 'App\\Events\\ChatMessageEvent') {
      try {
        const data = JSON.parse(message.data);
        const content: string = data.content || '';
        const sender = data.sender?.username || 'unknown';

        if (content.trim().toLowerCase() === '!pic') {
          console.log(`[Chat] !pic command from ${sender}`);
          this.emit('pic', { sender, content });
        }
      } catch {
        // ignore malformed chat messages
      }
    }
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
