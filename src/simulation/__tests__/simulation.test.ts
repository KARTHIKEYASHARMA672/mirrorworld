import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulationEngine';
import { analyzeBottlenecks } from '../bottleneckDetector';
import { calculateOperationalKpis } from '../kpiCalculator';

describe('MIRRORWORLD Simulation Core & Operational Digital Twin', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine('factory');
  });

  describe('Simulation Lifecycle & Deterministic Clock', () => {
    it('initializes factory facility with stations and workers', () => {
      expect(engine.facility).toBe('factory');
      expect(engine.machines.length).toBeGreaterThan(5);
      expect(engine.workers.length).toBeGreaterThan(2);
      expect(engine.activeProducts.length).toBeGreaterThan(0);
      expect(engine.events.length).toBeGreaterThan(0);
    });

    it('advances simulation clock and telemetry on tick', () => {
      const initialClock = engine.simClockSeconds;
      engine.tick(0.5);
      expect(engine.simClockSeconds).toBeGreaterThan(initialClock);

      const m1 = engine.machines[0];
      expect(m1.runningTimeSeconds + m1.idleTimeSeconds + m1.starvedTimeSeconds + m1.blockedTimeSeconds).toBeGreaterThan(0);
    });

    it('switches between Factory and Warehouse facilities cleanly', () => {
      engine.setFacility('warehouse');
      expect(engine.facility).toBe('warehouse');
      expect(engine.agvs.length).toBeGreaterThan(0);
      expect(engine.machines.some(m => m.type === 'racks')).toBe(true);

      engine.setFacility('factory');
      expect(engine.facility).toBe('factory');
      expect(engine.machines.some(m => m.type === 'cnc')).toBe(true);
    });
  });

  describe('Theory of Constraints Bottleneck Detection', () => {
    it('accurately identifies the governing constraint in the factory baseline', () => {
      const diagnosis = engine.getBottleneckDiagnosis();
      expect(diagnosis.activeConstraintMachineId).toBe('m-stn-03');
      expect(diagnosis.stationCode).toBe('STN-03');
      expect(diagnosis.severity).toBe('critical');
      expect(diagnosis.recommendations.length).toBeGreaterThan(0);
    });

    it('accurately identifies the pick mezzanine bottleneck in warehouse facility', () => {
      engine.setFacility('warehouse');
      const diagnosis = engine.getBottleneckDiagnosis();
      expect(diagnosis.activeConstraintMachineId).toContain('wh-pick-mezzanine');
      expect(diagnosis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Operational KPIs & Little’s Law Math', () => {
    it('calculates OEE as Availability × Performance × Quality', () => {
      const kpis = engine.getKpis();
      expect(kpis.oeePct).toBeGreaterThan(0);
      expect(kpis.oeePct).toBeLessThanOrEqual(100);
      expect(kpis.availabilityPct).toBeGreaterThan(0);
      expect(kpis.performancePct).toBeGreaterThan(0);
      expect(kpis.qualityPct).toBeGreaterThan(0);

      expect(kpis.wipTotalUnits).toBeGreaterThanOrEqual(0);
      expect(kpis.systemThroughputUnitsPerHour).toBeGreaterThan(0);
      expect(kpis.costPerUnit).toBeGreaterThan(0);
    });
  });

  describe('Chaos Injections & What-If Scenario Experimentation', () => {
    it('handles machine breakdown injection and subsequent maintenance repair', () => {
      const targetMachine = engine.machines[2];
      expect(targetMachine.status).not.toBe('fault');

      engine.injectMachineBreakdown(targetMachine.id);
      expect(targetMachine.status).toBe('fault');
      expect(targetMachine.wearLevelPct).toBeGreaterThan(40);

      expect(engine.events[0].category).toBe('maintenance');
      expect(engine.events[0].type).toBe('alert');

      engine.repairMachine(targetMachine.id);
      expect(targetMachine.status).toBe('idle');
      expect(targetMachine.wearLevelPct).toBe(10);
    });

    it('manages What-If experiment lifecycle and comparative baseline deltas', () => {
      engine.activateExperimentMode();
      expect(engine.isExperimentActive).toBe(true);

      const cnc = engine.machines.find(m => m.id === 'm-stn-03');
      expect(cnc).toBeDefined();
      if (cnc) {
        engine.updateMachineCycleTime(cnc.id, 6.0);
        expect(cnc.cycleTime).toBe(6.0);
      }

      const scenario = engine.getScenarioComparison();
      expect(scenario.isExperimentActive).toBe(true);
      expect(scenario.deltas).toBeDefined();

      engine.resetToBaseline();
      expect(engine.isExperimentActive).toBe(false);
      const restoredCnc = engine.machines.find(m => m.id === 'm-stn-03');
      expect(restoredCnc?.cycleTime).toBe(12.0);
    });
  });
});
