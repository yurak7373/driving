import { Box3, DoubleSide, Mesh, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import { busViews } from "../../src/camera/busCamera";
import {
  busConfig,
  frontAxleZ,
  rearAxleZ,
  wheelNames,
} from "../../src/vehicles/bus/busConfig";
import { createBusVisual } from "../../src/vehicles/bus/busVisual";

it("진행 방향과 위쪽으로 구한 실제 좌우에 운전석, 문, 바퀴, 조명과 시점이 있다", () => {
  const bus = createBusVisual();
  const { root } = bus;
  const node = (name: string) => {
    const result = root.getObjectByName(name);
    if (!result) throw new Error(`Missing ${name}`);
    return result;
  };
  const location = (name: string) => node(name).getWorldPosition(new Vector3());
  const front = location("FrontBody");
  const rear = location("RearBody");
  const forward = front.clone().sub(rear).normalize();
  const up = root
    .localToWorld(new Vector3(0, 1, 0))
    .sub(root.getWorldPosition(new Vector3()));
  const right = forward.clone().cross(up).normalize();
  expect(front.z).toBe(5.5);
  expect(rear.z).toBe(-5.5);
  expect(forward.toArray()).toEqual([0, 0, 1]);
  const center = root.getWorldPosition(new Vector3());
  const side = (name: string) => location(name).sub(center).dot(right);
  for (const name of [
    "DriverSeat",
    "DriverCamera",
    "Window_Driver",
    "FuelCap",
    "Wheel_FL",
    "Wheel_RL_Inner",
    "Wheel_RL_Outer",
    "Mirror_L",
    "MirrorCamera_L",
    "FrontLights_L",
    "RearLights_L",
    "Window_L_1",
    "Wiper_L",
  ])
    expect(side(name), name).toBeLessThan(0);
  for (const name of [
    "FrontDoor",
    "MiddleDoor",
    "Boarding",
    "Alighting",
    "Wheel_FR",
    "Wheel_RR_Inner",
    "Wheel_RR_Outer",
    "Mirror_R",
    "MirrorCamera_R",
    "FrontLights_R",
    "RearLights_R",
    "Window_R_1",
    "SideDestination",
    "SideIndicator_R",
    "Wiper_R",
  ])
    expect(side(name), name).toBeGreaterThan(0);
  expect(location("Boarding").z).toBeCloseTo(location("FrontDoor").z);
  expect(location("Alighting").z).toBeCloseTo(location("MiddleDoor").z);
  for (const end of ["Front", "Rear"]) {
    for (const sideName of ["L", "R"] as const) {
      const lamp = node(`${end}Lights_${sideName}`);
      const indicator = lamp.getObjectByName("TurnIndicator")!;
      const sign = sideName === "R" ? 1 : -1;
      expect(
        indicator.getWorldPosition(new Vector3()).sub(center).dot(right) * sign,
      ).toBeGreaterThan(0);
    }
  }
  expect(new Vector3(...busViews.left.direction).dot(right)).toBeLessThan(0);
  expect(new Vector3(...busViews.right.direction).dot(right)).toBeGreaterThan(
    0,
  );
  bus.dispose();
});

// Two-sided ray hits give the actual occupied intervals along X for each section.
const ray = new Raycaster(new Vector3(), new Vector3(1, 0, 0), 0, 6);
function sections(mesh: Mesh, y: number, z: number) {
  ray.ray.origin.set(-3, y, z);
  const hits = ray.intersectObject(mesh, false).map(({ point }) => point.x);
  const unique = hits.filter((x, i) => i === 0 || x - hits[i - 1] > 1e-6);
  return unique
    .slice(0, -1)
    .flatMap((x, i) => (i % 2 === 0 ? [[x, unique[i + 1]]] : []));
}

function samples(min: number, max: number, auditValues: number[]) {
  const steps = Math.max(1, Math.ceil((max - min) / 0.035));
  return [
    ...Array.from(
      { length: steps },
      (_, i) => min + ((max - min) * (i + 0.5)) / steps,
    ),
    ...auditValues.filter((point) => min < point && point < max),
  ];
}

it.each([-23, -11.5, 0, 11.5, 23])(
  "조향 %s°에서 실제 타이어 단면이 바닥·덮개·측면과 겹치지 않는다",
  (angle) => {
    const bus = createBusVisual();
    const { root } = bus;
    try {
      bus.applyPose({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        steering: (angle * Math.PI) / 180,
        wheelRoll: Math.PI * 0.63,
      });
      root.updateMatrixWorld(true);
      const exterior = root.getObjectByName("Exterior")!;
      const sectionsToTest: Array<{ mesh: Mesh; name: string; bounds: Box3 }> =
        [];
      exterior.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        // Test solids. The single-sided window panes do not enclose a volume.
        if (node.material.transparent) return;
        node.material.side = DoubleSide;
        sectionsToTest.push({
          mesh: node,
          name: node.parent?.name + "/" + node.name,
          bounds: new Box3().setFromObject(node, true),
        });
      });
      for (const name of wheelNames) {
        const wheel = root.getObjectByName(name)!;
        const axle = name.startsWith("Wheel_F") ? frontAxleZ : rearAxleZ;
        const tire = wheel.getObjectByName("Tire") as Mesh;
        expect(new Box3().setFromObject(tire, true).min.y).toBeCloseTo(0, 2);
        for (const tread of wheel.children) {
          if (
            !(tread instanceof Mesh) ||
            !["Tire", "Sidewall", "TreadGroove"].includes(tread.name)
          )
            continue;
          tread.material.side = DoubleSide;
          const tireBounds = new Box3().setFromObject(tread, true);
          for (const { mesh, name: part, bounds } of sectionsToTest) {
            if (!bounds.intersectsBox(tireBounds)) continue;
            const overlap = bounds.clone().intersect(tireBounds);
            for (const y of samples(
              overlap.min.y,
              overlap.max.y,
              [0.61, 0.91],
            )) {
              for (const z of samples(overlap.min.z, overlap.max.z, [axle])) {
                for (const [start, end] of sections(tread, y, z)) {
                  for (const [otherStart, otherEnd] of sections(mesh, y, z)) {
                    expect(
                      Math.min(end, otherEnd) - Math.max(start, otherStart),
                      `${angle}°, ${name}/${tread.name} vs ${part}, y=${y}, z=${z}`,
                    ).toBeLessThanOrEqual(1e-5);
                  }
                }
              }
            }
          }
        }
      }
      expect(busConfig.tireRadius).toBe(0.48);
    } finally {
      bus.dispose();
    }
  },
);
