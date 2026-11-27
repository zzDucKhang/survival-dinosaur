import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export function setupMeshoptLoader(loader: unknown): void {
  const gltfLoader = loader as { setMeshoptDecoder?: (decoder: unknown) => void };
  if (gltfLoader && typeof gltfLoader.setMeshoptDecoder === 'function') {
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }
}