export const busConfig = {
  name: "해안시 표준 대형버스",
  length: 11,
  width: 2.5,
  height: 3.2,
  wheelbase: 5.5,
  frontOverhang: 2.4,
  rearOverhang: 3.1,
  tireRadius: 0.48,
  tireWidth: 0.23,
  wheelCount: 6,
} as const;

export const liveryConfig = {
  green: { label: "녹색", color: "#16865b", accent: "#73bca4" },
  blue: { label: "파란색", color: "#1666b1", accent: "#82b8dc" },
  red: { label: "빨간색", color: "#af3a38", accent: "#e69a91" },
  yellow: { label: "노란색", color: "#d19c20", accent: "#f4cb60" },
} as const;

export type BusLivery = keyof typeof liveryConfig;

export const frontZ = busConfig.length / 2;
export const rearZ = -frontZ;
export const frontAxleZ = frontZ - busConfig.frontOverhang;
export const rearAxleZ = rearZ + busConfig.rearOverhang;

export const wheelNames = [
  "Wheel_FL",
  "Wheel_FR",
  "Wheel_RL_Outer",
  "Wheel_RL_Inner",
  "Wheel_RR_Outer",
  "Wheel_RR_Inner",
] as const;

export const cameraAnchors = [
  "DriverCamera",
  "PassengerCamera",
  "MirrorCamera_L",
  "MirrorCamera_R",
  "RearCamera",
] as const;

export const requiredNodes = [
  ...wheelNames,
  "FrontDoor",
  "MiddleDoor",
  "Windshield",
  "Window_Driver",
  "Window_L_1",
  "Window_R_1",
  "RearWindow",
  ...cameraAnchors,
] as const;
