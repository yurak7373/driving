import { Box3, PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const busViews = {
  diagonal: { label: "사선", direction: [0.87, 0.46, 0.84] },
  front: { label: "전면", direction: [0, 0.083, 1] },
  rear: { label: "후면", direction: [0, 0.083, -1] },
  left: { label: "좌측", direction: [-1, 0.083, 0] },
  right: { label: "우측", direction: [1, 0.083, 0] },
  top: { label: "상단", direction: [0, 1, 0.001] },
} as const;

export type BusView = keyof typeof busViews;

export function createBusCamera(canvas: HTMLCanvasElement, bounds: Box3) {
  const camera = new PerspectiveCamera(40, 1, 0.2, 140);
  const controls = new OrbitControls(camera, canvas);
  const size = bounds.getSize(new Vector3());
  const radius = size.length() / 2;
  bounds.getCenter(controls.target);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.024;
  controls.minDistance = radius * 1.14;
  // Keep the user zoom relative to a fit distance computed for the current viewport.
  let fitDistance = 1;

  function frame(direction: Vector3, zoom: number) {
    camera.position.copy(controls.target).add(direction);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    const vertical = Math.tan((camera.fov * Math.PI) / 360) * 0.84;
    const horizontal = vertical * camera.aspect;
    fitDistance = controls.minDistance;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const p = new Vector3(x, y, z).applyMatrix4(
            camera.matrixWorldInverse,
          );
          fitDistance = Math.max(
            fitDistance,
            1 +
              p.z +
              Math.max(Math.abs(p.x) / horizontal, Math.abs(p.y) / vertical),
          );
        }
      }
    }
    controls.maxDistance = fitDistance * 1.85;
    camera.far = Math.max(140, controls.maxDistance + radius * 3);
    camera.updateProjectionMatrix();
    camera.position
      .copy(controls.target)
      .addScaledVector(direction, fitDistance * zoom);
    controls.update();
  }

  return {
    camera,
    controls,
    setView(view: BusView) {
      frame(new Vector3(...busViews[view].direction).normalize(), 1);
    },
    resize(aspect: number) {
      const offset = camera.position.clone().sub(controls.target);
      const zoom = offset.length() / fitDistance;
      camera.aspect = aspect;
      frame(offset.normalize(), zoom);
    },
    zoom(factor: number) {
      const offset = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(offset.multiplyScalar(factor));
      controls.update();
    },
  };
}
