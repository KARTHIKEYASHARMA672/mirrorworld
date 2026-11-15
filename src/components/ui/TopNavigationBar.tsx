import React from 'react';
import {
  Factory,
  Warehouse,
  Play,
  Pause,
  Camera,
  Layers,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  UserX,
  TrendingUp,
  Cpu
} from 'lucide-react';
import type { FacilityType, CameraMode, ViewOverlayMode } from '../../types/simulation';

interface TopNavigationBarProps {
  facility: FacilityType;
  onFacilityChange: (f: FacilityType) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  simClockSeconds: number;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  overlayMode: ViewOverlayMode;
  onOverlayModeChange: (mode: ViewOverlayMode) => void;
  isExperimentActive: boolean;
  onToggleExperiment: () => void;
  onResetBaseline: () => void;
  onInjectBreakdown: () => void;
  onInjectDemandSpike: () => void;
  onInjectWorkerCallout: () => void;
}

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  facility,
  onFacilityChange,
  isRunning,
  onTogglePlay,
  speedMultiplier,
  onSpeedChange,
  simClockSeconds,
  cameraMode,
  onCameraModeChange,
  overlayMode,
  onOverlayModeChange,
  isExperimentActive,
  onToggleExperiment,
  onResetBaseline,
  onInjectBreakdown,
  onInjectDemandSpike,
  onInjectWorkerCallout
}) => {
  const formatClock = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 w-full bg-[#FFFCF4]/95 backdrop-blur-md border-b border-[#E4DDC9] px-4 flex items-center justify-between z-30 select-none shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#30356F] flex items-center justify-center text-[#FBF5E6] shadow-sm">
            <Cpu className="w-5 h-5 text-[#D9A441]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-[#171A35] text-sm">MIRRORWORLD</span>
              <span className="text-[10px] font-bold bg-[#30356F]/10 text-[#30356F] px-1.5 py-0.5 rounded">v2.4 TWIN</span>
            </div>
            <p className="text-[10.5px] text-[#5E5E70] leading-none">Virtual Reality & Operational Simulation</p>
          </div>
        </div>

        <div className="flex items-center bg-[#F3ECE0] p-1 rounded-xl border border-[#E4DDC9] ml-2">
          <button
            onClick={() => onFacilityChange('factory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              facility === 'factory'
                ? 'bg-[#30356F] text-[#FBF5E6] shadow-xs'
                : 'text-[#5E5E70] hover:text-[#171A35]'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Assembly Plant</span>
          </button>
          <button
            onClick={() => onFacilityChange('warehouse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              facility === 'warehouse'
                ? 'bg-[#30356F] text-[#FBF5E6] shadow-xs'
                : 'text-[#5E5E70] hover:text-[#171A35]'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Smart Warehouse</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-[#F3ECE0] px-3 py-1.5 rounded-xl border border-[#E4DDC9] flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E70]">Sim Clock:</span>
          <span className="font-mono text-xs font-bold text-[#171A35]">{formatClock(simClockSeconds)}</span>
        </div>

        <button
          onClick={onTogglePlay}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-xs ${
            isRunning
              ? 'bg-[#245B45] text-[#FBF5E6] hover:bg-[#194432]'
              : 'bg-[#B92343] text-[#FBF5E6] hover:bg-[#8F1933]'
          }`}
          title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex items-center bg-[#F3ECE0] p-1 rounded-xl border border-[#E4DDC9]">
          {[0.5, 1.0, 2.0, 5.0].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                speedMultiplier === s
                  ? 'bg-[#30356F] text-[#FBF5E6]'
                  : 'text-[#5E5E70] hover:text-[#171A35]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center bg-[#F3ECE0] p-1 rounded-xl border border-[#E4DDC9]">
          <button
            onClick={() => onOverlayModeChange('standard')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              overlayMode === 'standard' ? 'bg-[#30356F] text-[#FBF5E6]' : 'text-[#5E5E70] hover:text-[#171A35]'
            }`}
            title="Realistic Materials"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PBR</span>
          </button>
          <button
            onClick={() => onOverlayModeChange('bottleneck_heatmap')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              overlayMode === 'bottleneck_heatmap' ? 'bg-[#B92343] text-[#FBF5E6]' : 'text-[#5E5E70] hover:text-[#171A35]'
            }`}
            title="Highlight Bottlenecks & Starvation"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Bottleneck Heatmap</span>
          </button>
          <button
            onClick={() => onOverlayModeChange('energy_thermal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              overlayMode === 'energy_thermal' ? 'bg-[#D9A441] text-[#171A35]' : 'text-[#5E5E70] hover:text-[#171A35]'
            }`}
            title="Thermal & Power Distribution"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Thermal</span>
          </button>
        </div>

        <div className="relative">
          <select
            value={cameraMode}
            onChange={(e) => onCameraModeChange(e.target.value as CameraMode)}
            className="bg-[#F3ECE0] border border-[#E4DDC9] text-xs font-semibold text-[#171A35] rounded-xl px-2.5 py-1.5 appearance-none pr-7 cursor-pointer hover:border-[#30356F] transition-all focus:outline-hidden"
          >
            <option value="god_view">🎥 God View (Tactical Orbit)</option>
            <option value="first_person">🚶 First-Person Operator (WASD)</option>
            <option value="product_follow">📦 Follow Product Cam</option>
            <option value="entity_orbit">🎯 Entity Lock Track</option>
            <option value="vr_spatial">🥽 VR Spatial Mode</option>
          </select>
          <Camera className="w-3.5 h-3.5 text-[#5E5E70] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F3ECE0] text-[#171A35] border border-[#E4DDC9] hover:bg-[#EAE1D2] transition-all">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Inject Chaos</span>
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#FFFCF4] border border-[#E4DDC9] rounded-xl shadow-lg p-1.5 hidden group-hover:block z-50">
            <button
              onClick={onInjectBreakdown}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[#F3ECE0] text-[#B92343] font-semibold flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Machine Fault</span>
            </button>
            <button
              onClick={onInjectDemandSpike}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[#F3ECE0] text-[#171A35] font-semibold flex items-center gap-2"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#245B45]" />
              <span>Demand Surge (+54%)</span>
            </button>
            <button
              onClick={onInjectWorkerCallout}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[#F3ECE0] text-[#5E5E70] font-semibold flex items-center gap-2"
            >
              <UserX className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>Operator Absenteeism</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleExperiment}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isExperimentActive
                ? 'bg-[#B92343] text-[#FBF5E6] ring-2 ring-[#B92343]/30'
                : 'bg-[#30356F] text-[#FBF5E6] hover:bg-[#222650]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isExperimentActive ? 'Experiment Active' : 'Start What-If'}</span>
          </button>

          {isExperimentActive && (
            <button
              onClick={onResetBaseline}
              className="w-8 h-8 rounded-xl bg-[#F3ECE0] hover:bg-[#E4DDC9] border border-[#E4DDC9] flex items-center justify-center text-[#5E5E70] hover:text-[#171A35] transition-all"
              title="Reset to Factory Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
