import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Couple, Milestone, Capsule, Wish, MoodEntry, WeeklyReport, MoodType, AppSettings, Anniversary } from '../types';
import { generateId } from '../utils/crypto';
import { getDaysTogether, getTodayString } from '../utils/date';
import { analyzeWeeklyData } from '../utils/ai';
import { generateWeeklyInsight, generateComfortMessage } from '../utils/deepseek';
import { playNotificationSound } from '../utils/recorder';
import { syncService, SyncProfile, AppStateSnapshot } from '../utils/sync';

export type SyncStatus = 'idle' | 'waiting' | 'connecting' | 'connected' | 'error';

interface AppState {
  isPaired: boolean;
  couple: Couple | null;
  milestones: Milestone[];
  capsules: Capsule[];
  wishes: Wish[];
  moodHistory: MoodEntry[];
  weeklyReports: WeeklyReport[];
  currentPartner: 'A' | 'B';
  showFireworks: boolean;
  proximityDetected: boolean;
  hugModalOpen: boolean;
  comfortMessage: string;
  settings: AppSettings;
  pairingMode: 'create' | 'join' | null;
  tempPairCode: string | null;
  isGeneratingReport: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  waitingForPartner: boolean;
  incomingPartnerProfile: SyncProfile | null;

  setPair: (couple: Couple) => void;
  resetPair: () => void;
  setCurrentPartner: (partner: 'A' | 'B') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateCouple: (updates: Partial<Couple>) => void;

  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => void;
  deleteMilestone: (id: string) => void;

  addCapsule: (capsule: Omit<Capsule, 'id' | 'createdAt' | 'isUnlocked'>) => void;
  unlockCapsule: (id: string) => void;
  deleteCapsule: (id: string) => void;

  addWish: (wish: Omit<Wish, 'id' | 'completed' | 'checkIns' | 'badge' | 'createdBy' | 'createdAt'>) => void;
  checkInWish: (wishId: string, partner: 'A' | 'B', note?: string) => void;
  deleteWish: (id: string) => void;

  setTodayMood: (partner: 'A' | 'B', mood: MoodType, note?: string) => void;

  generateWeeklyReport: () => Promise<void>;
  triggerFireworks: () => void;
  stopFireworks: () => void;

  setProximityDetected: (detected: boolean) => void;
  setHugModalOpen: (open: boolean) => void;
  setComfortMessage: (msg: string) => void;

  generateNewPairCode: () => string;
  setPairingMode: (mode: 'create' | 'join' | null) => void;
  validatePairCode: (code: string) => boolean;

  addAnniversary: (anniversary: Omit<Anniversary, 'id'>) => void;
  deleteAnniversary: (id: string) => void;

  createUniverse: (myProfile: SyncProfile, startDate: string) => Promise<string>;
  joinUniverse: (pairCode: string, myProfile: SyncProfile) => Promise<void>;
  quickStart: (myProfile: SyncProfile, partnerProfile: SyncProfile, startDate: string) => void;
  initSync: () => void;
  disconnectSync: () => void;
  regeneratePairCode: () => Promise<string>;

  getStateSnapshot: () => AppStateSnapshot;
  mergeRemoteState: (remote: AppStateSnapshot) => void;
  applyRemoteUpdate: (update: { type: string; data: any }) => void;
  broadcastUpdate: (type: string, data: any) => void;
}

const defaultSettings: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  proximityEnabled: false,
  autoGenerateReport: true,
};

function broadcastUpdate(get: () => AppState, type: string, data: any) {
  if (syncService.isConnected()) {
    syncService.broadcastUpdate({ type, data });
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isPaired: false,
      couple: null,
      milestones: [],
      capsules: [],
      wishes: [],
      moodHistory: [],
      weeklyReports: [],
      currentPartner: 'A',
      showFireworks: false,
      proximityDetected: false,
      hugModalOpen: false,
      comfortMessage: '',
      settings: defaultSettings,
      pairingMode: null,
      tempPairCode: null,
      isGeneratingReport: false,
      syncStatus: 'idle',
      syncError: '',
      waitingForPartner: false,
      incomingPartnerProfile: null,

      setPair: (couple) => set({ isPaired: true, couple, tempPairCode: null, pairingMode: null }),
      resetPair: () => {
        syncService.disconnect();
        set({
          isPaired: false,
          couple: null,
          milestones: [],
          capsules: [],
          wishes: [],
          moodHistory: [],
          weeklyReports: [],
          tempPairCode: null,
          pairingMode: null,
          syncStatus: 'idle',
          syncError: '',
          waitingForPartner: false,
          comfortMessage: '',
        });
      },
      setCurrentPartner: (partner) => set({ currentPartner: partner }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      updateCouple: (updates) => set((state) => ({ couple: state.couple ? { ...state.couple, ...updates } : null })),

      addMilestone: (milestone) => {
        const newM: Milestone = { ...milestone, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ milestones: [newM, ...state.milestones] }));
        broadcastUpdate(get, 'milestone-add', newM);
      },
      deleteMilestone: (id) => {
        set((state) => ({ milestones: state.milestones.filter(m => m.id !== id) }));
        broadcastUpdate(get, 'milestone-delete', { id });
      },

      addCapsule: (capsule) => {
        const newC: Capsule = { ...capsule, id: generateId(), createdAt: new Date().toISOString(), isUnlocked: false };
        set((state) => ({ capsules: [newC, ...state.capsules] }));
        broadcastUpdate(get, 'capsule-add', newC);
      },
      unlockCapsule: (id) => {
        const { settings } = get();
        if (settings.soundEnabled) playNotificationSound('unlock');
        if (settings.vibrationEnabled && 'vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        set((state) => ({ capsules: state.capsules.map(c => c.id === id ? { ...c, isUnlocked: true } : c) }));
        broadcastUpdate(get, 'capsule-unlock', { id });
      },
      deleteCapsule: (id) => {
        set((state) => ({ capsules: state.capsules.filter(c => c.id !== id) }));
        broadcastUpdate(get, 'capsule-delete', { id });
      },

      addWish: (wish) => {
        const me = get().currentPartner;
        const newW: Wish = {
          ...wish, id: generateId(), completed: false, checkIns: [], badge: wish.icon,
          createdBy: me, createdAt: new Date().toISOString(),
        };
        set((state) => ({ wishes: [newW, ...state.wishes] }));
        broadcastUpdate(get, 'wish-add', newW);
      },
      checkInWish: (wishId, partner, note) => {
        let shouldCelebrate = false;
        const updated = get().wishes.map(w => {
          if (w.id !== wishId) return w;
          const key = partner === 'A' ? 'progressA' : 'progressB';
          const np = Math.min(w[key] + 1, w.target);
          const u: Wish = { ...w, [key]: np, checkIns: [{ id: generateId(), partner, time: new Date().toISOString(), note }, ...w.checkIns] };
          if (u.progressA + u.progressB >= w.target * 2 && !u.completed) {
            u.completed = true; u.completedAt = new Date().toISOString(); shouldCelebrate = true;
          }
          return u;
        });
        set({ wishes: updated });
        const target = updated.find(w => w.id === wishId);
        if (target) broadcastUpdate(get, 'wish-checkin', { wishId, partner, progressA: target.progressA, progressB: target.progressB, completed: target.completed, checkInId: target.checkIns[0]?.id, note });
        if (shouldCelebrate) setTimeout(() => get().triggerFireworks(), 300);
      },
      deleteWish: (id) => {
        set((state) => ({ wishes: state.wishes.filter(w => w.id !== id) }));
        broadcastUpdate(get, 'wish-delete', { id });
      },

      setTodayMood: async (partner, mood, note) => {
        const state = get();
        const today = getTodayString();
        const existing = state.moodHistory.find(m => m.date === today);
        let newHistory: MoodEntry[];
        if (existing) {
          newHistory = state.moodHistory.map(m => m.date === today ? { ...m, [`mood${partner}`]: mood, [`note${partner}`]: note } : m);
        } else {
          newHistory = [...state.moodHistory, {
            date: today,
            moodA: partner === 'A' ? mood : null,
            moodB: partner === 'B' ? mood : null,
            noteA: partner === 'A' ? note : undefined,
            noteB: partner === 'B' ? note : undefined,
          }];
        }
        set({ moodHistory: newHistory });
        const updated = newHistory.find(m => m.date === today);
        if (updated && updated.moodA === 'stormy' && updated.moodB === 'stormy' && state.couple) {
          const comfort = await generateComfortMessage(state.couple.partnerA.name, state.couple.partnerB?.name || 'TA', '今天两个人心情都有点低落');
          set({ comfortMessage: comfort, hugModalOpen: true });
        }
        broadcastUpdate(get, 'mood-update', { date: today, partner, mood, note });
      },

      generateWeeklyReport: async () => {
        const { couple, milestones, wishes, moodHistory, weeklyReports, isGeneratingReport } = get();
        if (!couple || isGeneratingReport) return;
        const today = new Date();
        const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        if (weeklyReports.find(r => r.weekStart === weekStartStr)) return;
        set({ isGeneratingReport: true });
        try {
          const togetherDays = getDaysTogether(couple.startDate);
          const stats = analyzeWeeklyData(moodHistory, wishes, milestones, togetherDays);
          const aiResult = await generateWeeklyInsight(couple.partnerA.name, couple.partnerB?.name || 'TA', togetherDays, moodHistory, wishes, milestones);
          const newReport: WeeklyReport = {
            id: generateId(), weekStart: weekStartStr, generatedAt: new Date().toISOString(),
            stats: {
              togetherDays: stats.togetherDays, moodMatchDays: stats.moodMatchDays, completedWishes: stats.completedWishes,
              totalCheckIns: stats.totalCheckIns, newMilestones: stats.newMilestones, avgMoodA: stats.avgMoodA, avgMoodB: stats.avgMoodB,
            },
            moodTrend: stats.moodTrend, aiInsight: aiResult.insight, highlights: aiResult.highlights,
          };
          set((s) => ({ weeklyReports: [newReport, ...s.weeklyReports], isGeneratingReport: false }));
          broadcastUpdate(get, 'report-add', newReport);
        } catch (err) {
          console.error('Report failed:', err); set({ isGeneratingReport: false });
        }
      },

      triggerFireworks: () => {
        const { settings } = get();
        if (settings.soundEnabled) playNotificationSound('complete');
        if (settings.vibrationEnabled && 'vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
        set({ showFireworks: true });
        setTimeout(() => set({ showFireworks: false }), 5000);
      },
      stopFireworks: () => set({ showFireworks: false }),

      setProximityDetected: (detected) => {
        const { settings } = get();
        if (detected && settings.soundEnabled) playNotificationSound('proximity');
        if (detected && settings.vibrationEnabled && 'vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
        set({ proximityDetected: detected });
      },
      setHugModalOpen: (open) => set({ hugModalOpen: open }),
      setComfortMessage: (msg) => set({ comfortMessage: msg }),

      generateNewPairCode: () => { const code = syncService.generatePairCode(); set({ tempPairCode: code }); return code; },
      setPairingMode: (mode) => set({ pairingMode: mode }),
      validatePairCode: (code) => code.length === 6 && /^\d{6}$/.test(code),

      addAnniversary: (anniversary) => set((state) => {
        if (!state.couple) return state;
        const updated: Couple = { ...state.couple, anniversaries: [...state.couple.anniversaries, { ...anniversary, id: generateId() }] };
        syncService.updateCachedAnniversaries(updated.anniversaries);
        broadcastUpdate(get, 'couple-anniversaries', updated.anniversaries);
        return { couple: updated };
      }),
      deleteAnniversary: (id) => set((state) => {
        if (!state.couple) return state;
        const updated: Couple = { ...state.couple, anniversaries: state.couple.anniversaries.filter(a => a.id !== id) };
        syncService.updateCachedAnniversaries(updated.anniversaries);
        broadcastUpdate(get, 'couple-anniversaries', updated.anniversaries);
        return { couple: updated };
      }),

      createUniverse: async (myProfile, startDate) => {
        const coupleId = generateId();
        const code = await syncService.createUniverse(
          { name: myProfile.name, avatar: myProfile.avatar }, startDate, coupleId,
          {
            onStatusChange: (status, info) => set({ syncStatus: status, syncError: status === 'error' ? info || '' : '' }),
            onPartnerConnected: (partnerProfile) => {
              set({ incomingPartnerProfile: partnerProfile, waitingForPartner: false });
              const s = get();
              if (s.couple) {
                const updated: Couple = { ...s.couple, partnerB: partnerProfile, connectionStatus: 'connected' };
                set({ couple: updated, syncStatus: 'connected', waitingForPartner: false });
                broadcastUpdate(get, 'couple-update', updated);
              }
            },
            onCoupleReady: (coupleData) => {
              const couple: Couple = {
                id: coupleData.id, partnerA: coupleData.partnerA, partnerB: coupleData.partnerB,
                startDate: coupleData.startDate, pairCode: coupleData.pairCode, anniversaries: coupleData.anniversaries,
                createdAt: coupleData.createdAt, myRole: 'A', connectionStatus: coupleData.partnerB ? 'connected' : 'waiting',
              };
              set({ isPaired: true, couple, currentPartner: 'A', waitingForPartner: !coupleData.partnerB });
            },
            onStateReceived: (remote) => get().mergeRemoteState(remote),
            onStateUpdate: (update) => {
              if (update.type === 'request-full') {
                setTimeout(() => syncService.sendFullState(get().getStateSnapshot()), 500);
              } else {
                get().applyRemoteUpdate(update);
              }
            },
            onError: (err) => set({ syncError: err }),
          },
          []
        );
        return code;
      },

      joinUniverse: async (pairCode, myProfile) => {
        await syncService.joinUniverse(pairCode, { name: myProfile.name, avatar: myProfile.avatar }, {
          onStatusChange: (status, info) => set({ syncStatus: status, syncError: status === 'error' ? info || '' : '' }),
          onPartnerConnected: (partnerProfile) => set({ incomingPartnerProfile: partnerProfile }),
          onCoupleReady: (coupleData) => {
            const couple: Couple = {
              id: coupleData.id, partnerA: coupleData.partnerA, partnerB: coupleData.partnerB,
              startDate: coupleData.startDate, pairCode: coupleData.pairCode, anniversaries: coupleData.anniversaries,
              createdAt: coupleData.createdAt, myRole: 'B', connectionStatus: 'connected',
            };
            set({ isPaired: true, couple, currentPartner: 'B', waitingForPartner: false });
          },
          onStateReceived: (remote) => get().mergeRemoteState(remote),
          onStateUpdate: (update) => {
            if (update.type === 'request-full') {
              setTimeout(() => syncService.sendFullState(get().getStateSnapshot()), 500);
            } else {
              get().applyRemoteUpdate(update);
            }
          },
          onError: (err) => set({ syncError: err }),
        });
      },

      quickStart: (myProfile, partnerProfile, startDate) => {
        const couple: Couple = {
          id: generateId(), partnerA: myProfile, partnerB: partnerProfile,
          startDate, pairCode: '000000', anniversaries: [], createdAt: new Date().toISOString(),
          myRole: 'A', connectionStatus: 'offline',
        };
        set({ isPaired: true, couple, currentPartner: 'A', syncStatus: 'idle' });
      },

      initSync: () => {
        const state = get();
        if (!state.isPaired || !state.couple || !state.couple.pairCode) return;
        if (state.couple.connectionStatus === 'offline' || state.couple.pairCode === '000000') {
          set({ syncStatus: 'idle', waitingForPartner: false });
          return;
        }
        const myProfile = state.couple.myRole === 'A' ? state.couple.partnerA : (state.couple.partnerB || state.couple.partnerA);
        const anniversaries = state.couple.anniversaries || [];
        syncService.updateCachedAnniversaries(anniversaries);
        const callbacks = {
          onStatusChange: (status: SyncStatus, info?: string) => {
            set({ syncStatus: status, syncError: status === 'error' ? info || '' : '' });
            if (status === 'waiting') set({ waitingForPartner: true });
            else if (status === 'connected') set({ waitingForPartner: false });
          },
          onPartnerConnected: (partnerProfile: SyncProfile) => {
            set({ incomingPartnerProfile: partnerProfile, waitingForPartner: false });
            const s = get();
            if (s.couple) {
              const isHost = s.couple.myRole === 'A';
              set({ couple: { ...s.couple, partnerB: isHost ? partnerProfile : s.couple.partnerB, connectionStatus: 'connected' }, syncStatus: 'connected', waitingForPartner: false });
            }
          },
          onCoupleReady: (coupleData: any) => {
            const s = get();
            if (!s.couple) return;
            set({
              couple: {
                ...s.couple,
                partnerB: coupleData.partnerB || s.couple.partnerB,
                startDate: coupleData.startDate || s.couple.startDate,
                anniversaries: coupleData.anniversaries || s.couple.anniversaries,
                connectionStatus: 'connected',
              },
              syncStatus: 'connected', waitingForPartner: false, isPaired: true,
            });
          },
          onStateReceived: (remote: AppStateSnapshot) => get().mergeRemoteState(remote),
          onStateUpdate: (update: { type: string; data: any }) => {
            if (update.type === 'request-full') {
              setTimeout(() => syncService.sendFullState(get().getStateSnapshot()), 500);
            } else {
              get().applyRemoteUpdate(update);
            }
          },
          onError: (err: string) => set({ syncError: err }),
        };
        if (state.couple.myRole === 'A') {
          syncService.resumeAsHost({ name: myProfile.name, avatar: myProfile.avatar }, state.couple.startDate, state.couple.id, state.couple.createdAt, state.couple.pairCode, callbacks, anniversaries);
        } else {
          const mj = state.couple.partnerB || state.couple.partnerA;
          syncService.resumeAsJoiner({ name: mj.name, avatar: mj.avatar }, state.couple.startDate, state.couple.id, state.couple.createdAt, state.couple.pairCode, callbacks);
        }
      },

      disconnectSync: () => { syncService.disconnect(); set({ syncStatus: 'idle' }); },

      regeneratePairCode: async () => {
        const state = get();
        if (!state.couple || state.couple.connectionStatus === 'offline') {
          const code = syncService.generatePairCode();
          set({ tempPairCode: code });
          return code;
        }
        syncService.disconnect();
        await new Promise(r => setTimeout(r, 500));
        const profile = state.couple.myRole === 'A' ? state.couple.partnerA : (state.couple.partnerB || state.couple.partnerA);
        const code = await syncService.createUniverse(
          { name: profile.name, avatar: profile.avatar }, state.couple.startDate, state.couple.id,
          {
            onStatusChange: (status, info) => set({ syncStatus: status, syncError: status === 'error' ? info || '' : '' }),
            onPartnerConnected: (partnerProfile) => set({ incomingPartnerProfile: partnerProfile, waitingForPartner: false }),
            onCoupleReady: (coupleData) => {
              const s = get();
              if (s.couple) set({ couple: { ...s.couple, pairCode: coupleData.pairCode, partnerB: coupleData.partnerB, anniversaries: coupleData.anniversaries, connectionStatus: coupleData.partnerB ? 'connected' : 'waiting' }, syncStatus: 'connected', waitingForPartner: !coupleData.partnerB });
            },
            onStateReceived: (remote) => get().mergeRemoteState(remote),
            onStateUpdate: (update) => {
              if (update.type === 'request-full') setTimeout(() => syncService.sendFullState(get().getStateSnapshot()), 500);
              else get().applyRemoteUpdate(update);
            },
            onError: (err) => set({ syncError: err }),
          },
          state.couple.anniversaries
        );
        set((s) => s.couple ? { couple: { ...s.couple, pairCode: code }, tempPairCode: code } : { tempPairCode: code });
        return code;
      },

      getStateSnapshot: (): AppStateSnapshot => {
        const s = get();
        return {
          milestones: s.milestones, capsules: s.capsules, wishes: s.wishes,
          moodHistory: s.moodHistory, weeklyReports: s.weeklyReports,
          anniversaries: s.couple?.anniversaries,
        };
      },

      mergeRemoteState: (remote) => {
        const local = get();
        const mergeById = <T extends { id: string; createdAt?: string }>(localArr: T[], remoteArr: T[]): T[] => {
          const map = new Map<string, T>();
          for (const it of localArr) map.set(it.id, it);
          for (const it of remoteArr) {
            const exist = map.get(it.id);
            if (!exist || (it.createdAt && exist.createdAt && it.createdAt > exist.createdAt) ||
                (JSON.stringify(it).length > JSON.stringify(exist).length)) {
              map.set(it.id, it);
            }
          }
          return Array.from(map.values()).sort((a, b) => {
            const da = (a as any).createdAt || ''; const db = (b as any).createdAt || '';
            return db.localeCompare(da);
          });
        };
        set({
          milestones: mergeById(local.milestones, remote.milestones || []),
          capsules: mergeById(local.capsules, remote.capsules || []),
          wishes: mergeById(local.wishes, remote.wishes || []),
          moodHistory: mergeById(local.moodHistory as any, (remote.moodHistory || []) as any) as any,
          weeklyReports: mergeById(local.weeklyReports, remote.weeklyReports || []),
        });
      },

      applyRemoteUpdate: (update) => {
        const { type, data } = update;
        switch (type) {
          case 'milestone-add': set((s) => ({ milestones: [data, ...s.milestones.filter(m => m.id !== data.id)] })); break;
          case 'milestone-delete': set((s) => ({ milestones: s.milestones.filter(m => m.id !== data.id) })); break;
          case 'capsule-add': set((s) => ({ capsules: [data, ...s.capsules.filter(c => c.id !== data.id)] })); break;
          case 'capsule-unlock': set((s) => ({ capsules: s.capsules.map(c => c.id === data.id ? { ...c, isUnlocked: true } : c) })); break;
          case 'capsule-delete': set((s) => ({ capsules: s.capsules.filter(c => c.id !== data.id) })); break;
          case 'wish-add': set((s) => ({ wishes: [data, ...s.wishes.filter(w => w.id !== data.id)] })); break;
          case 'wish-checkin': set((s) => ({
            wishes: s.wishes.map(w => w.id !== data.wishId ? w : {
              ...w, progressA: data.progressA, progressB: data.progressB,
              completed: data.completed, checkIns: data.checkInId ? [{ id: data.checkInId, partner: data.partner, time: new Date().toISOString(), note: data.note }, ...w.checkIns] : w.checkIns,
            })
          })); if (data.completed) setTimeout(() => get().triggerFireworks(), 300); break;
          case 'wish-delete': set((s) => ({ wishes: s.wishes.filter(w => w.id !== data.id) })); break;
          case 'mood-update': set((s) => {
            const existing = s.moodHistory.find(m => m.date === data.date);
            if (existing) return { moodHistory: s.moodHistory.map(m => m.date === data.date ? { ...m, [`mood${data.partner}`]: data.mood, [`note${data.partner}`]: data.note } : m) };
            return { moodHistory: [...s.moodHistory, { date: data.date, moodA: data.partner === 'A' ? data.mood : null, moodB: data.partner === 'B' ? data.mood : null, noteA: data.partner === 'A' ? data.note : undefined, noteB: data.partner === 'B' ? data.note : undefined }] };
          }); break;
          case 'report-add': set((s) => ({ weeklyReports: [data, ...s.weeklyReports.filter(r => r.id !== data.id)] })); break;
          case 'couple-update': if (data) set((s) => s.couple ? { couple: { ...s.couple, ...data } } : s); break;
          case 'couple-anniversaries': set((s) => s.couple ? { couple: { ...s.couple, anniversaries: data || [] } } : s); break;
        }
      },

      broadcastUpdate: (type, data) => broadcastUpdate(get, type, data),
    }),
    {
      name: 'shuangqi-universe-storage',
      version: 4,
      migrate: (persistedState: any, version) => {
        if (version < 4) {
          return {
            ...persistedState,
            syncStatus: 'idle', syncError: '', waitingForPartner: false, incomingPartnerProfile: null,
          };
        }
        return persistedState;
      },
    }
  )
);
