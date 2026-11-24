import { Vector3 } from "three";

export const busForward = [0, 0, 1] as const;
export const busUp = [0, 1, 0] as const;

// From the driver's perspective, forward × up points to the right.
const right = new Vector3(...busForward).cross(new Vector3(...busUp));
export const busSideX = { left: -right.x, right: right.x } as const;
export const busSides = [
  [busSideX.left, "L"],
  [busSideX.right, "R"],
] as const;
