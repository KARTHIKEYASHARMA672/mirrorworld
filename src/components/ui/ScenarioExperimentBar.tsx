import React from 'react';
import { ScenarioComparison } from '../../types/simulation';
import { TrendingUp, TrendingDown, Check, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScenarioExperimentBarProps {
  scenario: ScenarioComparison;
  onCommitBaseline: () => void;
  onResetBaseline: () => void;
}

export const ScenarioExperimentBar: React.FC<ScenarioExperimentBarProps> = ({
  scenario,
  onCommitBaseline,
  onResetBaseline
}) => {
  if (!scenario.isExperimentActive) return null;

  const handleCommit = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#30356F', '#D9A441', '#245B45', '#FBF5E6']
    });
    onCommitBaseline();
  };

  const renderDelta = (val: number, inverseGood: boolean = false) => {
    const isPositive = val > 0;
    const isGood = inverseGood ? !isPositive : isPositive;

    if (val === 0) {
      return <span className="text-[#5E5E70] font-mono text-xs">0%</span>;
    }

    return (
      <span
        className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${
          isGood ? 'text-emerald-300' : 'text-rose-300'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isPositive ? `+${val}%` : `${val}%`}</span>
      </span>
    );
  };

  return (
    <div className="bg-[#30356F] text-[#FBF5E6] px-4 py-2.5 flex items-center justify-between border-b border-[#222650] select-none z-30 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-[#D9A441] text-[#171A35]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs tracking-wide uppercase">What-If Operational Sandbox Active</span>
            <span className="text-[10px] bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40 px-1.5 py-0.2 rounded font-mono">
              COMPARING VS BASELINE
            </span>
          </div>
          <p className="text-[11px] text-[#E4DDC9]/80">
            Testing layout & cycle changes without disrupting physical line operations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 bg-[#222650]/80 border border-[#3A4080] px-4 py-1.5 rounded-xl">
        <div className="text-center">
          <span className="text-[10px] uppercase text-[#E4DDC9]/70 font-semibold block">Throughput</span>
          {renderDelta(scenario.deltas.throughputPct, false)}
        </div>

        <div className="w-px h-6 bg-[#3A4080]" />

        <div className="text-center">
          <span className="text-[10px] uppercase text-[#E4DDC9]/70 font-semibold block">Lead Time</span>
          {renderDelta(scenario.deltas.leadTimePct, true)}
        </div>

        <div className="w-px h-6 bg-[#3A4080]" />

        <div className="text-center">
          <span className="text-[10px] uppercase text-[#E4DDC9]/70 font-semibold block">WIP Queue</span>
          {renderDelta(scenario.deltas.wipPct, true)}
        </div>

        <div className="w-px h-6 bg-[#3A4080]" />

        <div className="text-center">
          <span className="text-[10px] uppercase text-[#E4DDC9]/70 font-semibold block">Cost/Unit</span>
          {renderDelta(scenario.deltas.costPerUnitPct, true)}
        </div>

        <div className="w-px h-6 bg-[#3A4080]" />

        <div className="text-center">
          <span className="text-[10px] uppercase text-[#E4DDC9]/70 font-semibold block">OEE Impact</span>
          {renderDelta(scenario.deltas.oeePct, false)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCommit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#245B45] hover:bg-[#194432] text-xs font-bold text-[#FBF5E6] transition-all shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Commit as Production Baseline</span>
        </button>

        <button
          onClick={onResetBaseline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A35] hover:bg-[#101224] text-xs font-semibold text-[#E4DDC9] border border-[#3A4080] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Discard & Revert</span>
        </button>
      </div>
    </div>
  );
};
