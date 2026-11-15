import React from 'react';
import { BottleneckDiagnosis } from '../../types/simulation';
import { AlertCircle, CheckCircle2, ArrowRight, Zap, Users, Maximize2, ShieldAlert } from 'lucide-react';

interface BottleneckAdvisorPanelProps {
  diagnosis: BottleneckDiagnosis;
  onApplyRecommendation: (recId: string, actionType: string, targetMachineId: string) => void;
  onFocusMachine: (machineId: string) => void;
}

export const BottleneckAdvisorPanel: React.FC<BottleneckAdvisorPanelProps> = ({
  diagnosis,
  onApplyRecommendation,
  onFocusMachine
}) => {
  const getSeverityBadge = (severity: BottleneckDiagnosis['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="bg-[#B92343]/15 text-[#B92343] border border-[#B92343]/30 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase">Critical Constraint</span>;
      case 'high':
        return <span className="bg-[#D9A441]/15 text-[#9E6F10] border border-[#D9A441]/30 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase">High Constraint</span>;
      case 'medium':
        return <span className="bg-[#30356F]/15 text-[#30356F] border border-[#30356F]/30 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase">Pacing Asset</span>;
      default:
        return <span className="bg-[#245B45]/15 text-[#245B45] border border-[#245B45]/30 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase">Balanced Line</span>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'speed_up':
        return <Zap className="w-4 h-4 text-[#D9A441]" />;
      case 'add_worker':
        return <Users className="w-4 h-4 text-[#2457C5]" />;
      case 'expand_buffer':
        return <Maximize2 className="w-4 h-4 text-[#245B45]" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-[#B92343]" />;
    }
  };

  return (
    <aside className="w-96 bg-[#FFFCF4]/95 backdrop-blur-md border-l border-[#E4DDC9] flex flex-col h-[calc(100vh-4rem)] z-20 overflow-y-auto select-none shadow-xs">
      <div className="p-4 border-b border-[#E4DDC9]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#B92343] animate-ping" />
            <h2 className="font-extrabold text-[#171A35] text-sm tracking-tight">Theory-of-Constraints Diagnostic</h2>
          </div>
          {getSeverityBadge(diagnosis.severity)}
        </div>
        <p className="text-xs text-[#5E5E70] leading-snug">
          Real-time Drum-Buffer-Rope analyzer identifying the active system constraint governing line throughput.
        </p>
      </div>

      <div className="p-4 border-b border-[#E4DDC9] bg-[#FBF5E6]/60">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E70]">Bottleneck Machine</span>
            <h3 className="font-bold text-[#171A35] text-base leading-tight mt-0.5">
              {diagnosis.machineName}
            </h3>
            <span className="font-mono text-xs font-semibold text-[#30356F] bg-[#30356F]/10 px-1.5 py-0.5 rounded mt-1 inline-block">
              {diagnosis.stationCode}
            </span>
          </div>
          {diagnosis.activeConstraintMachineId && (
            <button
              onClick={() => onFocusMachine(diagnosis.activeConstraintMachineId!)}
              className="text-xs font-semibold text-[#30356F] hover:underline flex items-center gap-1 pt-1"
            >
              <span>Orbit View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#5E5E70]">Utilization:</span>
            <span className="font-mono font-bold text-[#171A35]">{diagnosis.utilizationPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E4DDC9] overflow-hidden flex">
            <div
              className="h-full bg-[#30356F]"
              style={{ width: `${diagnosis.utilizationPct}%` }}
              title={`Running: ${diagnosis.utilizationPct}%`}
            />
            <div
              className="h-full bg-[#B92343]"
              style={{ width: `${diagnosis.blockedRatioPct}%` }}
              title={`Blocked: ${diagnosis.blockedRatioPct}%`}
            />
            <div
              className="h-full bg-[#D9A441]"
              style={{ width: `${diagnosis.starvedRatioPct}%` }}
              title={`Starved: ${diagnosis.starvedRatioPct}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#5E5E70] pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#30356F]" />
              <span>Active ({diagnosis.utilizationPct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B92343]" />
              <span>Blocked ({diagnosis.blockedRatioPct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
              <span>Starved ({diagnosis.starvedRatioPct}%)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-[#FFFCF4] border border-[#E4DDC9] rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B92343] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#171A35] leading-tight">{diagnosis.impactSummary}</p>
              <p className="text-[11.5px] text-[#5E5E70] mt-1 leading-relaxed">{diagnosis.rootCauseAnalysis}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#171A35] mb-2.5 flex items-center justify-between">
          <span>Targeted Interventions</span>
          <span className="text-[11px] text-[#5E5E70] font-normal font-mono">{diagnosis.recommendations.length} available</span>
        </h4>

        <div className="space-y-3">
          {diagnosis.recommendations.map((rec) => (\n            <div
              key={rec.id}
              className="bg-[#FBF5E6]/80 hover:bg-[#FBF5E6] border border-[#E4DDC9] hover:border-[#30356F]/40 rounded-xl p-3.5 transition-all shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FFFCF4] border border-[#E4DDC9] shrink-0">
                    {getActionIcon(rec.actionType)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#171A35] leading-snug">{rec.title}</h5>
                    <p className="text-[11.5px] text-[#5E5E70] mt-1 leading-relaxed">{rec.impact}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10.5px] font-mono text-[#171A35] bg-[#E4DDC9]/50 px-2 py-0.5 rounded font-semibold">
                        Cost: {rec.estimatedCost}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onApplyRecommendation(rec.id, rec.actionType, rec.targetMachineId)}
                className="w-full mt-3 py-1.5 px-3 bg-[#30356F] hover:bg-[#222650] text-[#FBF5E6] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>Apply & Test Scenario</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
