import * as THREE from 'three';
import { MachineEntity, WorkerEntity, ProductItem, ViewOverlayMode } from '../../types/simulation';

export class Factory3DScene {
  public group: THREE.Group;
  private machineMeshes: Map<string, THREE.Group> = new Map();
  private workerMeshes: Map<string, THREE.Group> = new Map();
  private productMeshes: Map<string, THREE.Mesh> = new Map();
  private robotArms: Array<{ base: THREE.Group; arm1: THREE.Group; arm2: THREE.Group; tool: THREE.Group }> = [];
  private cncSpindles: Array<THREE.Mesh> = [];
  private laserScanners: Array<THREE.Mesh> = [];
  private beaconLights: Map<string, THREE.PointLight> = new Map();

  // Materials
  private concreteMat: THREE.MeshStandardMaterial;
  private metalDarkMat: THREE.MeshStandardMaterial;
  private metalLightMat: THREE.MeshStandardMaterial;
  private machinePaintMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshPhysicalMaterial;
  private cautionStripeMat: THREE.MeshStandardMaterial;
  private conveyorMat: THREE.MeshStandardMaterial;
  private workerSkinMat: THREE.MeshStandardMaterial;
  private workerVestMat: THREE.MeshStandardMaterial;
  private workerPantsMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0xDDD6C6,
      roughness: 0.6,
      metalness: 0.1
    });

    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1E2235,
      roughness: 0.35,
      metalness: 0.8
    });

    this.metalLightMat = new THREE.MeshStandardMaterial({
      color: 0xB5BAC9,
      roughness: 0.25,
      metalness: 0.85
    });

    this.machinePaintMat = new THREE.MeshStandardMaterial({
      color: 0x30356F,
      roughness: 0.4,
      metalness: 0.3
    });

    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xE8F0FE,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7
    });

    this.cautionStripeMat = new THREE.MeshStandardMaterial({
      color: 0xD9A441,
      roughness: 0.5,
      metalness: 0.2
    });

    this.conveyorMat = new THREE.MeshStandardMaterial({
      color: 0x2A2E3D,
      roughness: 0.7,
      metalness: 0.2
    });

    this.workerSkinMat = new THREE.MeshStandardMaterial({
      color: 0xD29B78,
      roughness: 0.7
    });

    this.workerVestMat = new THREE.MeshStandardMaterial({
      color: 0xD9A441,
      roughness: 0.5
    });

    this.workerPantsMat = new THREE.MeshStandardMaterial({
      color: 0x22263C,
      roughness: 0.7
    });

    this.buildFactoryInfrastructure();
  }

  private buildFactoryInfrastructure() {
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floor = new THREE.Mesh(floorGeo, this.concreteMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xF3E7CE });
    
    const walkGeo = new THREE.PlaneGeometry(50, 0.2);
    const walkLine = new THREE.Mesh(walkGeo, lineMat);
    walkLine.rotation.x = -Math.PI / 2;
    walkLine.position.set(0, 0.01, -1);
    this.group.add(walkLine);

    for (let x = -20; x <= 20; x += 10) {
      const crossLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 30), lineMat);
      crossLine.rotation.x = -Math.PI / 2;
      crossLine.position.set(x, 0.01, 0);
      this.group.add(crossLine);
    }

    const colGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
    const colMat = this.metalDarkMat;
    const colPositions = [
      [-22, 4, -14],
      [-22, 4, 14],
      [0, 4, -14],
      [0, 4, 14],
      [22, 4, -14],
      [22, 4, 14]
    ];

    colPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, cy, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      this.group.add(col);

      const baseBumper = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), this.cautionStripeMat);
      baseBumper.position.set(cx, 0.2, cz);
      this.group.add(baseBumper);
    });

    const beamGeo = new THREE.BoxGeometry(46, 0.4, 0.4);
    const beam1 = new THREE.Mesh(beamGeo, colMat);
    beam1.position.set(0, 7.8, -14);
    this.group.add(beam1);

    const beam2 = new THREE.Mesh(beamGeo, colMat);
    beam2.position.set(0, 7.8, 14);
    this.group.add(beam2);
  }

  public populateMachines(machines: MachineEntity[]) {
    this.machineMeshes.forEach(mesh => this.group.remove(mesh));
    this.machineMeshes.clear();
    this.robotArms = [];
    this.cncSpindles = [];
    this.laserScanners = [];
    this.beaconLights.clear();

    for (const m of machines) {
      const mGroup = new THREE.Group();
      mGroup.position.set(m.x, m.y, m.z);
      mGroup.rotation.y = m.rotationY;
      mGroup.name = m.id;

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(m.width, 0.3, m.depth),
        this.metalDarkMat
      );
      plinth.position.y = 0.15;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      mGroup.add(plinth);

      switch (m.type) {
        case 'smt':
          this.buildSmtMesh(mGroup, m);
          break;
        case 'cnc':
          this.buildCncMesh(mGroup, m);
          break;
        case 'robot_weld':
          this.buildRobotMesh(mGroup, m);
          break;
        case 'manual_assembly':
          this.buildManualStationMesh(mGroup, m);
          break;
        case 'qa_scanner':
          this.buildQaScannerMesh(mGroup, m);
          break;
        case 'packager':
          this.buildPackagerMesh(mGroup, m);
          break;
        default:
          this.buildGenericStationMesh(mGroup, m);
          break;
      }

      const beaconGroup = this.buildAndonTower(m);
      mGroup.add(beaconGroup);

      this.group.add(mGroup);
      this.machineMeshes.set(m.id, mGroup);
    }
  }

  private buildSmtMesh(group: THREE.Group, m: MachineEntity) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.9, 1.4, m.depth * 0.8), this.machinePaintMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(m.width * 0.6, 0.7), this.glassMat);
    glass.position.set(0, 1.1, (m.depth * 0.4) + 0.01);
    group.add(glass);

    const feederBank = new THREE.Group();
    for (let r = 0; r < 5; r++) {
      const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16), this.metalLightMat);
      reel.rotation.z = Math.PI / 2;
      reel.position.set((-m.width * 0.45) - 0.1, 0.9, -0.8 + (r * 0.4));
      feederBank.add(reel);
    }
    group.add(feederBank);

    const track = new THREE.Mesh(new THREE.BoxGeometry(m.width * 1.1, 0.15, 0.45), this.conveyorMat);
    track.position.set(0, 0.8, 0);
    group.add(track);
  }

  private buildCncMesh(group: THREE.Group, m: MachineEntity) {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.9, 2.2, m.depth * 0.85), this.machinePaintMat);
    cabin.position.y = 1.4;
    cabin.castShadow = true;
    group.add(cabin);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(m.width * 0.5, 1.2), this.glassMat);
    glass.position.set(0, 1.5, (m.depth * 0.425) + 0.01);
    group.add(glass);

    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.2), this.metalLightMat);
    bed.position.set(0, 0.8, 0);
    group.add(bed);

    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.7, 16), this.metalLightMat);
    spindle.position.set(0, 1.4, 0);
    group.add(spindle);
    this.cncSpindles.push(spindle);

    const pendant = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.1), this.metalDarkMat);
    pendant.position.set(m.width * 0.48, 1.6, m.depth * 0.3);
    group.add(pendant);
  }

  private buildRobotMesh(group: THREE.Group, m: MachineEntity) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 16), this.metalDarkMat);
    base.position.y = 0.55;
    base.castShadow = true;
    group.add(base);

    const armBase = new THREE.Group();
    armBase.position.y = 0.95;
    group.add(armBase);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), this.machinePaintMat);
    armBase.add(shoulder);

    const arm1 = new THREE.Group();
    const link1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), this.machinePaintMat);
    link1.position.y = 0.55;
    link1.castShadow = true;
    arm1.add(link1);
    armBase.add(arm1);

    const arm2 = new THREE.Group();
    arm2.position.y = 1.1;
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), this.metalLightMat);
    arm2.add(elbow);

    const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), this.metalLightMat);
    link2.position.y = 0.45;
    link2.castShadow = true;
    arm2.add(link2);
    arm1.add(arm2);

    const tool = new THREE.Group();
    tool.position.y = 0.9;
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 12), this.cautionStripeMat);
    nozzle.rotation.x = Math.PI;
    tool.add(nozzle);
    arm2.add(tool);

    this.robotArms.push({ base: armBase, arm1, arm2, tool });

    const fenceMat = this.cautionStripeMat;
    const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(m.width, 1.1, 0.05), fenceMat);
    fenceBack.position.set(0, 0.7, -m.depth * 0.45);
    group.add(fenceBack);
  }

  private buildManualStationMesh(group: THREE.Group, m: MachineEntity) {
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.8, 0.08, m.depth * 0.7), new THREE.MeshStandardMaterial({ color: 0x8C7456, roughness: 0.5 }));
    benchTop.position.y = 0.85;
    benchTop.castShadow = true;
    group.add(benchTop);

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const legPositions = [
      [(-m.width * 0.36), 0.4, (-m.depth * 0.3)],
      [(m.width * 0.36), 0.4, (-m.depth * 0.3)],
      [(-m.width * 0.36), 0.4, (m.depth * 0.3)],
      [(m.width * 0.36), 0.4, (m.depth * 0.3)]
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, this.metalDarkMat);
      leg.position.set(lx, ly, lz);
      group.add(leg);
    });

    const rail = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.75, 0.05, 0.05), this.metalLightMat);
    rail.position.set(0, 1.8, -m.depth * 0.3);
    group.add(rail);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.6, 0.08, 0.15), this.metalLightMat);
    lamp.position.set(0, 1.75, -m.depth * 0.05);
    group.add(lamp);

    for (let b = 0; b < 3; b++) {
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.35), new THREE.MeshStandardMaterial({ color: b === 1 ? 0x2457C5 : 0xB92343 }));
      bin.position.set(-0.5 + (b * 0.5), 0.95, -m.depth * 0.2);
      group.add(bin);
    }
  }

  private buildQaScannerMesh(group: THREE.Group, m: MachineEntity) {
    const portal = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.85, 1.8, 1.0), this.machinePaintMat);
    portal.position.y = 1.2;
    portal.castShadow = true;
    group.add(portal);

    const tunnel = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.55, 0.9, 1.05), new THREE.MeshBasicMaterial({ color: 0x12141F }));
    tunnel.position.set(0, 1.1, 0);
    group.add(tunnel);

    const laser = new THREE.Mesh(
      new THREE.PlaneGeometry(m.width * 0.5, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x245B45, side: THREE.DoubleSide })
    );
    laser.rotation.x = Math.PI / 2;
    laser.position.set(0, 1.3, 0);
    group.add(laser);
    this.laserScanners.push(laser);
  }

  private buildPackagerMesh(group: THREE.Group, m: MachineEntity) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.85, 2.0, m.depth * 0.8), this.machinePaintMat);
    tower.position.y = 1.3;
    tower.castShadow = true;
    group.add(tower);

    const hopper = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xAA8255 }));
    hopper.position.set(-m.width * 0.35, 1.5, 0);
    group.add(hopper);

    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, m.width * 0.8, 12), this.metalLightMat);
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.8, 0.4);
    group.add(roller);
  }

  private buildGenericStationMesh(group: THREE.Group, m: MachineEntity) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.85, 1.2, m.depth * 0.85), this.machinePaintMat);
    box.position.y = 0.9;
    box.castShadow = true;
    group.add(box);
  }

  private buildAndonTower(m: MachineEntity): THREE.Group {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(m.width * 0.42, 1.8, -m.depth * 0.4);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), this.metalDarkMat);
    pole.position.y = 0.4;
    towerGroup.add(pole);

    let lightColor = 0x245B45;
    if (m.status === 'fault') lightColor = 0xB92343;
    else if (m.status === 'blocked' || m.status === 'starved') lightColor = 0xD9A441;

    const beaconGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = 0.85;
    beaconMesh.name = `beacon-mesh-${m.id}`;
    towerGroup.add(beaconMesh);

    const pLight = new THREE.PointLight(lightColor, 1.5, 3.5);
    pLight.position.y = 0.85;
    towerGroup.add(pLight);
    this.beaconLights.set(m.id, pLight);

    return towerGroup;
  }

  public populateWorkers(workers: WorkerEntity[]) {
    this.workerMeshes.forEach(mesh => this.group.remove(mesh));
    this.workerMeshes.clear();

    for (const w of workers) {
      const wGroup = new THREE.Group();
      wGroup.position.set(w.x, w.y, w.z);
      wGroup.name = w.id;

      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), this.metalDarkMat);
      shoeL.position.set(-0.1, 0.05, 0.02);
      wGroup.add(shoeL);

      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), this.metalDarkMat);
      shoeR.position.set(0.1, 0.05, 0.02);
      wGroup.add(shoeR);

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.75, 0.14), this.workerPantsMat);
      legL.position.set(-0.1, 0.45, 0);
      wGroup.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.75, 0.14), this.workerPantsMat);
      legR.position.set(0.1, 0.45, 0);
      wGroup.add(legR);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), this.workerVestMat);
      torso.position.y = 1.05;
      torso.castShadow = true;
      wGroup.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), this.workerSkinMat);
      head.position.y = 1.45;
      wGroup.add(head);

      const hardhat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xD9A441, roughness: 0.3 }));
      hardhat.position.y = 1.52;
      wGroup.add(hardhat);

      this.group.add(wGroup);
      this.workerMeshes.set(w.id, wGroup);
    }
  }

  public updateConveyors(conveyors: any[]) {
    for (const c of conveyors) {
      const len = Math.hypot(c.endX - c.startX, c.endZ - c.startZ);
      const angle = Math.atan2(c.endZ - c.startZ, c.endX - c.startX);

      const convGeo = new THREE.BoxGeometry(len, 0.15, 0.65);
      const convMesh = new THREE.Mesh(convGeo, this.conveyorMat);
      convMesh.position.set(
        (c.startX + c.endX) / 2,
        c.y,
        (c.startZ + c.endZ) / 2
      );
      convMesh.rotation.y = -angle;
      convMesh.receiveShadow = true;
      this.group.add(convMesh);

      const stanchionGeo = new THREE.CylinderGeometry(0.04, 0.04, c.y, 8);
      const numLegs = Math.max(2, Math.floor(len / 3));
      for (let i = 0; i <= numLegs; i++) {
        const factor = i / numLegs;
        const lx = c.startX + (c.endX - c.startX) * factor;
        const lz = c.startZ + (c.endZ - c.startZ) * factor;

        const leg = new THREE.Mesh(stanchionGeo, this.metalDarkMat);
        leg.position.set(lx, c.y / 2, lz);
        this.group.add(leg);
      }
    }
  }

  public updateProducts(products: ProductItem[]) {
    const activeIds = new Set(products.map(p => p.id));

    this.productMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.group.remove(mesh);
        this.productMeshes.delete(id);
      }
    });

    for (const p of products) {
      let mesh = this.productMeshes.get(p.id);
      if (!mesh) {
        const geo = new THREE.BoxGeometry(0.4, 0.25, 0.3);
        const mat = new THREE.MeshStandardMaterial({
          color: p.color ? parseInt(p.color.replace('#', '0x')) : 0x30356F,
          roughness: 0.4
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.name = `prod-${p.id}`;
        this.group.add(mesh);
        this.productMeshes.set(p.id, mesh);
      }

      mesh.position.set(p.x, p.y + 0.15, p.z);
    }
  }

  public animate(clockSeconds: number, overlayMode: ViewOverlayMode, machines: MachineEntity[], workers: WorkerEntity[]) {
    this.robotArms.forEach((arm, idx) => {
      const t = (clockSeconds * 1.5) + idx;
      arm.base.rotation.y = Math.sin(t) * 0.8;
      arm.arm1.rotation.z = (Math.sin(t * 1.2) * 0.4) - 0.2;
      arm.arm2.rotation.z = (Math.cos(t * 1.2) * 0.5) + 0.3;
      arm.tool.rotation.x = Math.sin(t * 2) * 0.3;
    });

    this.cncSpindles.forEach(spindle => {
      spindle.rotation.y += 0.35;
    });

    this.laserScanners.forEach(laser => {
      laser.position.z = Math.sin(clockSeconds * 3) * 0.35;
    });

    for (const w of workers) {
      const wMesh = this.workerMeshes.get(w.id);
      if (wMesh) {
        wMesh.position.set(w.x, w.y, w.z);
        if (w.state === 'working') {
          wMesh.rotation.y = Math.sin(clockSeconds * 2) * 0.1;
        }
      }
    }

    for (const m of machines) {
      const pLight = this.beaconLights.get(m.id);
      const mGroup = this.machineMeshes.get(m.id);

      if (pLight && mGroup) {
        let colorHex = 0x245B45;
        let pulseIntensity = 1.5;

        if (overlayMode === 'bottleneck_heatmap') {
          if (m.status === 'blocked' || m.cycleTime > 8.0) {
            colorHex = 0xB92343;
            pulseIntensity = 2.0 + Math.sin(clockSeconds * 6) * 1.0;
          } else if (m.status === 'starved') {
            colorHex = 0xD9A441;
          } else {
            colorHex = 0x30356F;
          }
        } else if (overlayMode === 'energy_thermal') {
          if (m.temperatureC > 45) colorHex = 0xB92343;
          else if (m.temperatureC > 30) colorHex = 0xD9A441;
          else colorHex = 0x2457C5;
        } else {
          if (m.status === 'fault') {
            colorHex = 0xB92343;
            pulseIntensity = 2.5 + Math.sin(clockSeconds * 8) * 1.5;
          } else if (m.status === 'blocked') {
            colorHex = 0xB92343;
          } else if (m.status === 'starved') {
            colorHex = 0xD9A441;
          } else if (m.status === 'running') {
            colorHex = 0x245B45;
          } else {
            colorHex = 0x5E5E70;
          }
        }

        pLight.color.setHex(colorHex);
        pLight.intensity = pulseIntensity;

        const bulb = mGroup.getObjectByName(`beacon-mesh-${m.id}`) as THREE.Mesh;
        if (bulb && bulb.material) {
          (bulb.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        }
      }
    }
  }
}
