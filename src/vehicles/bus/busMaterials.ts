import { DoubleSide, MeshStandardMaterial } from "three";

export function createBusMaterials() {
  return {
    white: new MeshStandardMaterial({
      color: "#f3f3ed",
      roughness: 0.37,
      metalness: 0.12,
    }),
    paint: new MeshStandardMaterial({ roughness: 0.38, metalness: 0.13 }),
    accent: new MeshStandardMaterial({ roughness: 0.46 }),
    dark: new MeshStandardMaterial({ color: "#233038", roughness: 0.63 }),
    rubber: new MeshStandardMaterial({ color: "#1e2328", roughness: 0.9 }),
    tread: new MeshStandardMaterial({ color: "#15191d", roughness: 1 }),
    alloy: new MeshStandardMaterial({
      color: "#a4aeb1",
      metalness: 0.57,
      roughness: 0.42,
    }),
    glass: new MeshStandardMaterial({
      color: "#244452",
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      side: DoubleSide,
      roughness: 0.23,
    }),
    mirror: new MeshStandardMaterial({
      color: "#a6c1cc",
      metalness: 0.61,
      roughness: 0.19,
    }),
    chrome: new MeshStandardMaterial({
      color: "#d5e0e3",
      metalness: 0.43,
      roughness: 0.34,
    }),
    clear: new MeshStandardMaterial({
      color: "#d9edf4",
      metalness: 0.18,
      roughness: 0.19,
    }),
    amber: new MeshStandardMaterial({
      color: "#f0a035",
      emissive: "#8a3c06",
      emissiveIntensity: 0.26,
    }),
    red: new MeshStandardMaterial({
      color: "#9b1d2d",
      emissive: "#470914",
      emissiveIntensity: 0.32,
    }),
    brake: new MeshStandardMaterial({
      color: "#e22a3b",
      emissive: "#810b18",
      emissiveIntensity: 0.32,
    }),
    floor: new MeshStandardMaterial({ color: "#4b5157", roughness: 0.88 }),
    plate: new MeshStandardMaterial({ color: "#e9d483", roughness: 0.65 }),
  };
}

export type BusMaterials = ReturnType<typeof createBusMaterials>;
