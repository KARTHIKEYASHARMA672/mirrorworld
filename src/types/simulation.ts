// MIRRORWORLD — Simulation & Operational Digital Twin Type Definitions

export type FacilityType = 'factory' | 'warehouse';

export type MachineStatus = 'idle' | 'running' | 'starved' | 'blocked' | 'fault';

export type WorkerState = 'walking' | 'working' | 'resting' | 'inspecting';

export type ProductStatus = 'queued' | 'processing' | 'in_transit' | 'inspected' | 'completed' | 'defective';

export type AgvStatus = 'idle' | 'transporting' | 'charging' | 'waiting';

export type CameraMode = 'god_view' | 'first_person' | 'entity_orbit' | 'product_follow' | 'vr_spatial';

export type ViewOverlayMode = 'standard' | 'bottleneck_heatmap' | 'wip_density' | 'energy_thermal';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  facility: FacilityType;
  currentStepIndex: number;
  totalSteps: number;
  x: number;
  y: number;
  z: number;
  status: ProductStatus;
  createdAt: number;
  processTime: number; // accumulated active machine time
  waitTime: number;    // accumulated buffer/starve/block time
  currentMachineId?: string;
  isDefective?: boolean;
  defectReason?: string;
  color?: string;
}

export interface MachineEntity {
  id: string;
  facility: FacilityType;
  name: string;
  stationCode: string;
  type: 'smt' | 'cnc' | 'robot_weld' | 'manual_assembly' | 'qa_scanner' | 'packager' | 'racks' | 'sorter' | 'dock_in' | 'dock_out';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  width: number;
  depth: number;
  height: number;
  
  // Operational Parameters
  cycleTime: number;          // Current cycle time in seconds
  baselineCycleTime: number;  // Initial baseline
  maxQueueCapacity: number;   // Buffer capacity before blocking upstream
  energyKW: number;           // Operating power consumption in kW
  failureRatePerHour: number; // Probability of random fault
  mttrSeconds: number;        // Mean Time To Repair
  operatorsRequired: number;  // Human workers needed
  operatorsAssigned: number;
  
  // Dynamic Simulation State
  status: MachineStatus;
  progress: number;           // 0 to 1 current item completion
  currentProcessingItem?: ProductItem;
  queue: ProductItem[];       // Items waiting in input buffer
  outputBuffer: ProductItem[];// Items waiting to be collected
  
  // Cumulative Metrics for OEE & Bottleneck Analysis
  totalProcessedCount: number;
  totalDefectCount: number;
  starvedTimeSeconds: number;
  blockedTimeSeconds: number;
  runningTimeSeconds: number;
  idleTimeSeconds: number;
  faultTimeSeconds: number;
  
  // Telemetry
  temperatureC: number;
  vibrationMmS: number;
  wearLevelPct: number;
  
  // Associated kinematic nodes
  subTypeDetails?: string;
}

export interface WorkerEntity {
  id: string;
  name: string;
  role: string;
  facility: FacilityType;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  state: WorkerState;
  currentMachineId?: string;
  fatiguePct: number;          // 0 to 100%
  efficiencyMultiplier: number;// 0.7 to 1.3
  shiftTimeRemaining: number;
  totalTasksCompleted: number;
}

export interface AgvEntity {
  id: string;
  name: string;
  facility: FacilityType;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  status: AgvStatus;
  batteryPct: number;
  payload: ProductItem | null;
  waypoints: [number, number][];
  currentWaypointIndex: number;
  totalDistanceTraveled: number;
  assignedTaskId?: string;
}

export interface ConveyorSegment {
  id: string;
  facility: FacilityType;
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  y: number;
  speed: number;
  capacity: number;
  items: ProductItem[];
  isAccumulating: boolean;
}

export interface BottleneckDiagnosis {
  activeConstraintMachineId: string | null;
  machineName: string;
  stationCode: string;
  constraintType: 'cycle_time' | 'buffer_starvation' | 'buffer_blocking' | 'worker_shortage' | 'maintenance_risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impactSummary: string;
  rootCauseAnalysis: string;
  utilizationPct: number;
  starvedRatioPct: number;
  blockedRatioPct: number;
  wipQueueSize: number;
  recommendations: Array<{
    id: string;
    title: string;
    actionType: 'speed_up' | 'add_worker' | 'expand_buffer' | 'parallel_machine' | 'preventive_maintenance';
    impact: string;
    estimatedCost: string;
    targetMachineId: string;
  }>;
}

export interface OperationalKpis {
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
  taktTimeSeconds: number;
  systemThroughputUnitsPerHour: number;
  wipTotalUnits: number;
  averageLeadTimeSeconds: number;
  totalProducedCount: number;
  totalScrapCount: number;
  firstPassYieldPct: number;
  totalEnergyKWh: number;
  energyCostPerHour: number;
  laborCostPerHour: number;
  costPerUnit: number;
}

export interface OperationalEvent {
  id: string;
  timestamp: string;
  category: 'bottleneck' | 'machine' | 'worker' | 'agv' | 'quality' | 'scenario' | 'maintenance';
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  description: string;
  facility: FacilityType;
  entityId?: string;
}

export interface ScenarioComparison {
  name: string;
  isExperimentActive: boolean;
  baseline: {
    throughput: number;
    leadTime: number;
    wip: number;
    costPerUnit: number;
    oee: number;
  };
  experiment: {
    throughput: number;
    leadTime: number;
    wip: number;
    costPerUnit: number;
    oee: number;
  };
  deltas: {
    throughputPct: number;
    leadTimePct: number;
    wipPct: number;
    costPerUnitPct: number;
    oeePct: number;
  };
}
