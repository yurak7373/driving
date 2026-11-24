import {
  CylinderGeometry,
  Group,
  Mesh,
  TorusGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import { busConfig, frontAxleZ, rearAxleZ } from "./busConfig";
import type { BusMaterials } from "./busMaterials";

export function addBusWheels(root: Group, materials: BusMaterials) {
  const { tireRadius, tireWidth, width } = busConfig;
  const tire = new CylinderGeometry(tireRadius, tireRadius, tireWidth, 40);
  const shoulder = new TorusGeometry(tireRadius - 0.035, 0.033, 8, 40);
  const rim = new CylinderGeometry(0.267, 0.267, tireWidth + 0.007, 36);
  const hub = new CylinderGeometry(0.112, 0.112, 0.085, 24);
  const lug = new CylinderGeometry(0.021, 0.021, 0.03, 8);
  const groove = new TorusGeometry(tireRadius - 0.012, 0.006, 4, 40);
  const steering: Group[] = [];
  const rolls: Group[] = [];

  function mesh(
    parent: Group,
    name: string,
    geometry: BufferGeometry,
    material: Material,
  ) {
    const child = new Mesh(geometry, material);
    child.name = name;
    parent.add(child);
    return child;
  }

  function wheel(parent: Group, name: string, lateral: number, side: number) {
    const roll = new Group();
    roll.name = name;
    roll.position.x = lateral;
    parent.add(roll);
    rolls.push(roll);
    mesh(roll, "Tire", tire, materials.rubber).rotation.z = Math.PI / 2;
    mesh(roll, "Rim", rim, materials.alloy).rotation.z = Math.PI / 2;
    for (const sign of [-1, 1]) {
      const edge = mesh(roll, "Sidewall", shoulder, materials.rubber);
      edge.rotation.y = Math.PI / 2;
      edge.position.x = (sign * tireWidth) / 2;
    }
    for (const offset of [-0.066, 0, 0.066]) {
      const tread = mesh(roll, "TreadGroove", groove, materials.tread);
      tread.rotation.y = Math.PI / 2;
      tread.position.x = offset;
    }
    const center = mesh(roll, "Hub", hub, materials.dark);
    center.rotation.z = Math.PI / 2;
    center.position.x = side * (tireWidth / 2 + 0.025);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const bolt = mesh(roll, "Lug", lug, materials.chrome);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(
        side * (tireWidth / 2 + 0.018),
        Math.cos(angle) * 0.171,
        Math.sin(angle) * 0.171,
      );
    }
  }

  const axleGeometry = new CylinderGeometry(0.092, 0.092, width - 0.38, 16);
  const front = new Group();
  front.name = "FrontAxle";
  front.position.set(0, tireRadius, frontAxleZ);
  const rear = new Group();
  rear.name = "RearAxle";
  rear.position.set(0, tireRadius, rearAxleZ);
  root.add(front, rear);
  for (const axle of [front, rear]) {
    mesh(axle, "AxleBeam", axleGeometry, materials.dark).rotation.z =
      Math.PI / 2;
  }
  const outerX = width / 2 - 0.19;
  for (const [side, label] of [
    [-1, "L"],
    [1, "R"],
  ] as const) {
    const pivot = new Group();
    pivot.name = `Steering_${label}`;
    pivot.position.x = side * outerX;
    front.add(pivot);
    steering.push(pivot);
    wheel(pivot, `Wheel_F${label}`, 0, side);
    wheel(rear, `Wheel_R${label}_Outer`, side * outerX, side);
    wheel(
      rear,
      `Wheel_R${label}_Inner`,
      side * (outerX - tireWidth - 0.075),
      side,
    );
  }
  return { steering, rolls };
}
