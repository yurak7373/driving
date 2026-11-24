import {
  BoxGeometry,
  Group,
  Mesh,
  type Material,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type Dimensions = readonly [number, number, number];

export function createBusParts() {
  const boxes = new Map<string, BufferGeometry>();

  function box(
    parent: Group,
    name: string,
    material: Material,
    size: Dimensions,
    position: Dimensions,
    radius = 0,
  ) {
    const key = [...size, radius].join("/");
    let geometry = boxes.get(key);
    if (!geometry) {
      geometry = radius
        ? new RoundedBoxGeometry(...size, 2, radius)
        : new BoxGeometry(...size);
      boxes.set(key, geometry);
    }
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  return { box };
}

export type BusParts = ReturnType<typeof createBusParts>;
