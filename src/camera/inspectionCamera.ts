import { Box3, PerspectiveCamera, Vector3 } from "three";
import type { CameraView } from "../scenes/sceneState";

const viewPositions = {
  orbit: new Vector3(8.5, 7.2, 11),
  top: new Vector3(0, 18, 0.01),
};
const frameMargin = 0.85;

function boxCorners({ min, max }: Box3) {
  return [min.x, max.x].flatMap((x) =>
    [min.y, max.y].flatMap((y) =>
      [min.z, max.z].map((z) => new Vector3(x, y, z)),
    ),
  );
}

export function setCameraView(
  camera: PerspectiveCamera,
  view: CameraView,
  bounds: Box3,
) {
  camera.position.copy(viewPositions[view]);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const verticalSlope =
    Math.tan((camera.getEffectiveFOV() * Math.PI) / 360) * frameMargin;
  const horizontalSlope = verticalSlope * camera.aspect;
  const corners = boxCorners(bounds).map((corner) =>
    corner.applyMatrix4(camera.matrixWorldInverse),
  );
  // Moving back adds the same amount of depth to every corner.
  const retreat = Math.max(
    0,
    ...corners.map(
      ({ x, y, z }) =>
        z +
        Math.max(
          Math.abs(x) / horizontalSlope,
          Math.abs(y) / verticalSlope,
          camera.near * 2,
        ),
    ),
  );
  camera.translateZ(retreat);
  camera.far = Math.max(70, ...corners.map(({ z }) => retreat - z + 1));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

export function projectObjectBounds(bounds: Box3, camera: PerspectiveCamera) {
  const projected = boxCorners(bounds).map((corner) => corner.project(camera));
  return new Box3().setFromPoints(projected);
}
