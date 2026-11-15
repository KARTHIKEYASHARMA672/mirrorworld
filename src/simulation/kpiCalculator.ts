import { MachineEntity, OperationalKpis, WorkerEntity } from '../types/simulation';

export function calculateOperationalKpis(
  machines: MachineEntity[],
  workers: WorkerEntity[],
  taktTimeSeconds: number = 6.0
): OperationalKpis {
  if (machines.length === 0) {
    return {
      availabilityPct: 100,
      performancePct: 100,
      qualityPct: 100,
      oeePct: 100,
      taktTimeSeconds: 6.0,
      systemThroughputUnitsPerHour: 0,
      wipTotalUnits: 0,
      averageLeadTimeSeconds: 0,
      totalProducedCount: 0,
      totalScrapCount: 0,
      firstPassYieldPct: 100,
      totalEnergyKWh: 0,
      energyCostPerHour: 0,
      laborCostPerHour: 0,
      costPerUnit: 0
    };
  }

  let totalRunningTime = 0;
  let totalTime = 0;
  let totalProcessed = 0;
  let totalDefects = 0;
  let totalPowerKW = 0;
  let totalQueueWIP = 0;

  for (const m of machines) {
    const mTotal = m.runningTimeSeconds + m.idleTimeSeconds + m.starvedTimeSeconds + m.blockedTimeSeconds + m.faultTimeSeconds;
    totalTime += Math.max(1, mTotal);
    totalRunningTime += m.runningTimeSeconds;
    totalProcessed += m.totalProcessedCount;
    totalDefects += m.totalDefectCount;
    totalPowerKW += (m.status === 'running' ? m.energyKW : m.energyKW * 0.15);
    totalQueueWIP += m.queue.length + (m.currentProcessingItem ? 1 : 0);
  }

  const endStation = machines[machines.length - 1];
  const totalProducedCount = endStation ? endStation.totalProcessedCount : 0;
  
  const maxCycleTime = Math.max(...machines.map(m => m.cycleTime));
  const theoreticalMaxThroughput = (3600 / maxCycleTime);
  
  const avgStarvedBlockedRatio = machines.reduce((acc, m) => {
    const mTot = Math.max(1, m.runningTimeSeconds + m.idleTimeSeconds + m.starvedTimeSeconds + m.blockedTimeSeconds + m.faultTimeSeconds);
    return acc + ((m.starvedTimeSeconds + m.blockedTimeSeconds) / mTot);
  }, 0) / machines.length;

  const systemThroughputUnitsPerHour = Math.max(0, Math.round(theoreticalMaxThroughput * (1 - avgStarvedBlockedRatio * 0.6)));

  const availabilityPct = Math.min(100, Math.max(10, Math.round((totalRunningTime / totalTime) * 100)));

  const avgBaseline = machines.reduce((acc, m) => acc + m.baselineCycleTime, 0) / machines.length;
  const avgCurrent = machines.reduce((acc, m) => acc + m.cycleTime, 0) / machines.length;
  const performancePct = Math.min(100, Math.max(10, Math.round((avgBaseline / avgCurrent) * 92)));

  const goodUnits = Math.max(0, totalProcessed - totalDefects);
  const qualityPct = totalProcessed > 0 ? Math.min(100, Math.max(10, Math.round((goodUnits / totalProcessed) * 100))) : 98;
  const firstPassYieldPct = qualityPct;

  const oeePct = Math.min(100, Math.max(5, Math.round((availabilityPct / 100) * (performancePct / 100) * (qualityPct / 100) * 100)));

  const throughputPerSecond = Math.max(0.01, systemThroughputUnitsPerHour / 3600);
  const averageLeadTimeSeconds = Math.round(totalQueueWIP / throughputPerSecond);

  const electricityRatePerKWh = 0.14;
  const totalEnergyKWh = Number((totalPowerKW * 0.85).toFixed(1));
  const energyCostPerHour = Number((totalPowerKW * electricityRatePerKWh).toFixed(2));
  
  const workerHourlyWage = 34.0;
  const laborCostPerHour = Number((workers.length * workerHourlyWage).toFixed(2));

  const totalHourlyCost = energyCostPerHour + laborCostPerHour + 120;
  const costPerUnit = systemThroughputUnitsPerHour > 0 
    ? Number((totalHourlyCost / systemThroughputUnitsPerHour).toFixed(2))
    : 0;

  return {
    availabilityPct,
    performancePct,
    qualityPct,
    oeePct,
    taktTimeSeconds,
    systemThroughputUnitsPerHour,
    wipTotalUnits: totalQueueWIP,
    averageLeadTimeSeconds,
    totalProducedCount,
    totalScrapCount: totalDefects,
    firstPassYieldPct,
    totalEnergyKWh,
    energyCostPerHour,
    laborCostPerHour,
    costPerUnit
  };
}
