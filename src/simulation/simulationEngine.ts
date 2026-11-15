import {
  FacilityType,
  MachineEntity,
  WorkerEntity,
  AgvEntity,
  ConveyorSegment,
  ProductItem,
  OperationalEvent,
  ScenarioComparison
} from '../types/simulation';
import {
  getInitialFactoryMachines,
  getInitialFactoryWorkers,
  getInitialFactoryConveyors
} from './factoryLayout';
import {
  getInitialWarehouseMachines,
  getInitialWarehouseWorkers,
  getInitialWarehouseAgvs,
  getInitialWarehouseConveyors
} from './warehouseLayout';
import { analyzeBottlenecks } from './bottleneckDetector';
import { calculateOperationalKpis } from './kpiCalculator';

export class SimulationEngine {
  public facility: FacilityType = 'factory';
  public isRunning: boolean = true;
  public speedMultiplier: number = 1.0;
  public simClockSeconds: number = 0;
  
  public machines: MachineEntity[] = [];
  public workers: WorkerEntity[] = [];
  public agvs: AgvEntity[] = [];
  public conveyors: ConveyorSegment[] = [];
  public activeProducts: ProductItem[] = [];
  public completedProducts: ProductItem[] = [];
  
  public events: OperationalEvent[] = [];
  public selectedEntityId: string | null = null;
  public selectedEntityType: 'machine' | 'worker' | 'agv' | 'product' | null = null;
  
  // What-If Scenario State
  public isExperimentActive: boolean = false;
  public baselineSnapshot: {
    machines: MachineEntity[];
    workers: WorkerEntity[];
    throughput: number;
    leadTime: number;
    wip: number;
    costPerUnit: number;
    oee: number;
  } | null = null;

  private productSerial: number = 100;
  private eventSerial: number = 1;
  private spawnTimer: number = 0;
  private taktTimeSeconds: number = 6.0;

  constructor(facility: FacilityType = 'factory') {
    this.setFacility(facility);
  }

  public setFacility(facility: FacilityType) {
    this.facility = facility;
    this.activeProducts = [];
    this.completedProducts = [];
    this.selectedEntityId = null;
    this.selectedEntityType = null;

    if (facility === 'factory') {
      this.machines = getInitialFactoryMachines();
      this.workers = getInitialFactoryWorkers();
      this.agvs = [];
      this.conveyors = getInitialFactoryConveyors();
    } else {
      this.machines = getInitialWarehouseMachines();
      this.workers = getInitialWarehouseWorkers();
      this.agvs = getInitialWarehouseAgvs();
      this.conveyors = getInitialWarehouseConveyors();
    }

    // Seed some initial products into the line
    this.seedInitialProducts();
    
    // Take baseline snapshot
    this.captureBaselineSnapshot();

    this.addEvent({
      category: 'scenario',
      type: 'info',
      title: `${facility === 'factory' ? 'Precision Assembly Plant' : 'Smart Logistics Fulfillment Hub'} Online`,
      description: `Digital twin synchronized with ${this.machines.length} active stations and ${this.workers.length} certified operators.`,
      facility: this.facility
    });
  }

  private seedInitialProducts() {
    for (let i = 0; i < Math.min(5, this.machines.length); i++) {
      const m = this.machines[i];
      const prod: ProductItem = {
        id: `PRD-${++this.productSerial}`,
        sku: this.facility === 'factory' ? 'SKU-PCB-AX9' : 'SKU-BOX-ECOM',
        name: this.facility === 'factory' ? 'Precision Controller Subassembly' : 'E-Commerce Retail Carton',
        facility: this.facility,
        currentStepIndex: i,
        totalSteps: this.machines.length,
        x: m.x,
        y: m.y + 0.8,
        z: m.z,
        status: 'processing',
        createdAt: Date.now() - (i * 12000),
        processTime: i * 5,
        waitTime: 2,
        currentMachineId: m.id,
        color: i % 2 === 0 ? '#30356F' : '#D9A441'
      };
      m.currentProcessingItem = prod;
      this.activeProducts.push(prod);
    }
  }

  public captureBaselineSnapshot() {
    const kpis = calculateOperationalKpis(this.machines, this.workers, this.taktTimeSeconds);
    this.baselineSnapshot = {
      machines: JSON.parse(JSON.stringify(this.machines)),
      workers: JSON.parse(JSON.stringify(this.workers)),
      throughput: kpis.systemThroughputUnitsPerHour,
      leadTime: kpis.averageLeadTimeSeconds,
      wip: kpis.wipTotalUnits,
      costPerUnit: kpis.costPerUnit,
      oee: kpis.oeePct
    };
  }

  public activateExperimentMode() {
    this.isExperimentActive = true;
    this.addEvent({
      category: 'scenario',
      type: 'info',
      title: 'What-If Experiment Mode Activated',
      description: 'System isolated from baseline. You can now tweak station cycle times, add operators, and test capacity changes.',
      facility: this.facility
    });
  }

  public resetToBaseline() {
    if (!this.baselineSnapshot) return;
    this.machines = JSON.parse(JSON.stringify(this.baselineSnapshot.machines));
    this.workers = JSON.parse(JSON.stringify(this.baselineSnapshot.workers));
    this.isExperimentActive = false;
    this.addEvent({
      category: 'scenario',
      type: 'warning',
      title: 'Restored to Factory Baseline',
      description: 'All experimental parameters, cycle times, and worker reassignments reverted.',
      facility: this.facility
    });
  }

  public addEvent(event: Omit<OperationalEvent, 'id' | 'timestamp'>) {
    const d = new Date();
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    const newEvent: OperationalEvent = {
      id: `evt-${++this.eventSerial}`,
      timestamp: timeStr,
      ...event
    };
    this.events.unshift(newEvent);
    if (this.events.length > 60) {
      this.events.pop();
    }
  }

  // --- CHAOS INJECTIONS ---
  public injectMachineBreakdown(machineId: string) {
    const m = this.machines.find(x => x.id === machineId);
    if (!m) return;
    m.status = 'fault';
    m.wearLevelPct = Math.min(100, m.wearLevelPct + 45);
    m.temperatureC += 18;
    m.vibrationMmS += 4.5;
    this.addEvent({
      category: 'maintenance',
      type: 'alert',
      title: `Critical Fault: ${m.name} (${m.stationCode})`,
      description: `Spindle bearing thermal overload tripped safety circuit. Downstream stations will starve.`,
      facility: this.facility,
      entityId: m.id
    });
  }

  public repairMachine(machineId: string) {
    const m = this.machines.find(x => x.id === machineId);
    if (!m) return;
    m.status = 'idle';
    m.wearLevelPct = 10;
    m.temperatureC = 24.0;
    m.vibrationMmS = 0.5;
    this.addEvent({
      category: 'maintenance',
      type: 'success',
      title: `Maintenance Complete: ${m.name}`,
      description: `Technician replaced bearing assembly and recalibrated axes. Station returned to service.`,
      facility: this.facility,
      entityId: m.id
    });
  }

  public injectDemandSpike() {
    this.taktTimeSeconds = Math.max(2.5, this.taktTimeSeconds * 0.65);
    this.addEvent({
      category: 'scenario',
      type: 'warning',
      title: 'Customer Demand Spike (+54%)',
      description: `Takt time reduced to ${this.taktTimeSeconds.toFixed(1)}s. Line imbalance and WIP queue buildup will accelerate.`,
      facility: this.facility
    });
  }

  public injectWorkerAbsenteeism() {
    if (this.workers.length <= 1) return;
    const removedWorker = this.workers.pop();
    if (!removedWorker) return;
    
    const targetM = this.machines.find(m => m.id === removedWorker.currentMachineId);
    if (targetM) {
      targetM.operatorsAssigned = Math.max(0, targetM.operatorsAssigned - 1);
    }
    this.addEvent({
      category: 'worker',
      type: 'warning',
      title: `Operator Call-Out: ${removedWorker.name}`,
      description: `Worker absent for shift. Station ${targetM?.stationCode || 'Assembly'} operating with reduced labor capacity.`,
      facility: this.facility
    });
  }

  // --- DISCRETE EVENT SIMULATION TICK ---
  public tick(rawDeltaSeconds: number) {
    if (!this.isRunning) return;
    
    const delta = Math.min(0.2, rawDeltaSeconds) * this.speedMultiplier;
    this.simClockSeconds += delta;
    this.spawnTimer += delta;

    if (this.spawnTimer >= this.taktTimeSeconds) {
      this.spawnTimer = 0;
      this.spawnInboundItem();
    }

    for (let i = 0; i < this.machines.length; i++) {
      const m = this.machines[i];
      const nextMachine = this.machines[i + 1];

      if (m.status === 'running') {
        m.runningTimeSeconds += delta;
        m.temperatureC = Math.min(65, m.temperatureC + delta * 0.05);
        m.wearLevelPct = Math.min(100, m.wearLevelPct + delta * 0.005);
      } else if (m.status === 'starved') {
        m.starvedTimeSeconds += delta;
        m.temperatureC = Math.max(22, m.temperatureC - delta * 0.04);
      } else if (m.status === 'blocked') {
        m.blockedTimeSeconds += delta;
        m.temperatureC = Math.max(22, m.temperatureC - delta * 0.02);
      } else if (m.status === 'fault') {
        m.faultTimeSeconds += delta;
      } else {
        m.idleTimeSeconds += delta;
        m.temperatureC = Math.max(20, m.temperatureC - delta * 0.05);
      }

      if (m.status === 'running' && m.failureRatePerHour > 0) {
        const faultChancePerTick = (m.failureRatePerHour / 3600) * delta;
        if (Math.random() < faultChancePerTick && m.wearLevelPct > 35) {
          this.injectMachineBreakdown(m.id);
        }
      }

      if (m.status === 'fault') continue;

      let operatorFactor = 1.0;
      if (m.operatorsRequired > 0) {
        if (m.operatorsAssigned === 0) {
          operatorFactor = 0.2;
        } else {
          const assignedWorker = this.workers.find(w => w.currentMachineId === m.id);
          if (assignedWorker) {
            operatorFactor = assignedWorker.efficiencyMultiplier * (1 - (assignedWorker.fatiguePct / 200));
          }
        }
      }

      if (m.currentProcessingItem) {
        m.status = 'running';
        const progressIncrement = (delta / Math.max(1, m.cycleTime)) * operatorFactor;
        m.progress += progressIncrement;

        m.currentProcessingItem.processTime += delta;
        m.currentProcessingItem.x = m.x + Math.sin(m.progress * Math.PI) * 0.1;
        m.currentProcessingItem.z = m.z;
        m.currentProcessingItem.y = m.y + 0.8;

        if (m.progress >= 1.0) {
          if (nextMachine) {
            if (nextMachine.queue.length < nextMachine.maxQueueCapacity) {
              const completedItem = m.currentProcessingItem;
              completedItem.currentStepIndex++;
              completedItem.status = 'queued';
              completedItem.currentMachineId = nextMachine.id;
              nextMachine.queue.push(completedItem);

              m.currentProcessingItem = undefined;
              m.progress = 0;
              m.totalProcessedCount++;

              if (m.type === 'qa_scanner') {
                if (Math.random() < 0.04) {
                  m.totalDefectCount++;
                  completedItem.isDefective = true;
                  completedItem.defectReason = 'Soldering Solder-Bridge on IC-3';
                  completedItem.color = '#B92343';
                  this.addEvent({
                    category: 'quality',
                    type: 'alert',
                    title: `Defect Ejected at ${m.stationCode}`,
                    description: `Laser scan detected bridge short on ${completedItem.id}. Diverted to rework bin.`,
                    facility: this.facility
                  });
                }
              }

              if (m.queue.length > 0) {
                m.currentProcessingItem = m.queue.shift();
                if (m.currentProcessingItem) {
                  m.currentProcessingItem.status = 'processing';
                  m.currentProcessingItem.currentMachineId = m.id;
                }
                m.status = 'running';
              } else {
                m.status = 'starved';
              }
            } else {
              m.status = 'blocked';
            }
          } else {
            const finished = m.currentProcessingItem;
            finished.status = 'completed';
            this.completedProducts.push(finished);
            this.activeProducts = this.activeProducts.filter(p => p.id !== finished.id);
            m.currentProcessingItem = undefined;
            m.progress = 0;
            m.totalProcessedCount++;

            if (m.queue.length > 0) {
              m.currentProcessingItem = m.queue.shift();
              if (m.currentProcessingItem) {
                m.currentProcessingItem.status = 'processing';
                m.currentProcessingItem.currentMachineId = m.id;
              }
              m.status = 'running';
            } else {
              m.status = 'starved';
            }
          }
        }
      } else {
        if (m.queue.length > 0) {
          m.currentProcessingItem = m.queue.shift();
          if (m.currentProcessingItem) {
            m.currentProcessingItem.status = 'processing';
            m.currentProcessingItem.currentMachineId = m.id;
          }
          m.progress = 0;
          m.status = 'running';
        } else {
          m.status = 'starved';
          m.progress = 0;
        }
      }

      for (const qItem of m.queue) {
        qItem.waitTime += delta;
      }
    }

    for (const w of this.workers) {
      if (w.state === 'working' || w.state === 'inspecting') {
        w.fatiguePct = Math.min(100, w.fatiguePct + delta * 0.04);
        if (w.fatiguePct >= 95) {
          w.state = 'resting';
        }
      } else if (w.state === 'resting') {
        w.fatiguePct = Math.max(10, w.fatiguePct - delta * 0.15);
        if (w.fatiguePct <= 25) {
          w.state = 'working';
        }
      }

      if (w.state === 'working') {
        w.y = Math.sin(this.simClockSeconds * 4) * 0.02;
      }
    }

    if (this.facility === 'warehouse') {
      for (const agv of this.agvs) {
        if (agv.waypoints.length > 0) {
          const target = agv.waypoints[agv.currentWaypointIndex];
          const dx = target[0] - agv.x;
          const dz = target[1] - agv.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.3) {
            agv.currentWaypointIndex = (agv.currentWaypointIndex + 1) % agv.waypoints.length;
          } else {
            const moveStep = agv.speed * delta;
            agv.x += (dx / dist) * Math.min(dist, moveStep);
            agv.z += (dz / dist) * Math.min(dist, moveStep);
            agv.totalDistanceTraveled += moveStep;
            agv.batteryPct = Math.max(10, agv.batteryPct - delta * 0.005);

            if (agv.payload) {
              agv.payload.x = agv.x;
              agv.payload.z = agv.z;
              agv.payload.y = 0.55;
            }
          }
        }
      }
    }
  }

  private spawnInboundItem() {
    const firstMachine = this.machines[0];
    if (!firstMachine) return;

    if (firstMachine.queue.length < firstMachine.maxQueueCapacity) {
      const prod: ProductItem = {
        id: `PRD-${++this.productSerial}`,
        sku: this.facility === 'factory' ? 'SKU-PCB-AX9' : 'SKU-BOX-ECOM',
        name: this.facility === 'factory' ? 'Precision Controller Subassembly' : 'E-Commerce Retail Carton',
        facility: this.facility,
        currentStepIndex: 0,
        totalSteps: this.machines.length,
        x: firstMachine.x,
        y: firstMachine.y + 0.8,
        z: firstMachine.z,
        status: 'queued',
        createdAt: Date.now(),
        processTime: 0,
        waitTime: 0,
        currentMachineId: firstMachine.id,
        color: this.productSerial % 3 === 0 ? '#30356F' : '#D9A441'
      };
      firstMachine.queue.push(prod);
      this.activeProducts.push(prod);
    }
  }

  public getBottleneckDiagnosis() {
    return analyzeBottlenecks(this.machines, this.facility, this.taktTimeSeconds);
  }

  public getKpis() {
    return calculateOperationalKpis(this.machines, this.workers, this.taktTimeSeconds);
  }

  public getScenarioComparison(): ScenarioComparison {
    const currentKpis = this.getKpis();
    const baseline = this.baselineSnapshot || {
      throughput: currentKpis.systemThroughputUnitsPerHour,
      leadTime: currentKpis.averageLeadTimeSeconds,
      wip: currentKpis.wipTotalUnits,
      costPerUnit: currentKpis.costPerUnit,
      oee: currentKpis.oeePct
    };

    const deltaThroughputPct = baseline.throughput > 0 
      ? Math.round(((currentKpis.systemThroughputUnitsPerHour - baseline.throughput) / baseline.throughput) * 100)
      : 0;

    const deltaLeadTimePct = baseline.leadTime > 0
      ? Math.round(((currentKpis.averageLeadTimeSeconds - baseline.leadTime) / baseline.leadTime) * 100)
      : 0;

    const deltaWipPct = baseline.wip > 0
      ? Math.round(((currentKpis.wipTotalUnits - baseline.wip) / baseline.wip) * 100)
      : 0;

    const deltaCostPerUnitPct = baseline.costPerUnit > 0
      ? Math.round(((currentKpis.costPerUnit - baseline.costPerUnit) / baseline.costPerUnit) * 100)
      : 0;

    const deltaOeePct = baseline.oee > 0
      ? Math.round(((currentKpis.oeePct - baseline.oee) / baseline.oee) * 100)
      : 0;

    return {
      name: this.isExperimentActive ? 'Active What-If Experiment' : 'Standard Baseline',
      isExperimentActive: this.isExperimentActive,
      baseline: {
        throughput: baseline.throughput,
        leadTime: baseline.leadTime,
        wip: baseline.wip,
        costPerUnit: baseline.costPerUnit,
        oee: baseline.oee
      },
      experiment: {
        throughput: currentKpis.systemThroughputUnitsPerHour,
        leadTime: currentKpis.averageLeadTimeSeconds,
        wip: currentKpis.wipTotalUnits,
        costPerUnit: currentKpis.costPerUnit,
        oee: currentKpis.oeePct
      },
      deltas: {
        throughputPct: deltaThroughputPct,
        leadTimePct: deltaLeadTimePct,
        wipPct: deltaWipPct,
        costPerUnitPct: deltaCostPerUnitPct,
        oeePct: deltaOeePct
      }
    };
  }

  public updateMachineCycleTime(machineId: string, newCycleTime: number) {
    const m = this.machines.find(x => x.id === machineId);
    if (!m) return;
    const old = m.cycleTime;
    m.cycleTime = Math.max(1.0, Number(newCycleTime.toFixed(1)));
    this.addEvent({
      category: 'machine',
      type: 'info',
      title: `${m.name} Cycle Time Adjusted`,
      description: `Cycle time changed from ${old.toFixed(1)}s to ${m.cycleTime.toFixed(1)}s.`,
      facility: this.facility,
      entityId: m.id
    });
  }

  public updateMachineBufferCapacity(machineId: string, newCapacity: number) {
    const m = this.machines.find(x => x.id === machineId);
    if (!m) return;
    m.maxQueueCapacity = Math.max(2, Math.round(newCapacity));
  }

  public addOperatorToMachine(machineId: string) {
    const m = this.machines.find(x => x.id === machineId);
    if (!m) return;
    m.operatorsAssigned++;
    this.addEvent({
      category: 'worker',
      type: 'info',
      title: `Operator Deployed to ${m.stationCode}`,
      description: `Total operators on ${m.name}: ${m.operatorsAssigned}. Line balance adjusted.`,
      facility: this.facility,
      entityId: m.id
    });
  }
}
