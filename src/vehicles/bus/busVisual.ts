import { Group, Object3D } from "three";
import { getMeshResources } from "../../core/modelResources";
import {
  frontZ,
  liveryConfig,
  rearZ,
  requiredNodes,
  wheelNames,
  type BusLivery,
} from "./busConfig";
import { addBusExterior, type BusDecals } from "./busExterior";
import { createBusMaterials } from "./busMaterials";
import { createBusParts } from "./busParts";
import { addBusSides } from "./busSides";
import { addBusWheels } from "./busWheels";

export interface BusVisualPose {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  steering: number;
  wheelRoll: number;
}

export function createBusVisual(decals: BusDecals = {}) {
  const root = new Group();
  root.name = "BusRoot";
  const exterior = new Group();
  exterior.name = "Exterior";
  root.add(exterior);
  const parts = createBusParts();
  const m = createBusMaterials();
  const { steering, rolls } = addBusWheels(root, m);
  addBusSides(exterior, parts, m);
  addBusExterior(exterior, parts, m, decals);

  const interiorAnchors = {
    DriverSeat: [-0.74, 0.82, frontZ - 1.07],
    Dashboard: [-0.68, 1.28, frontZ - 0.72],
    SteeringWheel: [-0.7, 1.39, frontZ - 0.91],
    Boarding: [0.98, 0.65, 4.42],
    Alighting: [0.98, 0.65, -0.66],
    Aisle: [0, 0.69, 0],
    PassengerSeatZone: [-0.76, 0.69, 0.25],
    GrabRail: [0, 2.37, 0],
    InteriorLight: [0, 2.78, 0.1],
  } as const;
  const cameraAnchors = {
    DriverCamera: [-0.74, 1.77, frontZ - 1.21],
    PassengerCamera: [-0.35, 1.71, -3.24],
    MirrorCamera_L: [-1.51, 2.41, 5.08],
    MirrorCamera_R: [1.51, 2.41, 5.08],
    RearCamera: [0, 2.43, rearZ + 0.09],
  } as const;
  addAnchors("InteriorAnchors", interiorAnchors);
  addAnchors("CameraAnchors", cameraAnchors);

  function addAnchors(
    name: string,
    anchors: Record<string, readonly [number, number, number]>,
  ) {
    const group = new Group();
    group.name = name;
    root.add(group);
    for (const [key, position] of Object.entries(anchors)) {
      const anchor = new Object3D();
      anchor.name = key;
      anchor.position.set(...position);
      if (key === "RearCamera" || key.startsWith("MirrorCamera_"))
        anchor.rotation.y = Math.PI;
      group.add(anchor);
    }
  }

  function applyLivery(livery: BusLivery) {
    m.paint.color.set(liveryConfig[livery].color);
    m.accent.color.set(liveryConfig[livery].accent);
  }

  const { geometries, materials } = getMeshResources(root);
  // Destination and decal maps belong to the scene and can survive a vehicle swap.
  const materialSet = new Set([...materials, ...Object.values(m)]);
  let disposed = false;
  applyLivery("green");

  return {
    root,
    applyLivery,
    getPaintColor: () => `#${m.paint.color.getHexString()}`,
    applyPose({
      position,
      rotation,
      steering: angle,
      wheelRoll,
    }: BusVisualPose) {
      root.position.set(...position);
      root.rotation.set(...rotation);
      for (const pivot of steering) pivot.rotation.y = angle;
      for (const wheel of rolls) wheel.rotation.x = wheelRoll;
    },
    getWheelPose: () => [steering[0].rotation.y, rolls[0].rotation.x],
    inspect() {
      return {
        missing: requiredNodes.filter((name) => !root.getObjectByName(name)),
        wheels: wheelNames.filter((name) => root.getObjectByName(name)),
        frontDoor: Boolean(root.getObjectByName("FrontDoor")),
        middleDoor: Boolean(root.getObjectByName("MiddleDoor")),
        geometries: geometries.size,
        materials: materialSet.size,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materialSet.forEach((material) => material.dispose());
    },
  };
}

export type BusVisual = ReturnType<typeof createBusVisual>;
