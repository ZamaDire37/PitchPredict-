import React, { useState } from 'react';
import { useTimezone, POPULAR_TIMEZONES } from '../context/TimezoneContext';
import { Globe, Clock, Check, Sparkles, X, MapPin } from 'lucide-react';

interface TimezoneModalProps {
  onClose: () => void;
}

export const TimezoneModal: React.FC<TimezoneModalProps> = ({ onClose }) => {
  const { timezone, isAuto, setTimezone, timezoneAbbr } = useTimezone();
  const [selectedTz, setSelectedTz] = useState(isAuto ? 'AUTO' : timezone);
  const now = new Date();

  const handleSelect = (id: string) => {
    setSelectedTz(id);
    setTimezone(id);
    setTimeout(() => onClose(), 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Fixture Timezone Settings</h2>
              <p className="text-xs text-slate-400">Match kickoff times will automatically adjust to your selected region</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Info Bar */}
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border-b border-cyan-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400">Current View: </span>
              <strong className="text-cyan-300 font-mono font-bold">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({timezoneAbbr})
              </strong>
            </div>
          </div>
          {isAuto && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              Auto Device Sync
            </span>
          )}
        </div>

        {/* List of Timezones */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 overscroll-contain">
          {POPULAR_TIMEZONES.map((tz) => {
            const isCurrentlySelected = tz.id === 'AUTO' ? isAuto : timezone === tz.iana;

            let liveSampleTime = '';
            try {
              if (tz.id === 'AUTO') {
                liveSampleTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                liveSampleTime = new Intl.DateTimeFormat([], {
                  timeZone: tz.iana,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).format(now);
              }
            } catch {
              liveSampleTime = '--:--';
            }

            return (
              <button
                key={tz.id}
                onClick={() => handleSelect(tz.id)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isCurrentlySelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrentlySelected
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCurrentlySelected ? <Check className="w-4 h-4 stroke-[3]" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{tz.label}</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">{tz.region}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-cyan-300">{liveSampleTime}</div>
                  <div className="text-[10px] text-slate-500">Kickoff Time</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>All prediction locks remain synchronized with global kickoffs.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
