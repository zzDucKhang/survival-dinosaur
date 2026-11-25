import * as THREE from 'three';
import type { AnimState, DietType, DinoModelType } from '../types/game';

export interface DinoSpec {
  id: DinoModelType;
  name: string;
  species: string;
  diet: DietType;
  fileName: string;
  badge: string;
  description: string;
  icon: string;
  modelPath: string;
  targetSize: number;
  rotationOffset?: number;
  nametagHeight: number;
  camDistance: number;
  camHeight: number;
  lookAtY: number;
  turnSpeed: number;
  walkSpeed: number;
  sprintSpeed: number;
  backSpeed: number;
}

export interface WorldRock {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
  radius: number;
}

// Deterministic rock coordinates matching server/internal/world/obstacles.go 100%
export const WORLD_ROCKS: WorldRock[] = (() => {
  const list: WorldRock[] = [];
  for (let i = 0; i < 45; i++) {
    const angle = (i / 45) * Math.PI * 2 + (i % 7);
    const dist = 22 + ((i * 4.7) % 105);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.hypot(x - 25, z - -25) < 19) continue;

    const sy = 1.3 + (i % 5) * 0.95;
    const sx = 1.2 + (i % 3) * 1.3;
    const sz = 1.2 + (i % 4) * 1.2;
    list.push({
      pos: [x, sy * 0.35, z],
      scale: [sx, sy, sz],
      rot: i * 0.9,
      radius: Math.max(sx, sz) * 1.15,
    });
  }
  return list;
})();

const discoveredGlbFiles = import.meta.glob('/public/models/*.glb');
const discoveredJsonConfigs = import.meta.glob('/public/models/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Partial<DinoSpec>>;

const PRESET_SPECS: Record<string, Partial<DinoSpec>> = {
  trex: {
    name: 'T-Rex Apex',
    species: 'Tyrannosaurus Rex (Adult)',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Bạo chúa đỉnh chuỗi thức ăn (150 HP), cú cắn gây chảy máu nặng.',
    icon: '🦖',
    targetSize: 4.4,
    rotationOffset: 0,
    nametagHeight: 3.4,
    camDistance: 10.5,
    camHeight: 3.8,
    lookAtY: 1.5,
    turnSpeed: 3.2,
    walkSpeed: 7.5,
    sprintSpeed: 14.5,
    backSpeed: 5.5,
  },
  't-rex': {
    name: 'T-Rex Alpha',
    species: 'Tyrannosaurus Rex (Alpha)',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Săn mồi cân bằng giữa tốc độ và sức cắn (135 HP).',
    icon: '🦖',
    targetSize: 4.0,
    rotationOffset: 0,
    nametagHeight: 3.1,
    camDistance: 9.5,
    camHeight: 3.5,
    lookAtY: 1.4,
    turnSpeed: 3.5,
    walkSpeed: 8.0,
    sprintSpeed: 15.0,
    backSpeed: 6.0,
  },
  tyranno: {
    name: 'Tyranno Juvie',
    species: 'Tyrannosaurus (Juvenile)',
    diet: 'carnivore',
    badge: 'TỐC ĐỘ CAO',
    description: 'Sát thủ tốc độ cao (110 HP), rẽ ngoặt nhanh, săn mồi cực nhạy.',
    icon: '🦎',
    targetSize: 3.1,
    rotationOffset: -Math.PI / 2,
    nametagHeight: 2.6,
    camDistance: 8.2,
    camHeight: 3.0,
    lookAtY: 1.1,
    turnSpeed: 4.0,
    walkSpeed: 9.0,
    sprintSpeed: 17.0,
    backSpeed: 6.8,
  },
  tricera: {
    name: 'Triceratops',
    species: 'Triceratops Horridus',
    diet: 'herbivore',
    badge: 'ĂN CỎ • TANK',
    description: 'Khủng long 3 sừng giáp dày (175 HP), húc văng kẻ săn mồi.',
    icon: '🦕',
    targetSize: 4.2,
    nametagHeight: 3.0,
    camDistance: 10.2,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 2.9,
    walkSpeed: 6.8,
    sprintSpeed: 13.0,
    backSpeed: 4.8,
  },
  stego: {
    name: 'Stegosaurus',
    species: 'Stegosaurus Stenops',
    diet: 'herbivore',
    badge: 'ĂN CỎ • GAI ĐUÔI',
    description: 'Giáp lưng gai sắc bén (165 HP), quất đuôi (E) sát thương diện rộng.',
    icon: '🦕',
    targetSize: 4.3,
    nametagHeight: 3.1,
    camDistance: 10.2,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 2.8,
    walkSpeed: 6.5,
    sprintSpeed: 12.2,
    backSpeed: 4.5,
  },
  mammoth: {
    name: 'Woolly Mammoth',
    species: 'Mammuthus Primigenius',
    diet: 'herbivore',
    badge: 'ĂN CỎ • KHỔNG LỒ',
    description: 'Voi ma mút tiền sử siêu trâu (210 HP), đầm chắc và mạnh mẽ.',
    icon: '🦣',
    targetSize: 4.8,
    nametagHeight: 3.6,
    camDistance: 11.5,
    camHeight: 4.2,
    lookAtY: 1.7,
    turnSpeed: 2.5,
    walkSpeed: 6.4,
    sprintSpeed: 12.0,
    backSpeed: 4.4,
  },
  dino_hunter_deadly_shores_vicious: {
    name: 'Vicious Predator',
    species: 'Deadly Shores Hunter',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Dã thú săn mồi hung tợn (130 HP), tốc độ vồ mồi chớp nhoáng.',
    icon: '🦖',
    targetSize: 3.9,
    nametagHeight: 3.0,
    camDistance: 9.5,
    camHeight: 3.5,
    lookAtY: 1.4,
    turnSpeed: 3.6,
    walkSpeed: 8.2,
    sprintSpeed: 15.8,
    backSpeed: 6.0,
  },
};

function formatSpeciesTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function createDefaultSpec(id: string, fileName: string): DinoSpec {
  const title = formatSpeciesTitle(id);
  const preset = PRESET_SPECS[id] || {};
  const jsonOverrideKey = Object.keys(discoveredJsonConfigs).find((k) =>
    k.toLowerCase().endsWith(`/${id}.json`)
  );
  const externalJson = jsonOverrideKey ? discoveredJsonConfigs[jsonOverrideKey] : {};

  return {
    id,
    name: title,
    species: title,
    diet: 'carnivore',
    fileName,
    badge: 'LOÀI MỚI',
    description: `Mô hình khủng long tự động nạp từ public/models/${fileName}.`,
    icon: '🦕',
    modelPath: `/models/${fileName}`,
    targetSize: 4.0,
    nametagHeight: 3.1,
    camDistance: 10.0,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 3.0,
    walkSpeed: 7.2,
    sprintSpeed: 14.0,
    backSpeed: 5.2,
    ...preset,
    ...externalJson,
  };
}

function buildDinosaurRegistry(): Record<string, DinoSpec> {
  const registry: Record<string, DinoSpec> = {};
  for (const fullPath of Object.keys(discoveredGlbFiles)) {
    const match = fullPath.match(/\/([^/]+\.glb)$/i);
    if (!match) continue;
    const fileName = match[1];
    const id = fileName.replace(/\.glb$/i, '').toLowerCase();
    registry[id] = createDefaultSpec(id, fileName);
  }
  if (Object.keys(registry).length === 0) {
    registry['trex'] = createDefaultSpec('trex', 'trex.glb');
  }
  return registry;
}

export const DINOSAURS: Record<string, DinoSpec> = buildDinosaurRegistry();

export function getDinoSpec(modelId?: string): DinoSpec {
  if (modelId) {
    const normalized = modelId.toLowerCase();
    if (DINOSAURS[normalized]) {
      return DINOSAURS[normalized];
    }
  }
  return DINOSAURS['trex'] || Object.values(DINOSAURS)[0];
}

export interface DinoNormalizationResult {
  scale: number;
  offsetY: number;
  autoForwardYaw: number;
  isQuadruped: boolean;
}

export function computeDinoNormalization(
  root: THREE.Object3D,
  targetSize: number,
  explicitOffset?: number
): DinoNormalizationResult {
  const measureWrapper = new THREE.Group();
  const prevParent = root.parent;
  measureWrapper.add(root);
  measureWrapper.updateMatrixWorld(true);

  const geomBox = new THREE.Box3();
  const boneBox = new THREE.Box3();
  const tempVec = new THREE.Vector3();

  let headBonePos: THREE.Vector3 | null = null;
  let rearBonePos: THREE.Vector3 | null = null;

  root.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      child.getWorldPosition(tempVec);
      boneBox.expandByPoint(tempVec);

      const bName = child.name.toLowerCase();
      if (!headBonePos && (bName.includes('head') || bName.includes('snout') || bName.includes('jaw'))) {
        headBonePos = tempVec.clone();
      }
      if (!rearBonePos && (bName.includes('tail') || bName.includes('pelvis') || bName.includes('hips'))) {
        rearBonePos = tempVec.clone();
      }
    }
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          const b = mesh.geometry.boundingBox.clone();
          b.applyMatrix4(mesh.matrixWorld);
          geomBox.union(b);
        }
      }
    }
  });

  measureWrapper.remove(root);
  if (prevParent) {
    prevParent.add(root);
  }

  const geomSize = new THREE.Vector3();
  geomBox.getSize(geomSize);
  const geomMax = Math.max(geomSize.x, geomSize.y, geomSize.z);

  const boneSize = new THREE.Vector3();
  boneBox.getSize(boneSize);
  const boneMax = Math.max(boneSize.x, boneSize.y, boneSize.z);

  let chosenBox = geomBox;
  let chosenSize = geomSize;
  let maxDim = geomMax;

  if (boneMax > geomMax * 1.2 && isFinite(boneMax) && boneMax < 10000) {
    chosenBox = boneBox;
    chosenSize = boneSize;
    maxDim = boneMax * 1.25;
  }

  if (!isFinite(maxDim) || maxDim < 0.05) {
    maxDim = targetSize;
  }

  let autoForwardYaw = 0;
  if (typeof explicitOffset === 'number') {
    autoForwardYaw = explicitOffset;
  } else if (headBonePos && rearBonePos) {
    const dx = (headBonePos as THREE.Vector3).x - (rearBonePos as THREE.Vector3).x;
    const dz = (headBonePos as THREE.Vector3).z - (rearBonePos as THREE.Vector3).z;
    if (Math.hypot(dx, dz) > 0.01) {
      const rawYaw = -Math.atan2(dx, dz);
      const quarterTurn = Math.PI / 2;
      autoForwardYaw = Math.round(rawYaw / quarterTurn) * quarterTurn;
    }
  } else if (chosenSize.x > chosenSize.z * 1.25) {
    autoForwardYaw = -Math.PI / 2;
  }

  const horizontalLength = Math.max(chosenSize.x, chosenSize.z);
  const horizontalWidth = Math.min(chosenSize.x, chosenSize.z);
  const isQuadruped =
    horizontalLength > chosenSize.y * 1.25 && horizontalLength > horizontalWidth * 1.35;

  const scale = targetSize / maxDim;
  const offsetY = isFinite(chosenBox.min.y) ? -chosenBox.min.y * scale : 0;

  return { scale, offsetY, autoForwardYaw, isQuadruped };
}

export function getDinoAction(
  actions: Record<string, THREE.AnimationAction | null>,
  animType: AnimState
): THREE.AnimationAction | null {
  if (!actions) return null;
  const names = Object.keys(actions);
  if (names.length === 0) return null;

  const findMatch = (keywords: string[]) => {
    for (const kw of keywords) {
      const match = names.find((n) => n.toLowerCase().includes(kw));
      if (match && actions[match]) {
        return actions[match];
      }
    }
    return null;
  };

  switch (animType) {
    case 'idle':
      return findMatch(['idle', 'stand', 'wait', 'breathe', 'rest']) || actions[names[0]] || null;
    case 'walk':
      return (
        findMatch(['walk', 'trot', 'step', 'move', 'run', 'locomotion']) ||
        actions[names[Math.min(1, names.length - 1)]] ||
        actions[names[0]] ||
        null
      );
    case 'run':
      return (
        findMatch(['run', 'gallop', 'sprint', 'chase', 'walk', 'move']) ||
        actions[names[Math.min(1, names.length - 1)]] ||
        actions[names[0]] ||
        null
      );
    case 'bite':
      return (
        findMatch(['bite', 'attack', 'horn', 'headbutt', 'chomp', 'strike', 'eat']) ||
        actions[names[0]] ||
        null
      );
    case 'roar':
      return findMatch(['roar', 'screech', 'bellow', 'call', 'scream']) || actions[names[0]] || null;
    case 'tail':
      return findMatch(['tail', 'whip', 'swipe', 'stomp', 'attack2']) || actions[names[0]] || null;
    default:
      return actions[names[0]] || null;
  }
}