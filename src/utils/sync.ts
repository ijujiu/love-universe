import mqtt, { MqttClient } from 'mqtt';

export interface SyncProfile {
  name: string;
  avatar: string;
}

export interface AppStateSnapshot {
  milestones: any[];
  capsules: any[];
  wishes: any[];
  moodHistory: any[];
  weeklyReports: any[];
  anniversaries?: any[];
}

export type SyncMessageType =
  | 'hello'
  | 'profile'
  | 'state-request'
  | 'state-full'
  | 'state-update'
  | 'ping'
  | 'pong';

export interface SyncMessage {
  type: SyncMessageType;
  payload: any;
  timestamp: number;
  senderId: string;
}

export type SyncStatus = 'idle' | 'waiting' | 'connecting' | 'connected' | 'error';

export interface SyncCallbacks {
  onStatusChange?: (status: SyncStatus, info?: string) => void;
  onPartnerConnected?: (partnerProfile: SyncProfile) => void;
  onCoupleReady?: (couple: {
    partnerA: SyncProfile;
    partnerB: SyncProfile;
    startDate: string;
    pairCode: string;
    id: string;
    createdAt: string;
    anniversaries: any[];
  }) => void;
  onStateReceived?: (state: AppStateSnapshot) => void;
  onStateUpdate?: (update: { type: string; data: any }) => void;
  onError?: (error: string) => void;
}

const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

const MQTT_CLIENT_ID_PREFIX = 'shuangqi-v3-';
const RECONNECT_DELAY = 3000;
const HEARTBEAT_INTERVAL = 20000;
const CONNECTION_TIMEOUT = 12000;

function generateClientId(): string {
  return MQTT_CLIENT_ID_PREFIX + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function topicForPair(pairCode: string, kind: 'signal' | 'data' | 'broadcast'): string {
  return `shuangqi/universe/${pairCode}/${kind}`;
}

class SyncService {
  private mqttClient: MqttClient | null = null;
  private pairCode: string | null = null;
  private clientId = '';
  private myProfile: SyncProfile | null = null;
  private startDate: string | null = null;
  private callbacks: SyncCallbacks = {};
  private status: SyncStatus = 'idle';
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private role: 'creator' | 'joiner' | null = null;
  private coupleId: string | null = null;
  private createdAt: string | null = null;
  private pendingUpdates: Array<{ type: string; data: any }> = [];
  private coupleDataCache: { anniversaries?: any[]; joinerAcked?: boolean } = {};
  private lastPartnerSeen = 0;
  private connectionAttempts = 0;
  private currentBrokerIndex = 0;
  private mqttConnected = false;
  private initTimeout: ReturnType<typeof setTimeout> | null = null;

  private setStatus(status: SyncStatus, info?: string) {
    this.status = status;
    try {
      this.callbacks.onStatusChange?.(status, info);
    } catch (e) {
      console.error('[Sync]', e);
    }
  }

  generatePairCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createUniverse(
    profile: SyncProfile,
    startDate: string,
    coupleId: string,
    callbacks: SyncCallbacks,
    existingAnniversaries?: any[]
  ): Promise<string> {
    this.cleanup();
    this.callbacks = callbacks;
    this.myProfile = profile;
    this.startDate = startDate;
    this.coupleId = coupleId;
    this.createdAt = new Date().toISOString();
    this.role = 'creator';
    this.coupleDataCache = { anniversaries: existingAnniversaries || [] };
    this.clientId = generateClientId();

    const code = this.generatePairCode();
    this.pairCode = code;

    this.setStatus('connecting', '正在连接宇宙网络...');
    await this.connectMqtt();
    this.setStatus('waiting', '等待TA加入...');
    return code;
  }

  async resumeAsHost(
    profile: SyncProfile,
    startDate: string,
    coupleId: string,
    createdAt: string,
    pairCode: string,
    callbacks: SyncCallbacks,
    existingAnniversaries?: any[]
  ) {
    this.cleanup();
    this.callbacks = callbacks;
    this.myProfile = profile;
    this.startDate = startDate;
    this.coupleId = coupleId;
    this.createdAt = createdAt;
    this.pairCode = pairCode;
    this.role = 'creator';
    this.coupleDataCache = { anniversaries: existingAnniversaries || [] };
    this.clientId = generateClientId();

    this.setStatus('waiting', '等待TA加入...');
    await this.connectMqtt();
    this.broadcastPresence();
  }

  async resumeAsJoiner(
    profile: SyncProfile,
    startDate: string,
    coupleId: string,
    createdAt: string,
    pairCode: string,
    callbacks: SyncCallbacks
  ) {
    this.cleanup();
    this.callbacks = callbacks;
    this.myProfile = profile;
    this.startDate = startDate;
    this.coupleId = coupleId;
    this.createdAt = createdAt;
    this.pairCode = pairCode;
    this.role = 'joiner';
    this.clientId = generateClientId();

    this.setStatus('connecting', '正在重新连接...');
    await this.connectMqtt();
    this.sendJoin();
  }

  async joinUniverse(pairCode: string, profile: SyncProfile, callbacks: SyncCallbacks) {
    this.cleanup();
    this.callbacks = callbacks;
    this.myProfile = profile;
    this.pairCode = pairCode;
    this.role = 'joiner';
    this.clientId = generateClientId();
    this.coupleId = 'joined-' + Date.now();
    this.createdAt = new Date().toISOString();

    this.setStatus('connecting', '正在连接...');
    await this.connectMqtt();
    this.sendJoin();
  }

  private connectMqtt(): Promise<void> {
    return new Promise((resolve) => {
      const brokerUrl = MQTT_BROKERS[this.currentBrokerIndex];
      console.log('[Sync] Connecting MQTT:', brokerUrl);

      if (this.initTimeout) clearTimeout(this.initTimeout);
      this.initTimeout = setTimeout(() => {
        if (!this.mqttConnected) {
          console.warn('[Sync] MQTT timeout, next broker');
          this.tryNextBroker();
        }
      }, CONNECTION_TIMEOUT);

      try {
        this.mqttClient = mqtt.connect(brokerUrl, {
          clientId: this.clientId,
          clean: true,
          connectTimeout: 8000,
          reconnectPeriod: 0,
          keepalive: 30,
        });

        this.mqttClient.on('connect', () => {
          console.log('[Sync] MQTT connected');
          this.mqttConnected = true;
          this.connectionAttempts = 0;
          if (this.initTimeout) { clearTimeout(this.initTimeout); this.initTimeout = null; }
          this.subscribeTopics();
          this.startHeartbeat();
          this.setStatus(
            this.role === 'joiner' ? 'connecting' : 'waiting',
            this.role === 'creator' ? '等待TA加入...' : '正在连接...'
          );
          if (this.role === 'creator') this.broadcastPresence();
          resolve();
        });

        this.mqttClient.on('message', (topic, message) => {
          this.handleMqttMessage(topic, message.toString()).catch(e => console.error('[Sync] msg err:', e));
        });

        this.mqttClient.on('error', (err) => {
          console.error('[Sync] MQTT error:', err.message);
        });

        this.mqttClient.on('close', () => {
          console.log('[Sync] MQTT closed');
          this.mqttConnected = false;
          this.stopHeartbeat();
          if (this.status === 'connected') {
            this.setStatus('waiting', '网络断开，尝试重连...');
          }
          this.scheduleReconnect();
        });

        this.mqttClient.on('offline', () => {
          this.mqttConnected = false;
          this.scheduleReconnect();
        });
      } catch (e) {
        console.error('[Sync] MQTT exception:', e);
        this.scheduleReconnect();
        resolve();
      }
    });
  }

  private tryNextBroker() {
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % MQTT_BROKERS.length;
    this.connectionAttempts++;
    console.log('[Sync] Switch broker index:', this.currentBrokerIndex);
    try {
      if (this.mqttClient) { this.mqttClient.end(true); this.mqttClient = null; }
    } catch {}
    this.mqttConnected = false;
    setTimeout(() => this.connectMqtt(), 500);
  }

  private subscribeTopics() {
    if (!this.mqttClient || !this.pairCode) return;
    const topics = [
      topicForPair(this.pairCode, 'signal'),
      topicForPair(this.pairCode, 'data'),
      topicForPair(this.pairCode, 'broadcast'),
    ];
    this.mqttClient.subscribe(topics, { qos: 0 }, (err) => {
      if (err) console.error('[Sync] Sub err:', err);
      else console.log('[Sync] Subscribed');
    });
  }

  private publishMessage(kind: 'signal' | 'data' | 'broadcast', msg: SyncMessage) {
    if (!this.mqttClient || !this.pairCode || !this.mqttConnected) return;
    const topic = topicForPair(this.pairCode, kind);
    this.mqttClient.publish(topic, JSON.stringify(msg), { qos: 0, retain: false });
  }

  private broadcastPresence() {
    if (!this.myProfile || !this.pairCode) return;
    this.publishMessage('broadcast', {
      type: 'hello',
      payload: {
        profile: this.myProfile,
        role: this.role,
        coupleId: this.coupleId,
        startDate: this.startDate,
        anniversaries: this.coupleDataCache.anniversaries,
      },
      timestamp: Date.now(),
      senderId: this.clientId,
    });
  }

  private sendJoin() {
    if (!this.myProfile || !this.pairCode) return;
    this.publishMessage('signal', {
      type: 'hello',
      payload: { profile: this.myProfile, role: this.role },
      timestamp: Date.now(),
      senderId: this.clientId,
    });
    setTimeout(() => {
      if (this.status !== 'connected') {
        this.setStatus('error', '未找到该配对码，请确认TA已创建宇宙并保持页面打开');
        this.callbacks.onError?.('配对码未找到');
      }
    }, 10000);
  }

  private async handleMqttMessage(topic: string, raw: string) {
    let msg: SyncMessage;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || msg.senderId === this.clientId) return;

    if (msg.type === 'hello' || msg.type === 'ping' || msg.type === 'pong') {
      this.lastPartnerSeen = Date.now();
    }

    switch (msg.type) {
      case 'hello': {
        const partnerProfile = msg.payload.profile as SyncProfile;
        if (this.role === 'creator' && msg.payload.role === 'joiner') {
          this.callbacks.onPartnerConnected?.(partnerProfile);
          const anniversaries = this.coupleDataCache.anniversaries || msg.payload.anniversaries || [];
          const coupleData = {
            partnerA: this.myProfile!,
            partnerB: partnerProfile,
            startDate: this.startDate!,
            pairCode: this.pairCode!,
            id: this.coupleId!,
            createdAt: this.createdAt!,
            anniversaries,
          };
          this.callbacks.onCoupleReady?.(coupleData);
          this.setStatus('connected', '已连接！');
          this.publishMessage('signal', {
            type: 'profile',
            payload: { myProfile: this.myProfile, couple: coupleData },
            timestamp: Date.now(),
            senderId: this.clientId,
          });
          setTimeout(() => {
            this.publishMessage('data', { type: 'state-request', payload: null, timestamp: Date.now(), senderId: this.clientId });
          }, 500);
        } else if (this.role === 'joiner' && msg.payload.role === 'creator') {
          this.startDate = msg.payload.startDate;
          this.coupleId = msg.payload.coupleId;
          this.callbacks.onPartnerConnected?.(partnerProfile);
          this.publishMessage('signal', {
            type: 'profile',
            payload: { myProfile: this.myProfile },
            timestamp: Date.now(),
            senderId: this.clientId,
          });
        }
        break;
      }
      case 'profile': {
        if (this.role === 'joiner' && msg.payload.couple) {
          const { couple } = msg.payload;
          this.coupleId = couple.id;
          this.startDate = couple.startDate;
          this.createdAt = couple.createdAt;
          this.callbacks.onCoupleReady?.(couple);
          this.setStatus('connected', '已连接！');
        }
        setTimeout(() => {
          this.publishMessage('data', { type: 'state-request', payload: null, timestamp: Date.now(), senderId: this.clientId });
        }, 500);
        break;
      }
      case 'state-request':
        this.callbacks.onStateUpdate?.({ type: 'request-full', data: null });
        break;
      case 'state-full':
        this.callbacks.onStateReceived?.(msg.payload as AppStateSnapshot);
        this.flushPendingUpdates();
        break;
      case 'state-update':
        this.callbacks.onStateUpdate?.(msg.payload);
        break;
      case 'ping':
        this.publishMessage(topic.includes('broadcast') ? 'broadcast' : 'data', {
          type: 'pong', payload: null, timestamp: Date.now(), senderId: this.clientId,
        });
        break;
      case 'pong':
        break;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.mqttConnected) {
        this.publishMessage('broadcast', { type: 'ping', payload: null, timestamp: Date.now(), senderId: this.clientId });
        if (Date.now() - this.lastPartnerSeen > HEARTBEAT_INTERVAL * 2.5) {
          if (this.status === 'connected') {
            this.setStatus('waiting', '对方暂时离线，等待重连...');
          }
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(RECONNECT_DELAY + this.connectionAttempts * 1000, 10000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.mqttConnected) this.tryNextBroker();
    }, delay);
  }

  sendFullState(state: AppStateSnapshot) {
    this.publishMessage('data', { type: 'state-full', payload: state, timestamp: Date.now(), senderId: this.clientId });
  }

  broadcastUpdate(update: { type: string; data: any }) {
    if (this.mqttConnected && this.pairCode) {
      this.publishMessage('data', { type: 'state-update', payload: update, timestamp: Date.now(), senderId: this.clientId });
    }
    this.pendingUpdates.push(update);
  }

  private flushPendingUpdates() {
    const pending = [...this.pendingUpdates];
    this.pendingUpdates = [];
    for (const update of pending) {
      this.publishMessage('data', { type: 'state-update', payload: update, timestamp: Date.now(), senderId: this.clientId });
    }
  }

  isConnected(): boolean {
    return this.mqttConnected && this.status === 'connected';
  }

  getStatus(): SyncStatus { return this.status; }
  getPairCode(): string | null { return this.pairCode; }

  updateCachedAnniversaries(anniversaries: any[]) {
    this.coupleDataCache.anniversaries = anniversaries;
  }

  disconnect() { this.cleanup(); }

  private cleanup() {
    this.stopHeartbeat();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.initTimeout) { clearTimeout(this.initTimeout); this.initTimeout = null; }
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch {}
      this.mqttClient = null;
    }
    this.mqttConnected = false;
    this.pairCode = null;
    this.myProfile = null;
    this.role = null;
    this.coupleId = null;
    this.createdAt = null;
    this.pendingUpdates = [];
    this.coupleDataCache = {};
    this.connectionAttempts = 0;
    this.currentBrokerIndex = 0;
    this.clientId = '';
    this.lastPartnerSeen = 0;
    this.setStatus('idle');
  }
}

export const syncService = new SyncService();
