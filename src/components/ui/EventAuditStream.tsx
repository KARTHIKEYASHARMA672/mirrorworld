import React, { useState } from 'react';
import { OperationalEvent } from '../../types/simulation';
import { ListFilter, ChevronDown, ChevronUp, Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface EventAuditStreamProps {
  events: OperationalEvent[];
  onSelectEntity?: (entityId: string) => void;
}

export const EventAuditStream: React.FC<EventAuditStreamProps> = ({ events, onSelectEntity }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const getEventIcon = (type: OperationalEvent['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#B92343]" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#D9A441]" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#245B45]" />;
      default:
        return <Info className="w-3.5 h-3.5 text-[#30356F]" />;
    }
  };

  return (
    <div className="absolute bottom-16 left-6 z-20 select-none">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-[#FFFCF4]/95 backdrop-blur-md border border-[#E4DDC9] px-3.5 py-2 rounded-xl shadow-xs text-xs font-bold text-[#171A35] hover:bg-[#FBF5E6] transition-all"
      >
        <Bell className="w-3.5 h-3.5 text-[#30356F]" />
        <span>Live Operational Audit Feed</span>
        <span className="bg-[#30356F]/10 text-[#30356F] font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {events.length}
        </span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronUp className="w-3.5 h-3.5 ml-1" />}
      </button>

      {isExpanded && (
        <div className="mt-2 w-96 max-h-72 bg-[#FFFCF4]/95 backdrop-blur-md border border-[#E4DDC9] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-[#FBF5E6] border-b border-[#E4DDC9] p-2 flex items-center gap-1.5 overflow-x-auto text-[10.5px]">
            <span className="text-[#5E5E70] flex items-center gap-1 pl-1">
              <ListFilter className="w-3 h-3" />
            </span>
            {['all', 'bottleneck', 'quality', 'maintenance', 'scenario'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-[#30356F] text-[#FBF5E6]'
                    : 'text-[#5E5E70] hover:text-[#171A35] hover:bg-[#E4DDC9]/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="p-2 space-y-1.5 overflow-y-auto flex-1 font-sans">
            {filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#5E5E70]">No recent events in this category.</div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => evt.entityId && onSelectEntity && onSelectEntity(evt.entityId)}
                  className={`p-2 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                    evt.entityId ? 'cursor-pointer hover:border-[#30356F]' : ''
                  } ${
                    evt.type === 'alert'
                      ? 'bg-[#B92343]/5 border-[#B92343]/20'
                      : evt.type === 'warning'
                      ? 'bg-[#D9A441]/10 border-[#D9A441]/30'
                      : 'bg-[#FFFCF4] border-[#E4DDC9]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getEventIcon(evt.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171A35] truncate text-[11.5px]">{evt.title}</span>
                      <span className="font-mono text-[9.5px] text-[#5E5E70] shrink-0 ml-1">{evt.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#5E5E70] leading-snug mt-0.5">{evt.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
