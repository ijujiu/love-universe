import { differenceInDays, differenceInSeconds, format, isAfter, isBefore, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const getDaysTogether = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  return differenceInDays(now, start) + 1;
};

export const getSecondsSinceStart = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  return differenceInSeconds(now, start);
};

export const getDaysUntil = (targetDate: string): number => {
  const target = new Date(targetDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return differenceInDays(target, now);
};

export const formatDate = (date: string, pattern: string = 'yyyy年MM月dd日'): string => {
  return format(new Date(date), pattern, { locale: zhCN });
};

export const formatDateShort = (date: string): string => {
  return format(new Date(date), 'MM/dd');
};

type AnniversaryInput = { id?: string; date: string; title: string; emoji: string };
type AnniversaryWithNext = { id?: string; date: string; title: string; emoji: string; nextDate: Date };

export const getNextAnniversary = (anniversaries: AnniversaryInput[], startDate: string): AnniversaryWithNext[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const allDates: AnniversaryWithNext[] = anniversaries.map(a => {
    const thisYear = new Date(now.getFullYear(), new Date(a.date).getMonth(), new Date(a.date).getDate());
    const nextYear = new Date(now.getFullYear() + 1, new Date(a.date).getMonth(), new Date(a.date).getDate());
    return { ...a, nextDate: isBefore(thisYear, now) ? nextYear : thisYear };
  });
  
  const yearAnniv = new Date(now.getFullYear(), new Date(startDate).getMonth(), new Date(startDate).getDate());
  const nextYearAnniv = new Date(now.getFullYear() + 1, new Date(startDate).getMonth(), new Date(startDate).getDate());
  allDates.push({
    id: 'yearly',
    title: '在一起纪念日',
    emoji: '💕',
    date: startDate,
    nextDate: isAfter(yearAnniv, now) ? yearAnniv : nextYearAnniv
  });
  
  return allDates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
};

export const getTimeUntilUnlock = (unlockDate: string): { days: number; hours: number; minutes: number; seconds: number; isUnlocked: boolean } => {
  const now = new Date();
  const unlock = new Date(unlockDate);
  
  if (isAfter(now, unlock)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
  }
  
  const diff = differenceInSeconds(unlock, now);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  return { days, hours, minutes, seconds, isUnlocked: false };
};

export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};
