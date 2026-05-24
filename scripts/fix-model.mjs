import { NodeIO } from '@gltf-transform/core';
import { normals } from '@gltf-transform/functions';

const path = process.argv[2] || 'public/models/lattice.glb';
const io = new NodeIO();
const doc = await io.read(path);
const root = doc.getRoot();

// Assign a white matte material to all material-less primitives
const mat = doc.createMaterial('default')
  .setBaseColorFactor([0.9, 0.9, 0.9, 1.0])
  .setMetallicFactor(0.0)
  .setRoughnessFactor(0.55);

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    if (!prim.getMaterial()) prim.setMaterial(mat);
  }
}

// Compute smooth vertex normals (required for proper shading)
await doc.transform(normals({ overwrite: true }));

await io.write(path, doc);

const meshCount = root.listMeshes().length;
const matCount = root.listMaterials().length;
console.log(`Done — ${meshCount} mesh(es), ${matCount} material(s), normals generated.`);
