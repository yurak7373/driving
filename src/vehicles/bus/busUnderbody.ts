import { Group } from "three";
import { busSides } from "./busAxes";
import { busConfig, frontAxleZ, rearAxleZ } from "./busConfig";
import type { BusMaterials } from "./busMaterials";
import type { BusParts } from "./busParts";

const {
  width,
  tireRadius,
  tireWidth,
  tireSidewallBulge,
  outerWheelInset,
  dualWheelGap,
  wheelClearance,
  visualSteeringDegrees,
} = busConfig;
const outerWheelX = width / 2 - outerWheelInset;
const tireHalfWidth = tireWidth / 2 + tireSidewallBulge;
const maxYaw = (visualSteeringDegrees * Math.PI) / 180;

// Maximize a*cos(theta) + b*sin(theta) over the permitted yaw interval.
function sweptExtent(a: number, b: number) {
  const angle = Math.min(maxYaw, Math.atan2(b, a));
  return a * Math.cos(angle) + b * Math.sin(angle);
}

export const floorTop = 0.6675;
const floorThickness = 0.115;
const floorBottom = floorTop - floorThickness;
const floorHalfWidth = 2.33 / 2;
const floorEnd = 10.53 / 2;
const tubThickness = 0.035;
const tubCeiling = 2 * tireRadius + wheelClearance;
export const tubTop = tubCeiling + tubThickness;
const tubOuter = width / 2 - 0.01;

// In the side plane yaw adds an axial offset to the tire's radius.
export const wheelOpening = Math.max(
  0.59,
  tireRadius + tireHalfWidth * Math.sin(maxYaw) + wheelClearance,
);

export const wheelBays = [
  {
    name: "Rear",
    z: rearAxleZ,
    inner:
      outerWheelX - tireWidth - dualWheelGap - tireHalfWidth - wheelClearance,
    halfLength: tireRadius + wheelClearance,
  },
  {
    name: "Front",
    z: frontAxleZ,
    inner:
      outerWheelX - sweptExtent(tireHalfWidth, tireRadius) - wheelClearance,
    halfLength: sweptExtent(tireRadius, tireHalfWidth) + wheelClearance,
  },
] as const;

export function addBusFloor(
  root: Group,
  { box }: BusParts,
  materials: BusMaterials,
) {
  const floor = new Group();
  floor.name = "Floor";
  root.add(floor);
  const floorY = (floorTop + floorBottom) / 2;
  let start = -floorEnd;

  function panel(from: number, to: number, halfWidth: number) {
    box(
      floor,
      "FloorPanel",
      materials.floor,
      [2 * halfWidth, floorThickness, to - from],
      [0, floorY, (from + to) / 2],
    );
  }

  const flangeTop = tireRadius + wheelOpening + 0.02;
  for (const { name, z, inner, halfLength } of wheelBays) {
    panel(start, z - halfLength, floorHalfWidth);
    panel(z - halfLength, z + halfLength, inner);
    start = z + halfLength;

    for (const [side, label] of busSides) {
      const tub = new Group();
      tub.name = `WheelTub_${name}_${label}`;
      tub.position.z = z;
      root.add(tub);
      const x = (side * (inner + tubOuter)) / 2;
      const coverWidth = tubOuter - inner;
      const wallHeight = tubCeiling - floorTop;
      const wallY = (floorTop + tubCeiling) / 2;
      box(
        tub,
        "TubTop",
        materials.floor,
        [
          coverWidth + tubThickness,
          tubThickness,
          2 * (halfLength + tubThickness),
        ],
        [x - (side * tubThickness) / 2, (tubTop + tubCeiling) / 2, 0],
      );
      box(
        tub,
        "TubInnerWall",
        materials.floor,
        [tubThickness, wallHeight, 2 * halfLength],
        [side * (inner - tubThickness / 2), wallY, 0],
      );
      // Close the gap above the cover where it meets the curved exterior opening.
      box(
        tub,
        "TubOuterFlange",
        materials.floor,
        [tubThickness, flangeTop - tubTop, 2 * (halfLength + tubThickness)],
        [side * (tubOuter - tubThickness / 2), (flangeTop + tubTop) / 2, 0],
      );
      for (const end of [-1, 1]) {
        box(
          tub,
          "TubEndWall",
          materials.floor,
          [coverWidth + tubThickness, wallHeight, tubThickness],
          [
            x - (side * tubThickness) / 2,
            wallY,
            end * (halfLength + tubThickness / 2),
          ],
        );
      }
    }
  }
  panel(start, floorEnd, floorHalfWidth);
}
