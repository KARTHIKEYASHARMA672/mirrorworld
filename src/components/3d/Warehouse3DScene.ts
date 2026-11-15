import * as THREE from 'three';
import { MachineEntity, WorkerEntity, AgvEntity, ProductItem, ViewOverlayMode } from '../../types/simulation';

export class Warehouse3DScene {
  public group: THREE.Group;
  private machineMeshes: Map<string, THREE.Group> = new Map();
  private workerMeshes: Map<string, THREE.Group> = new Map();
  private agvMeshes: Map<string, THREE.Group> = new Map();
  private productMeshes: Map<string, THREE.Mesh> = new Map();
  private agvLidars: Array<THREE.Mesh> = [];

  // Materials
  private floorMat: THREE.MeshStandardMaterial;
  private rackUprightMat: THREE.MeshStandardMaterial;
  private rackBeamMat: THREE.MeshStandardMaterial;
  private woodPalletMat: THREE.MeshStandardMaterial;
  private boxCardboardMat: THREE.MeshStandardMaterial;
  private agvBodyMat: THREE.MeshStandardMaterial;
  private metalDarkMat: THREE.MeshStandardMaterial;
  private cautionStripeMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0xDDD6C6,
      roughness: 0.55,
      metalness: 0.1
    });

    this.rackUprightMat = new THREE.MeshStandardMaterial({
      color: 0x2457C5,
      roughness: 0.35,
      metalness: 0.6
    });

    this.rackBeamMat = new THREE.MeshStandardMaterial({
      color: 0xD9A441,
      roughness: 0.4,
      metalness: 0.5
    });

    this.woodPalletMat = new THREE.MeshStandardMaterial({
      color: 0xB59873,
      roughness: 0.8
    });

    this.boxCardboardMat = new THREE.MeshStandardMaterial({
      color: 0xC8A278,
      roughness: 0.85
    });

    this.agvBodyMat = new THREE.MeshStandardMaterial({
      color: 0x30356F,
      roughness: 0.3,
      metalness: 0.7
    });

    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1E2235,
      roughness: 0.35,
      metalness: 0.8
    });

    this.cautionStripeMat = new THREE.MeshStandardMaterial({
      color: 0xD9A441,
      roughness: 0.5
    });

    this.buildWarehouseInfrastructure();
  }

  private buildWarehouseInfrastructure() {
    const floorGeo = new THREE.PlaneGeometry(65, 45);
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const laneMat = new THREE.MeshBasicMaterial({ color: 0xF3E7CE });
    const dashLaneMat = new THREE.MeshBasicMaterial({ color: 0xD9A441 });

    for (const z of [-9, -5, 1, 5, 9]) {
      const lane = new THREE.Mesh(new THREE.PlaneGeometry(45, 0.15), laneMat);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.01, z);
      this.group.add(lane);
    }

    for (const x of [-16, -6, 2, 10, 16]) {
      const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 26), dashLaneMat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(x, 0.01, 0);
      this.group.add(cross);
    }

    for (let x = -24; x <= 24; x += 16) {
      for (let z of [-18, 18]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, 9, 0.7), this.metalDarkMat);
        col.position.set(x, 4.5, z);
        col.castShadow = true;
        this.group.add(col);

        const yellowBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 1.0), this.cautionStripeMat);
        yellowBase.position.set(x, 0.2, z);
        this.group.add(yellowBase);
      }
    }
  }

  public populateWarehouse(machines: MachineEntity[], agvs: AgvEntity[], workers: WorkerEntity[]) {
    this.machineMeshes.forEach(mesh => this.group.remove(mesh));
    this.machineMeshes.clear();
    this.agvMeshes.forEach(mesh => this.group.remove(mesh));
    this.agvMeshes.clear();
    this.workerMeshes.forEach(mesh => this.group.remove(mesh));
    this.workerMeshes.clear();
    this.agvLidars = [];

    for (const m of machines) {
      const mGroup = new THREE.Group();
      mGroup.position.set(m.x, m.y, m.z);
      mGroup.rotation.y = m.rotationY;
      mGroup.name = m.id;

      if (m.type === 'racks') {
        this.buildPalletRacksMesh(mGroup, m);
      } else if (m.type === 'sorter') {
        this.buildSorterMesh(mGroup, m);
      } else if (m.type === 'manual_assembly') {
        this.buildMezzaninePickStation(mGroup, m);
      } else if (m.type === 'dock_in' || m.type === 'dock_out') {
        this.buildDockDoorMesh(mGroup, m);
      } else {
        const box = new THREE.Mesh(new THREE.BoxGeometry(m.width, m.height, m.depth), this.agvBodyMat);
        box.position.y = m.height / 2;
        mGroup.add(box);
      }

      this.group.add(mGroup);
      this.machineMeshes.set(m.id, mGroup);
    }

    for (const agv of agvs) {
      const agvGroup = new THREE.Group();
      agvGroup.position.set(agv.x, agv.y, agv.z);
      agvGroup.name = agv.id;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.9), this.agvBodyMat);
      body.position.y = 0.14;
      body.castShadow = true;
      agvGroup.add(body);

      const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.88), this.cautionStripeMat);
      bumperF.position.set(0.6, 0.14, 0);
      agvGroup.add(bumperF);

      const bumperB = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.88), this.cautionStripeMat);
      bumperB.position.set(-0.6, 0.14, 0);
      agvGroup.add(bumperB);

      const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), this.metalDarkMat);
      lidar.position.set(0.4, 0.34, 0);
      agvGroup.add(lidar);
      this.agvLidars.push(lidar);

      const spotPlane = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.85, 24),
        new THREE.MeshBasicMaterial({ color: 0x2457C5, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      spotPlane.rotation.x = -Math.PI / 2;
      spotPlane.position.set(0, 0.02, 0);
      agvGroup.add(spotPlane);

      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.8), this.metalDarkMat);
      deck.position.y = 0.3;
      agvGroup.add(deck);

      this.group.add(agvGroup);
      this.agvMeshes.set(agv.id, agvGroup);
    }

    for (const w of workers) {
      const wGroup = new THREE.Group();
      wGroup.position.set(w.x, w.y, w.z);
      wGroup.name = w.id;

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.14), new THREE.MeshStandardMaterial({ color: 0x22263C }));
      legL.position.set(-0.1, 0.45, 0);
      wGroup.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.14), new THREE.MeshStandardMaterial({ color: 0x22263C }));
      legR.position.set(0.1, 0.45, 0);
      wGroup.add(legR);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), this.cautionStripeMat);
      torso.position.y = 1.05;
      torso.castShadow = true;
      wGroup.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xD29B78 }));
      head.position.y = 1.45;
      wGroup.add(head);

      const hardhat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
      hardhat.position.y = 1.52;
      wGroup.add(hardhat);

      this.group.add(wGroup);
      this.workerMeshes.set(w.id, wGroup);
    }
  }

  private buildPalletRacksMesh(group: THREE.Group, m: MachineEntity) {
    const bays = 4;
    const tiers = 3;
    const bayWidth = m.width / bays;
    const tierHeight = m.height / tiers;

    for (let b = 0; b <= bays; b++) {
      const xPos = (-m.width / 2) + (b * bayWidth);
      for (const zOffset of [-m.depth * 0.4, m.depth * 0.4]) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.15, m.height, 0.15), this.rackUprightMat);
        upright.position.set(xPos, m.height / 2, zOffset);
        upright.castShadow = true;
        group.add(upright);
      }
    }

    for (let t = 1; t <= tiers; t++) {
      const yPos = t * tierHeight;
      const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(m.width, 0.12, 0.1), this.rackBeamMat);
      frontBeam.position.set(0, yPos, m.depth * 0.4);
      group.add(frontBeam);

      const backBeam = new THREE.Mesh(new THREE.BoxGeometry(m.width, 0.12, 0.1), this.rackBeamMat);
      backBeam.position.set(0, yPos, -m.depth * 0.4);
      group.add(backBeam);

      for (let b = 0; b < bays; b++) {
        const bx = (-m.width / 2) + (b * bayWidth) + (bayWidth / 2);

        const pallet = new THREE.Mesh(new THREE.BoxGeometry(bayWidth * 0.75, 0.12, m.depth * 0.65), this.woodPalletMat);
        pallet.position.set(bx, yPos + 0.08, 0);
        pallet.castShadow = true;
        group.add(pallet);

        for (let cz = -0.5; cz <= 0.5; cz += 0.5) {
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, tierHeight * 0.55, 0.7),
            this.boxCardboardMat
          );
          box.position.set(bx + (cz * 0.2), yPos + 0.12 + (tierHeight * 0.28), cz * 0.4);
          box.castShadow = true;
          group.add(box);
        }
      }
    }
  }

  private buildSorterMesh(group: THREE.Group, m: MachineEntity) {
    const loop = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.8, 1.2, m.depth * 0.9), this.metalDarkMat);
    loop.position.y = 0.8;
    loop.castShadow = true;
    group.add(loop);

    for (let c = -3; c <= 3; c += 2) {
      const chute = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.8), this.rackBeamMat);
      chute.rotation.x = 0.35;
      chute.position.set(m.width * 0.45, 0.8, c);
      group.add(chute);
    }
  }

  private buildMezzaninePickStation(group: THREE.Group, m: MachineEntity) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(m.width, 0.2, m.depth), this.metalDarkMat);
    deck.position.y = 1.0;
    deck.castShadow = true;
    group.add(deck);

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(m.width * 0.8, 1.5, 0.5), this.rackUprightMat);
    shelf.position.set(0, 1.85, -m.depth * 0.35);
    group.add(shelf);

    for (let l = -3; l <= 3; l += 1.5) {
      const indicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xD9A441 })
      );
      indicator.position.set(l * 0.4, 2.2, (-m.depth * 0.35) + 0.28);
      group.add(indicator);
    }
  }

  private buildDockDoorMesh(group: THREE.Group, m: MachineEntity) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(m.width, m.height, 0.3), this.metalDarkMat);
    frame.position.y = m.height / 2;
    group.add(frame);

    const door = new THREE.Mesh(new THREE.PlaneGeometry(m.width * 0.85, m.height * 0.85), new THREE.MeshStandardMaterial({ color: 0x8C92A4, roughness: 0.4 }));
    door.position.set(0, m.height * 0.5, 0.16);
    group.add(door);

    const border = new THREE.Mesh(new THREE.BoxGeometry(m.width, 0.2, 0.35), this.cautionStripeMat);
    border.position.set(0, 0.1, 0);
    group.add(border);
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
        const geo = new THREE.BoxGeometry(0.45, 0.35, 0.45);
        const mat = new THREE.MeshStandardMaterial({
          color: p.color ? parseInt(p.color.replace('#', '0x')) : 0xD9A441,
          roughness: 0.7
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.group.add(mesh);
        this.productMeshes.set(p.id, mesh);
      }
      mesh.position.set(p.x, p.y + 0.2, p.z);
    }
  }

  public animate(clockSeconds: number, overlayMode: ViewOverlayMode, agvs: AgvEntity[], workers: WorkerEntity[]) {
    this.agvLidars.forEach(lidar => {
      lidar.rotation.y += 0.25;
    });

    for (const agv of agvs) {
      const agvGroup = this.agvMeshes.get(agv.id);
      if (agvGroup) {
        const dx = agv.targetX - agvGroup.position.x;
        const dz = agv.targetZ - agvGroup.position.z;
        if (Math.hypot(dx, dz) > 0.05) {
          const targetHeading = Math.atan2(dx, dz);
          agvGroup.rotation.y = THREE.MathUtils.lerp(agvGroup.rotation.y, targetHeading, 0.1);
        }
        agvGroup.position.set(agv.x, agv.y, agv.z);
      }
    }

    for (const w of workers) {
      const wGroup = this.workerMeshes.get(w.id);
      if (wGroup) {
        wGroup.position.set(w.x, w.y, w.z);
      }
    }
  }
}
