import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface TimezoneOption {
  id: string;
  label: string;
  region: string;
  iana: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { id: 'AUTO', label: 'Auto-Detect (Device Timezone)', region: 'Local Device', iana: '' },
  { id: 'UTC', label: 'UTC (Universal Coordinated Time)', region: 'Universal', iana: 'UTC' },
  { id: 'Europe/London', label: 'London, Dublin (GMT/BST)', region: 'United Kingdom', iana: 'Europe/London' },
  { id: 'Europe/Paris', label: 'Paris, Berlin, Madrid, Rome (CET)', region: 'Central Europe', iana: 'Europe/Paris' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg, Cape Town (SAST / GMT+2)', region: 'Southern Africa', iana: 'Africa/Johannesburg' },
  { id: 'Africa/Lagos', label: 'Lagos, Accra (WAT / GMT+1)', region: 'West Africa', iana: 'Africa/Lagos' },
  { id: 'Africa/Nairobi', label: 'Nairobi, Kampala (EAT / GMT+3)', region: 'East Africa', iana: 'Africa/Nairobi' },
  { id: 'Africa/Cairo', label: 'Cairo (EET / GMT+2)', region: 'North Africa', iana: 'Africa/Cairo' },
  { id: 'America/New_York', label: 'New York, Toronto (ET)', region: 'North America (East)', iana: 'America/New_York' },
  { id: 'America/Chicago', label: 'Chicago, Mexico City (CT)', region: 'North America (Central)', iana: 'America/Chicago' },
  { id: 'America/Los_Angeles', label: 'Los Angeles, Vancouver (PT)', region: 'North America (West)', iana: 'America/Los_Angeles' },
  { id: 'America/Sao_Paulo', label: 'São Paulo, Rio (BRT)', region: 'South America (Brazil)', iana: 'America/Sao_Paulo' },
  { id: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'South America (Argentina)', iana: 'America/Buenos_Aires' },
  { id: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (GST / GMT+4)', region: 'Middle East', iana: 'Asia/Dubai' },
  { id: 'Asia/Kolkata', label: 'New Delhi, Mumbai (IST / GMT+5:30)', region: 'South Asia', iana: 'Asia/Kolkata' },
  { id: 'Asia/Singapore', label: 'Singapore, Kuala Lumpur (SGT)', region: 'Southeast Asia', iana: 'Asia/Singapore' },
  { id: 'Asia/Tokyo', label: 'Tokyo, Seoul (JST / GMT+9)', region: 'East Asia', iana: 'Asia/Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney, Melbourne (AEST)', region: 'Australia', iana: 'Australia/Sydney' },
];

interface TimezoneContextType {
  timezone: string;
  isAuto: boolean;
  timezoneLabel: string;
  timezoneAbbr: string;
  tzOffsetMinutes: number;
  clientTodayYmd: string;
  setTimezone: (tz: string) => void;
  formatTime: (utcDateStr: string, options?: { showAbbr?: boolean }) => string;
  formatDate: (utcDateStr: string) => string;
  formatDayPrefix: (utcDateStr: string) => string;
  formatFullDateTime: (utcDateStr: string) => string;
  formatKickoffParts: (utcDateStr: string) => {
    datePrefix: string;
    timeDisplay: string;
    tzAbbr: string;
    fullDisplay: string;
  };
  isToday: (utcDateStr: string) => boolean;
  isTomorrow: (utcDateStr: string) => boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Helper to get YYYY-MM-DD for a Date object in a specific timezone
function getYmdInTimezone(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

// Helper to get timezone abbreviation (e.g. SAST, GMT+2, EDT)
function getTimezoneAbbreviation(d: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(d);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// Calculate offset in minutes between UTC and target timezone for a date
function getTimezoneOffsetMinutes(d: Date, tz: string): number {
  try {
    // Format UTC and local in minutes
    const utcParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(d);

    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(d);

    const getVal = (parts: Intl.DateTimeFormatPart[], type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

    const utcD = Date.UTC(
      getVal(utcParts, 'year'),
      getVal(utcParts, 'month') - 1,
      getVal(utcParts, 'day'),
      getVal(utcParts, 'hour'),
      getVal(utcParts, 'minute')
    );

    const tzD = Date.UTC(
      getVal(tzParts, 'year'),
      getVal(tzParts, 'month') - 1,
      getVal(tzParts, 'day'),
      getVal(tzParts, 'hour'),
      getVal(tzParts, 'minute')
    );

    return Math.round((tzD - utcD) / (60 * 1000));
  } catch {
    return 0;
  }
}

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [savedPreference, setSavedPreference] = useState<string>(() => {
    try {
      return localStorage.getItem('pitchpredict_user_timezone') || 'AUTO';
    } catch {
      return 'AUTO';
    }
  });

  // Automatically use the viewer's device timezone for all kickoff times and date filtering
  const isAuto = true;
  const activeTimezone = systemTimezone;

  const now = new Date();
  const tzAbbr = useMemo(() => getTimezoneAbbreviation(now, activeTimezone), [activeTimezone]);
  const tzOffsetMinutes = useMemo(() => getTimezoneOffsetMinutes(now, activeTimezone), [activeTimezone]);
  const clientTodayYmd = useMemo(() => getYmdInTimezone(now, activeTimezone), [activeTimezone]);

  const setTimezone = (tz: string) => {
    setSavedPreference(tz);
    try {
      localStorage.setItem('pitchpredict_user_timezone', tz);
    } catch (e) {
      console.warn('Failed to save timezone preference:', e);
    }
  };

  const timezoneLabel = useMemo(() => {
    const found = POPULAR_TIMEZONES.find((t) => (t.id === 'AUTO' ? isAuto : t.iana === activeTimezone));
    if (isAuto) {
      return `${systemTimezone} (${tzAbbr})`;
    }
    return found ? `${found.label}` : `${activeTimezone} (${tzAbbr})`;
  }, [isAuto, systemTimezone, activeTimezone, tzAbbr]);

  const formatTime = (utcDateStr: string, options: { showAbbr?: boolean } = { showAbbr: false }): string => {
    try {
      const d = new Date(utcDateStr);
      const timeStr = new Intl.DateTimeFormat([], {
        timeZone: activeTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
      if (options.showAbbr && tzAbbr) {
        return `${timeStr} ${tzAbbr}`;
      }
      return timeStr;
    } catch {
      return utcDateStr;
    }
  };

  const formatDate = (utcDateStr: string): string => {
    try {
      const d = new Date(utcDateStr);
      return new Intl.DateTimeFormat([], {
        timeZone: activeTimezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return utcDateStr;
    }
  };

  const isToday = (utcDateStr: string): boolean => {
    try {
      const d = new Date(utcDateStr);
      const matchYmd = getYmdInTimezone(d, activeTimezone);
      const nowYmd = getYmdInTimezone(new Date(), activeTimezone);
      return matchYmd === nowYmd;
    } catch {
      return false;
    }
  };

  const isTomorrow = (utcDateStr: string): boolean => {
    try {
      const d = new Date(utcDateStr);
      const matchYmd = getYmdInTimezone(d, activeTimezone);
      const tomorrowDate = new Date(Date.now() + 24 * 3600 * 1000);
      const tomorrowYmd = getYmdInTimezone(tomorrowDate, activeTimezone);
      return matchYmd === tomorrowYmd;
    } catch {
      return false;
    }
  };

  const formatDayPrefix = (utcDateStr: string): string => {
    if (isToday(utcDateStr)) return 'Today';
    if (isTomorrow(utcDateStr)) return 'Tomorrow';
    return formatDate(utcDateStr);
  };

  const formatFullDateTime = (utcDateStr: string): string => {
    const prefix = formatDayPrefix(utcDateStr);
    const time = formatTime(utcDateStr, { showAbbr: true });
    return `${prefix} at ${time}`;
  };

  const formatKickoffParts = (utcDateStr: string) => {
    const datePrefix = formatDayPrefix(utcDateStr);
    const timeDisplay = formatTime(utcDateStr);
    return {
      datePrefix,
      timeDisplay,
      tzAbbr,
      fullDisplay: `${datePrefix} ${timeDisplay} ${tzAbbr}`.trim(),
    };
  };

  return (
    <TimezoneContext.Provider
      value={{
        timezone: activeTimezone,
        isAuto,
        timezoneLabel,
        timezoneAbbr: tzAbbr,
        tzOffsetMinutes,
        clientTodayYmd,
        setTimezone,
        formatTime,
        formatDate,
        formatDayPrefix,
        formatFullDateTime,
        formatKickoffParts,
        isToday,
        isTomorrow,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
