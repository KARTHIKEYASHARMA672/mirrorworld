import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from './simulation/simulationEngine';
import { FacilityType, CameraMode, ViewOverlayMode, MachineEntity, WorkerEntity, AgvEntity } from './types/simulation';
import { DigitalTwinCanvas } from './components/3d/DigitalTwinCanvas';
import { TopNavigationBar } from './components/ui/TopNavigationBar';
import { BottleneckAdvisorPanel } from './components/ui/BottleneckAdvisorPanel';
import { KpiExecutiveDashboard } from './components/ui/KpiExecutiveDashboard';
import { ScenarioExperimentBar } from './components/ui/ScenarioExperimentBar';
import { EntityInspectorModal } from './components/ui/EntityInspectorModal';
import { EventAuditStream } from './components/ui/EventAuditStream';

export function App() {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine('factory'));
  const engine = engineRef.current;

  const [facility, setFacility] = useState<FacilityType>('factory');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('god_view');
  const [overlayMode, setOverlayMode] = useState<ViewOverlayMode>('standard');
  
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'machine' | 'worker' | 'agv' | 'product' | null>(null);

  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 66);
    return () => clearInterval(timer);
  }, []);

  const handleFacilityChange = (newFacility: FacilityType) => {
    setFacility(newFacility);
    engine.setFacility(newFacility);
    setSelectedEntityId(null);
    setSelectedEntityType(null);
  };

  const handleTogglePlay = () => {
    engine.isRunning = !engine.isRunning;
    setIsRunning(engine.isRunning);
  };

  const handleSpeedChange = (speed: number) => {
    engine.speedMultiplier = speed;
    setSpeedMultiplier(speed);
  };

  const handleSelectEntity = (id: string, type: 'machine' | 'worker' | 'agv' | 'product') => {
    setSelectedEntityId(id);
    setSelectedEntityType(type);
    engine.selectedEntityId = id;
    engine.selectedEntityType = type;
  };

  const handleApplyRecommendation = (recId: string, actionType: string, targetMachineId: string) => {
    const targetM = engine.machines.find((m) => m.id === targetMachineId);
    if (!targetM) return;

    if (!engine.isExperimentActive) {
      engine.activateExperimentMode();
    }

    if (actionType === 'speed_up') {
      engine.updateMachineCycleTime(targetMachineId, Math.max(1.5, targetM.cycleTime * 0.75));
    } else if (actionType === 'add_worker') {
      engine.addOperatorToMachine(targetMachineId);
    } else if (actionType === 'expand_buffer') {
      engine.updateMachineBufferCapacity(targetMachineId, targetM.maxQueueCapacity + 6);
    } else if (actionType === 'parallel_machine') {
      engine.updateMachineCycleTime(targetMachineId, targetM.cycleTime * 0.5);
    }
  };

  const handleFocusMachine = (machineId: string) => {
    handleSelectEntity(machineId, 'machine');
    setCameraMode('entity_orbit');
  };

  const diagnosis = engine.getBottleneckDiagnosis();
  const kpis = engine.getKpis();
  const scenario = engine.getScenarioComparison();

  return (
    <div className="w-screen h-screen flex flex-col bg-[#FBF5E6] text-[#171A35] font-sans overflow-hidden select-none">
      <TopNavigationBar
        facility={facility}
        onFacilityChange={handleFacilityChange}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        speedMultiplier={speedMultiplier}
        onSpeedChange={handleSpeedChange}
        simClockSeconds={engine.simClockSeconds}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        overlayMode={overlayMode}
        onOverlayModeChange={setOverlayMode}
        isExperimentActive={engine.isExperimentActive}
        onToggleExperiment={() => {
          if (engine.isExperimentActive) {
            engine.resetToBaseline();
          } else {
            engine.activateExperimentMode();
          }
        }}
        onResetBaseline={() => engine.resetToBaseline()}
        onInjectBreakdown={() => {
          if (engine.machines.length > 2) {
            engine.injectMachineBreakdown(engine.machines[2].id);
          }
        }}
        onInjectDemandSpike={() => engine.injectDemandSpike()}
        onInjectWorkerCallout={() => engine.injectWorkerAbsenteeism()}
      />

      <ScenarioExperimentBar
        scenario={scenario}
        onCommitBaseline={() => {
          engine.captureBaselineSnapshot();
          engine.isExperimentActive = false;
        }}
        onResetBaseline={() => engine.resetToBaseline()}
      />

      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 h-full relative">
          <DigitalTwinCanvas
            engine={engine}
            cameraMode={cameraMode}
            overlayMode={overlayMode}
            onSelectEntity={handleSelectEntity}
          />

          <EventAuditStream
            events={engine.events}
            onSelectEntity={(id) => handleFocusMachine(id)}
          />

          <EntityInspectorModal
            entityId={selectedEntityId}
            entityType={selectedEntityType}
            machines={engine.machines}
            workers={engine.workers}
            agvs={engine.agvs}
            onClose={() => {
              setSelectedEntityId(null);
              setSelectedEntityType(null);
              engine.selectedEntityId = null;
              engine.selectedEntityType = null;
            }}
            onUpdateCycleTime={(mId, time) => engine.updateMachineCycleTime(mId, time)}
            onUpdateBuffer={(mId, cap) => engine.updateMachineBufferCapacity(mId, cap)}
            onAddOperator={(mId) => engine.addOperatorToMachine(mId)}
            onRepairMachine={(mId) => engine.repairMachine(mId)}
            onTripFault={(mId) => engine.injectMachineBreakdown(mId)}
          />
        </div>

        <BottleneckAdvisorPanel
          diagnosis={diagnosis}
          onApplyRecommendation={handleApplyRecommendation}
          onFocusMachine={handleFocusMachine}
        />
      </div>

      <KpiExecutiveDashboard
        kpis={kpis}
        machines={engine.machines}
      />
    </div>
  );
}

export default App;
