import { blobToBase64 } from './storage';

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
    } catch (err) {
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  async stop(): Promise<{ data: string; duration: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('录音未开始'));
        return;
      }

      const duration = Date.now() - this.startTime;

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const base64 = await blobToBase64(blob);
        this.cleanup();
        resolve({ data: base64, duration, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  static isSupported(): boolean {
    return !!(navigator.mediaDevices && window.MediaRecorder);
  }
}

let audioContext: AudioContext | null = null;

export function playVoice(base64Data: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const response = await fetch(base64Data);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => resolve();
      source.start(0);
    } catch (err) {
      reject(err);
    }
  });
}

export function playNotificationSound(type: 'proximity' | 'unlock' | 'complete' = 'complete'): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'proximity':
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.setValueAtTime(659.25, now + 0.15);
        oscillator.frequency.setValueAtTime(783.99, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;
      case 'unlock':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1108.73, now + 0.1);
        oscillator.frequency.setValueAtTime(1318.51, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;
      case 'complete':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.setValueAtTime(659.25, now + 0.12);
        oscillator.frequency.setValueAtTime(783.99, now + 0.24);
        oscillator.frequency.setValueAtTime(1046.50, now + 0.36);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;
    }

    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
  }
}
