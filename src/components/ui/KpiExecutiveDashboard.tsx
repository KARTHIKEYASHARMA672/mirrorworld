import React from 'react';
import { OperationalKpis, MachineEntity } from '../../types/simulation';
import { Activity, Gauge, DollarSign, Clock, PackageCheck, Zap } from 'lucide-react';

interface KpiExecutiveDashboardProps {
  kpis: OperationalKpis;
  machines: MachineEntity[];
}

export const KpiExecutiveDashboard: React.FC<KpiExecutiveDashboardProps> = ({
  kpis,
  machines
}) => {
  return (
    <div className="bg-[#FFFCF4]/95 backdrop-blur-md border-t border-[#E4DDC9] px-4 py-3 select-none z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-3.5 items-center">
        <div className="bg-[#FBF5E6]/80 border border-[#E4DDC9] rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#5E5E70]">
              <Gauge className="w-3.5 h-3.5 text-[#30356F]" />
              <span>Overall OEE</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-[#171A35] mt-0.5">
              {kpis.oeePct}%
            </div>
            <div className="text-[10px] text-[#245B45] font-semibold mt-0.5">
              Target: ≥85.0%
            </div>
          </div>

          <div className="text-right space-y-0.5 text-[11px] font-mono border-l border-[#E4DDC9] pl-3">
            <div>
              <span className="text-[#5E5E70]">Avail: </span>
              <span className="font-bold text-[#171A35]">{kpis.availabilityPct}%</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Perf: </span>
              <span className="font-bold text-[#171A35]">{kpis.performancePct}%</span>
            </div>
            <div>
              <span className="text-[#5E5E70]">Qual: </span>
              <span className="font-bold text-[#245B45]">{kpis.qualityPct}%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FBF5E6]/80 border border-[#E4DDC9] rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#5E5E70]">
              <Activity className="w-3.5 h-3.5 text-[#2457C5]" />
              <span>Line Throughput</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-[#171A35] mt-0.5">
              {kpis.systemThroughputUnitsPerHour} <span className="text-xs font-normal text-[#5E5E70]">u/hr</span>
            </div>
            <div className="text-[10.5px] text-[#5E5E70] font-mono mt-0.5">
              WIP: <span className="font-bold text-[#171A35]">{kpis.wipTotalUnits} units</span>
            </div>
          </div>

          <div className="text-right border-l border-[#E4DDC9] pl-3">
            <span className="text-[10px] font-bold text-[#5E5E70] uppercase">Avg Flow Time</span>
            <div className="text-sm font-bold font-mono text-[#171A35]">
              {kpis.averageLeadTimeSeconds}s
            </div>
            <span className="text-[10px] text-[#5E5E70]">Little's Law Eq</span>
          </div>
        </div>

        <div className="bg-[#FBF5E6]/80 border border-[#E4DDC9] rounded-xl p-2.5 col-span-1 md:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-[#5E5E70] uppercase mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>Station Cycle Time vs Takt ({kpis.taktTimeSeconds.toFixed(1)}s)</span>
            </div>
            <span className="font-mono text-[#B92343] font-bold text-[10px]">Red = Exceeds Takt</span>
          </div>

          <div className="flex items-end gap-1.5 h-10 w-full pt-1">
            {machines.map((m) => {
              const exceedsTakt = m.cycleTime > kpis.taktTimeSeconds;
              const heightPct = Math.min(100, Math.max(15, (m.cycleTime / 14.0) * 100));

              return (
                <div key={m.id} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-7 hidden group-hover:block bg-[#171A35] text-[#FBF5E6] text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                    {m.stationCode}: {m.cycleTime.toFixed(1)}s
                  </div>

                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      exceedsTakt ? 'bg-[#B92343]' : 'bg-[#30356F]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-[#5E5E70] truncate w-full text-center mt-0.5">
                    {m.stationCode.replace('STN-', '').replace('WH-', '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#FBF5E6]/80 border border-[#E4DDC9] rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#5E5E70]">
              <PackageCheck className="w-3.5 h-3.5 text-[#245B45]" />
              <span>Finished Goods</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-[#171A35] mt-0.5">
              {kpis.totalProducedCount} <span className="text-xs font-normal text-[#5E5E70]">units</span>
            </div>
            <div className="text-[10px] text-[#5E5E70] font-mono">
              Scrap: <span className="text-[#B92343] font-bold">{kpis.totalScrapCount}</span> ({kpis.firstPassYieldPct}% FPY)
            </div>
          </div>

          <div className="text-right border-l border-[#E4DDC9] pl-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#5E5E70] uppercase">
              <DollarSign className="w-3 h-3 text-[#245B45]" />
              <span>Cost/Unit</span>
            </div>
            <div className="text-sm font-extrabold font-mono text-[#171A35]">
              ${kpis.costPerUnit.toFixed(2)}
            </div>
            <div className="text-[9.5px] text-[#5E5E70] flex items-center gap-0.5 font-mono">
              <Zap className="w-2.5 h-2.5 text-[#D9A441]" />
              <span>{kpis.totalEnergyKWh} kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
