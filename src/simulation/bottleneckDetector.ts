import { MachineEntity, BottleneckDiagnosis, FacilityType } from '../types/simulation';

export function analyzeBottlenecks(
  machines: MachineEntity[],
  facility: FacilityType,
  taktTimeSeconds: number = 6.0
): BottleneckDiagnosis {
  if (machines.length === 0) {
    return {
      activeConstraintMachineId: null,
      machineName: 'None',
      stationCode: 'N/A',
      constraintType: 'cycle_time',
      severity: 'low',
      impactSummary: 'Facility operating with balanced flow.',
      rootCauseAnalysis: 'No active constraint detected.',
      utilizationPct: 0,
      starvedRatioPct: 0,
      blockedRatioPct: 0,
      wipQueueSize: 0,
      recommendations: []
    };
  }

  let highestScore = -1;
  let constraintMachine: MachineEntity = machines[0];
  let constraintType: BottleneckDiagnosis['constraintType'] = 'cycle_time';
  let severity: BottleneckDiagnosis['severity'] = 'medium';

  for (let i = 0; i < machines.length; i++) {
    const m = machines[i];
    const totalTime = Math.max(1, m.runningTimeSeconds + m.idleTimeSeconds + m.starvedTimeSeconds + m.blockedTimeSeconds + m.faultTimeSeconds);
    const utilization = m.runningTimeSeconds / totalTime;
    const starvedRatio = m.starvedTimeSeconds / totalTime;
    const blockedRatio = m.blockedTimeSeconds / totalTime;
    
    const downstream = machines[i + 1];
    const downstreamStarved = downstream ? (downstream.starvedTimeSeconds / totalTime) : 0;
    
    const upstream = machines[i - 1];
    const upstreamBlocked = upstream ? (upstream.blockedTimeSeconds / totalTime) : 0;

    const queueFillRatio = m.queue.length / Math.max(1, m.maxQueueCapacity);
    const cycleTimeRatio = m.cycleTime / taktTimeSeconds;

    let score = (cycleTimeRatio * 0.35) + 
                (utilization * 0.25) + 
                (upstreamBlocked * 0.20) + 
                (downstreamStarved * 0.15) + 
                (queueFillRatio * 0.15) - 
                (starvedRatio * 0.30);

    if (m.operatorsRequired > m.operatorsAssigned) {
      score += 0.3;
    }

    if (m.wearLevelPct > 70) {
      score += 0.15;
    }

    if (score > highestScore) {
      highestScore = score;
      constraintMachine = m;

      if (m.operatorsRequired > m.operatorsAssigned) {
        constraintType = 'worker_shortage';
        severity = 'high';
      } else if (m.wearLevelPct > 70 || m.status === 'fault') {
        constraintType = 'maintenance_risk';
        severity = 'critical';
      } else if (m.queue.length >= m.maxQueueCapacity && upstreamBlocked > 0.15) {
        constraintType = 'buffer_blocking';
        severity = 'high';
      } else if (m.cycleTime > taktTimeSeconds * 1.3) {
        constraintType = 'cycle_time';
        severity = m.cycleTime > taktTimeSeconds * 1.8 ? 'critical' : 'high';
      } else {
        constraintType = 'cycle_time';
        severity = 'medium';
      }
    }
  }

  const totalTime = Math.max(1, constraintMachine.runningTimeSeconds + constraintMachine.idleTimeSeconds + constraintMachine.starvedTimeSeconds + constraintMachine.blockedTimeSeconds + constraintMachine.faultTimeSeconds);
  const utilizationPct = Math.round((constraintMachine.runningTimeSeconds / totalTime) * 100);
  const starvedRatioPct = Math.round((constraintMachine.starvedTimeSeconds / totalTime) * 100);
  const blockedRatioPct = Math.round((constraintMachine.blockedTimeSeconds / totalTime) * 100);
  const wipQueueSize = constraintMachine.queue.length;

  let impactSummary = '';
  let rootCauseAnalysis = '';
  const recommendations: BottleneckDiagnosis['recommendations'] = [];

  if (facility === 'factory') {
    if (constraintMachine.id === 'm-stn-03') {
      impactSummary = `Station 3 (${constraintMachine.name}) is governing line pace. Cycle time (${constraintMachine.cycleTime.toFixed(1)}s) exceeds target takt time (${taktTimeSeconds.toFixed(1)}s).`;
      rootCauseAnalysis = `5-axis precision milling pass requires heavy metal removal. Upstream SMT experiences backpressure (${blockedRatioPct}% blocked) while downstream robotic welder is frequently starved.`;
      
      recommendations.push({
        id: 'rec-01',
        title: 'Overclock CNC Feed Rate (+20% RPM)',
        actionType: 'speed_up',
        impact: 'Reduces cycle time from 12.0s to 9.6s, boosting line throughput by +24%',
        estimatedCost: '$0 (Tool wear +8%)',
        targetMachineId: constraintMachine.id
      });
      recommendations.push({
        id: 'rec-02',
        title: 'Add Parallel Twin CNC Milling Bay',
        actionType: 'parallel_machine',
        impact: 'Splits cycle time in half (6.0s), fully unblocking upstream SMT and eliminating robotic welder starvation',
        estimatedCost: '$85,000 CapEx',
        targetMachineId: constraintMachine.id
      });
      recommendations.push({
        id: 'rec-03',
        title: 'Expand Infeed Buffer (6 -> 12 units)',
        actionType: 'expand_buffer',
        impact: 'Prevents SMT station from stalling during micro-tool changes',
        estimatedCost: '$1,200',
        targetMachineId: constraintMachine.id
      });
    } else {
      impactSummary = `${constraintMachine.name} [${constraintMachine.stationCode}] is operating at ${utilizationPct}% utilization.`;
      rootCauseAnalysis = `WIP queue (${wipQueueSize} items) indicates localized accumulation. Downstream stations starved for ${starvedRatioPct}% of observed runtime.`;
      recommendations.push({
        id: 'rec-gen-01',
        title: 'Optimize Cycle Time & Feeds',
        actionType: 'speed_up',
        impact: 'Increases processing speed to align with line takt time',
        estimatedCost: '$2,500',
        targetMachineId: constraintMachine.id
      });
    }
  } else {
    if (constraintMachine.id.includes('pick-mezzanine')) {
      impactSummary = `Manual Pick Station (${constraintMachine.name}) has become the throughput bottleneck for parcel dispatch.`;
      rootCauseAnalysis = `Manual item retrieval and tote verification takes ${constraintMachine.cycleTime.toFixed(1)}s per order. Cross-belt sorter is running starved (${starvedRatioPct}% idle waiting for pick releases).`;
      
      recommendations.push({
        id: 'rec-wh-01',
        title: 'Deploy Automated Pick-to-Light Guided System',
        actionType: 'speed_up',
        impact: 'Cuts manual pick search time by 42% (cycle time down to 6.8s)',
        estimatedCost: '$14,000',
        targetMachineId: constraintMachine.id
      });
      recommendations.push({
        id: 'rec-wh-02',
        title: 'Reassign Second Worker to Parallel Pick Zone',
        actionType: 'add_worker',
        impact: 'Doubles picking throughput, reducing order queue buildup by 55%',
        estimatedCost: '$28/hour labor',
        targetMachineId: constraintMachine.id
      });
    } else {
      impactSummary = `${constraintMachine.name} is the pacing asset in the fulfillment sequence.`;
      rootCauseAnalysis = `Buffer accumulation and transit handoffs cause intermittent queue stalls.`;
      recommendations.push({
        id: 'rec-wh-gen-01',
        title: 'Dynamic AGV Dispatch Prioritization',
        actionType: 'speed_up',
        impact: 'Routes AMR fleet directly to high-queue racking aisles',
        estimatedCost: 'Software config ($0)',
        targetMachineId: constraintMachine.id
      });
    }
  }

  return {
    activeConstraintMachineId: constraintMachine.id,
    machineName: constraintMachine.name,
    stationCode: constraintMachine.stationCode,
    constraintType,
    severity,
    impactSummary,
    rootCauseAnalysis,
    utilizationPct,
    starvedRatioPct,
    blockedRatioPct,
    wipQueueSize,
    recommendations
  };
}
