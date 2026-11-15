import React from 'react';
import { MachineEntity, WorkerEntity, AgvEntity } from '../../types/simulation';
import {
  X,
  Gauge,
  Thermometer,
  Activity,
  Wrench,
  Users,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';

interface EntityInspectorModalProps {
  entityId: string | null;
  entityType: 'machine' | 'worker' | 'agv' | 'product' | null;
  machines: MachineEntity[];
  workers: WorkerEntity[];
  agvs: AgvEntity[];
  onClose: () => void;
  onUpdateCycleTime: (machineId: string, time: number) => void;
  onUpdateBuffer: (machineId: string, cap: number) => void;
  onAddOperator: (machineId: string) => void;
  onRepairMachine: (machineId: string) => void;
  onTripFault: (machineId: string) => void;
}

export const EntityInspectorModal: React.FC<EntityInspectorModalProps> = ({
  entityId,
  entityType,
  machines,
  workers,
  agvs,
  onClose,
  onUpdateCycleTime,
  onUpdateBuffer,
  onAddOperator,
  onRepairMachine,
  onTripFault
}) => {
  if (!entityId) return null;

  if (entityType === 'machine') {
    const machine = machines.find((m) => m.id === entityId);
    if (!machine) return null;

    const totalTime = Math.max(1, machine.runningTimeSeconds + machine.idleTimeSeconds + machine.starvedTimeSeconds + machine.blockedTimeSeconds + machine.faultTimeSeconds);
    const runPct = Math.round((machine.runningTimeSeconds / totalTime) * 100);
    const blockPct = Math.round((machine.blockedTimeSeconds / totalTime) * 100);
    const starvePct = Math.round((machine.starvedTimeSeconds / totalTime) * 100);

    return (
      <div className="absolute top-20 right-6 w-96 bg-[#FFFCF4] border border-[#E4DDC9] rounded-2xl shadow-xl z-40 select-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
        <div className="bg-[#FBF5E6] border-b border-[#E4DDC9] px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#30356F] bg-[#30356F]/10 px-1.5 py-0.5 rounded">
                {machine.stationCode}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  machine.status === 'running'
                    ? 'bg-[#245B45]/15 text-[#245B45]'
                    : machine.status === 'blocked'
                    ? 'bg-[#B92343]/15 text-[#B92343]'
                    : machine.status === 'starved'
                    ? 'bg-[#D9A441]/15 text-[#9E6F10]'
                    : machine.status === 'fault'
                    ? 'bg-[#B92343] text-[#FBF5E6]'
                    : 'bg-[#5E5E70]/15 text-[#5E5E70]'
                }`}
              >
                {machine.status}
              </span>
            </div>
            <h3 className="font-extrabold text-[#171A35] text-base leading-tight mt-1">{machine.name}</h3>
            <p className="text-[11px] text-[#5E5E70] leading-snug">{machine.subTypeDetails}</p>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-[#E4DDC9] text-[#5E5E70] hover:text-[#171A35] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#FBF5E6] border border-[#E4DDC9] p-2 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#5E5E70] uppercase">
                <Thermometer className="w-3 h-3 text-[#B92343]" />
                <span>Temp</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#171A35] mt-0.5">
                {machine.temperatureC.toFixed(1)}°C
              </div>
            </div>

            <div className="bg-[#FBF5E6] border border-[#E4DDC9] p-2 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#2457C5] uppercase">
                <Activity className="w-3 h-3 text-[#2457C5]" />
                <span>Vibes</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#171A35] mt-0.5">
                {machine.vibrationMmS.toFixed(1)} mm/s
              </div>
            </div>

            <div className="bg-[#FBF5E6] border border-[#E4DDC9] p-2 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#D9A441] uppercase">
                <Gauge className="w-3 h-3 text-[#D9A441]" />
                <span>Wear</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#171A35] mt-0.5">
                {machine.wearLevelPct.toFixed(0)}%
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#5E5E70] font-medium mb-1">
              <span>Operational Duty Cycle</span>
              <span className="font-mono text-[#171A35] font-bold">{runPct}% Active</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E4DDC9] overflow-hidden flex">
              <div className="bg-[#30356F] h-full" style={{ width: `${runPct}%` }} />
              <div className="bg-[#B92343] h-full" style={{ width: `${blockPct}%` }} />
              <div className="bg-[#D9A441] h-full" style={{ width: `${starvePct}%` }} />
            </div>
            <div className="flex justify-between text-[10.5px] text-[#5E5E70] font-mono mt-1">
              <span>Run: {runPct}%</span>
              <span>Block: {blockPct}%</span>
              <span>Starve: {starvePct}%</span>
            </div>
          </div>

          <div className="border-t border-[#E4DDC9] pt-3.5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#171A35] mb-1">
                <span>Cycle Time:</span>
                <span className="font-mono text-[#30356F] font-bold">{machine.cycleTime.toFixed(1)} seconds</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="18.0"
                step="0.5"
                value={machine.cycleTime}
                onChange={(e) => onUpdateCycleTime(machine.id, parseFloat(e.target.value))}
                className="w-full accent-[#30356F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5E5E70] font-mono">
                <span>Fast (2.0s)</span>
                <span>Baseline ({machine.baselineCycleTime.toFixed(1)}s)</span>
                <span>Slow (18.0s)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#171A35] mb-1">
                <span>Input Queue Buffer:</span>
                <span className="font-mono text-[#30356F] font-bold">
                  {machine.queue.length} / {machine.maxQueueCapacity} max
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                step="1"
                value={machine.maxQueueCapacity}
                onChange={(e) => onUpdateBuffer(machine.id, parseInt(e.target.value))}
                className="w-full accent-[#30356F] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-[#FBF5E6] p-2.5 rounded-xl border border-[#E4DDC9]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#30356F]" />
                <div>
                  <div className="text-xs font-bold text-[#171A35]">Assigned Operators</div>
                  <div className="text-[10px] text-[#5E5E70]">
                    Required: {machine.operatorsRequired} · Assigned: {machine.operatorsAssigned}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onAddOperator(machine.id)}
                className="px-2.5 py-1 bg-[#30356F] text-[#FBF5E6] text-xs font-bold rounded-lg hover:bg-[#222650] transition-all"
              >
                +1 Operator
              </button>
            </div>
          </div>

          <div className="border-t border-[#E4DDC9] pt-3 flex items-center gap-2">
            <button
              onClick={() => onRepairMachine(machine.id)}
              className="flex-1 py-1.5 px-3 bg-[#245B45] hover:bg-[#194432] text-[#FBF5E6] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Overhaul Maintenance</span>
            </button>

            <button
              onClick={() => onTripFault(machine.id)}
              className="py-1.5 px-3 bg-[#FBF5E6] hover:bg-[#F3ECE0] text-[#B92343] border border-[#B92343]/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              title="Inject Machine Fault"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trip Fault</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (entityType === 'worker') {
    const worker = workers.find((w) => w.id === entityId);
    if (!worker) return null;

    return (
      <div className="absolute top-20 right-6 w-80 bg-[#FFFCF4] border border-[#E4DDC9] rounded-2xl shadow-xl z-40 select-none overflow-hidden animate-in fade-in duration-200">
        <div className="bg-[#FBF5E6] border-b border-[#E4DDC9] px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#D9A441] bg-[#D9A441]/10 px-1.5 py-0.5 rounded">
              OPERATOR
            </span>
            <h3 className="font-extrabold text-[#171A35] text-base leading-tight mt-1">{worker.name}</h3>
            <p className="text-[11px] text-[#5E5E70]">{worker.role}</p>
          </div>
          <button onClick={onClose} className="text-[#5E5E70] hover:text-[#171A35]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-[#5E5E70] font-medium mb-1">
              <span>Fatigue Level</span>
              <span className="font-mono text-[#171A35] font-bold">{worker.fatiguePct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E4DDC9] overflow-hidden">
              <div
                className={`h-full ${worker.fatiguePct > 75 ? 'bg-[#B92343]' : 'bg-[#D9A441]'}`}
                style={{ width: `${worker.fatiguePct}%` }}
              />
            </div>
          </div>

          <div className="bg-[#FBF5E6] p-2.5 rounded-xl border border-[#E4DDC9] text-xs space-y-1 font-mono">
            <div>
              <span className="text-[#5E5E70]">Status: </span>
              <span className="font-bold text-[#171A35] uppercase">{worker.state}</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Efficiency: </span>
              <span className="font-bold text-[#245B45]">{(worker.efficiencyMultiplier * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Completed Tasks: </span>
              <span className="font-bold text-[#171A35]">{worker.totalTasksCompleted}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (entityType === 'agv') {
    const agv = agvs.find((a) => a.id === entityId);
    if (!agv) return null;

    return (
      <div className="absolute top-20 right-6 w-80 bg-[#FFFCF4] border border-[#E4DDC9] rounded-2xl shadow-xl z-40 select-none overflow-hidden animate-in fade-in duration-200">
        <div className="bg-[#FBF5E6] border-b border-[#E4DDC9] px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#2457C5] bg-[#2457C5]/10 px-1.5 py-0.5 rounded">
              AUTONOMOUS ROBOT
            </span>
            <h3 className="font-extrabold text-[#171A35] text-base leading-tight mt-1">{agv.name}</h3>
            <p className="text-[11px] text-[#5E5E70] font-mono">Status: {agv.status.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-[#5E5E70] hover:text-[#171A35]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-[#5E5E70] font-medium mb-1">
              <span>Battery Level</span>
              <span className="font-mono text-[#245B45] font-bold">{agv.batteryPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E4DDC9] overflow-hidden">
              <div className="h-full bg-[#245B45]" style={{ width: `${agv.batteryPct}%` }} />
            </div>
          </div>

          <div className="bg-[#FBF5E6] p-2.5 rounded-xl border border-[#E4DDC9] text-xs space-y-1 font-mono">
            <div>
              <span className="text-[#5E5E70]">Payload: </span>
              <span className="font-bold text-[#171A35]">{agv.payload ? agv.payload.name : 'Empty Bed'}</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Distance: </span>
              <span className="font-bold text-[#171A35]">{agv.totalDistanceTraveled.toFixed(1)} m</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Speed: </span>
              <span className="font-bold text-[#30356F]">{agv.speed} m/s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
