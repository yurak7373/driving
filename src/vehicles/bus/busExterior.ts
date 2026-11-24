import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Material,
  type Texture,
} from "three";
import { busSides } from "./busAxes";
import { busConfig, frontZ, rearZ } from "./busConfig";
import { addBusFloor } from "./busUnderbody";
import type { BusMaterials } from "./busMaterials";
import type { BusParts } from "./busParts";

export interface BusDecals {
  destination?: Texture;
  plate?: Texture;
  fleet?: Texture;
}

export function addBusExterior(
  root: Group,
  parts: BusParts,
  m: BusMaterials,
  decals: BusDecals,
) {
  const { length, width, height } = busConfig;
  const half = width / 2;
  const add = parts.box;
  addBusFloor(root, parts, m);
  add(root, "Underframe", m.dark, [1.06, 0.28, 10.36], [0, 0.4, 0], 0.07);
  add(
    root,
    "RearEngineHousing",
    m.dark,
    [2.12, 0.73, 1.53],
    [0, 0.78, -4.52],
    0.08,
  );

  add(
    root,
    "Roof",
    m.white,
    [width, 0.26, length - 0.28],
    [0, 2.924, 0],
    0.126,
  );
  add(
    root,
    "HVAC",
    m.white,
    [1.65, 0.15, 2.84],
    [0, height - 0.095, -1.13],
    0.07,
  );
  for (const x of [-0.55, 0.55]) {
    add(
      root,
      "HVACGrille",
      m.dark,
      [0.23, 0.018, 1.91],
      [x, height - 0.015, -1.12],
      0.007,
    );
    for (let i = 0; i < 12; i++) {
      add(
        root,
        "HVACSlat",
        m.alloy,
        [0.21, 0.012, 0.022],
        [x, height - 0.006, -1.99 + i * 0.155],
      );
    }
  }
  add(
    root,
    "EmergencyHatchFrame",
    m.accent,
    [0.82, 0.045, 0.81],
    [0, 3.07, 1.32],
    0.02,
  );
  add(
    root,
    "EmergencyHatch",
    m.white,
    [0.72, 0.056, 0.71],
    [0, 3.08, 1.32],
    0.025,
  );

  const led = decalMaterial(decals.destination, "#171e20");
  const plate = decalMaterial(decals.plate, "#e9d483");
  const fleet = decalMaterial(decals.fleet, "#ffffff");

  for (const [sign, name, z] of [
    [1, "Front", frontZ],
    [-1, "Rear", rearZ],
  ] as const) {
    const face = new Group();
    face.name = `${name}Body`;
    face.position.z = z;
    if (sign < 0) face.rotation.y = Math.PI;
    root.add(face);

    // Each band follows the curved front/rear envelope, with a separate glazing opening.
    function band(
      label: string,
      material: Material,
      low: number,
      high: number,
      from = -half,
      to = half,
      offset = 0,
    ) {
      const columns = [
        from,
        ...[-1.08, -0.82, 0, 0.82, 1.08].filter((x) => x > from && x < to),
        to,
      ];
      const positions: number[] = [];
      const index: number[] = [];
      for (const [i, x] of columns.entries()) {
        for (const y of [low, high]) {
          const corner = Math.max(0, (Math.abs(x) - 0.78) / (half - 0.78));
          positions.push(
            x,
            y,
            offset - 0.25 * corner ** 1.65 - 0.13 * Math.max(0, y - 1.18),
          );
        }
        if (i > 0) {
          const a = (i - 1) * 2;
          index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new Float32BufferAttribute(positions, 3),
      );
      geometry.setIndex(index);
      geometry.computeVertexNormals();
      const mesh = new Mesh(geometry, material);
      mesh.name = label;
      face.add(mesh);
    }

    const front = sign === 1;
    const sill = front ? 1.48 : 1.87;
    const header = front ? 2.52 : 2.54;
    band("LowerFascia", m.paint, 0.45, 1.26);
    band("PaintStripe", m.accent, 1.26, 1.34);
    band("WindowBase", m.white, 1.34, sill);
    band("GlassSill", m.dark, sill, sill + 0.075);
    band("WindowPillar", m.white, sill + 0.075, header, -half, -1.064);
    band("WindowPillar", m.white, sill + 0.075, header, 1.064, half);
    band("GlassGasket", m.dark, sill + 0.075, header, -1.064, -1.014);
    band("GlassGasket", m.dark, sill + 0.075, header, 1.014, 1.064);
    band(
      front ? "Windshield" : "RearWindow",
      m.glass,
      sill + 0.075,
      header,
      -1.014,
      1.014,
    );
    band("DestinationHeader", m.white, header, 2.91);
    add(
      face,
      `${name}Bumper`,
      m.dark,
      [2.43, 0.255, 0.31],
      [0, 0.427, -0.125],
      0.11,
    );
    add(
      face,
      "LowerBumperLip",
      m.paint,
      [2.22, 0.08, 0.25],
      [0, 0.324, -0.18],
      0.035,
    );

    add(
      face,
      "DestinationCase",
      m.dark,
      [front ? 1.56 : 1.19, 0.275, 0.1],
      [0, 2.704, -0.187],
      0.043,
    );
    decal(
      face,
      front ? "FrontDestination" : "RearDestination",
      led,
      front ? 1.42 : 1.05,
      0.224,
      0,
      2.704,
      -0.135,
    );

    add(
      face,
      "NumberPlateMount",
      m.dark,
      [0.613, 0.172, 0.029],
      [0, 0.55, 0.008],
      0.013,
    );
    decal(face, "FictionalNumberPlate", plate, 0.54, 0.135, 0, 0.55, 0.025);
    if (front) {
      add(
        face,
        "FictionalBadge",
        m.chrome,
        [0.29, 0.076, 0.023],
        [0, 1.3, -0.013],
        0.026,
      );
      add(
        face,
        "LowerIntake",
        m.dark,
        [0.83, 0.12, 0.025],
        [0, 0.768, -0.014],
        0.022,
      );
    } else {
      add(
        face,
        "EngineCoverSeam",
        m.dark,
        [1.52, 0.668, 0.018],
        [0, 0.936, 0.008],
        0.008,
      );
      add(
        face,
        "EngineCover",
        m.paint,
        [1.48, 0.636, 0.024],
        [0, 0.936, 0.018],
        0.009,
      );
      add(
        face,
        "EngineGrille",
        m.dark,
        [1.08, 0.235, 0.022],
        [0, 0.91, 0.036],
        0.009,
      );
      for (let i = 0; i < 5; i++)
        add(
          face,
          "EngineSlat",
          m.alloy,
          [1.01, 0.017, 0.022],
          [0, 0.828 + 0.04 * i, 0.049],
        );
      add(
        face,
        "RearCameraHousing",
        m.dark,
        [0.15, 0.066, 0.066],
        [0, 2.43, -0.124],
        0.022,
      );
    }

    for (const [worldSide, label] of busSides) {
      const side = worldSide * sign;
      const lamp = new Group();
      lamp.name = `${name}Lights_${label}`;
      lamp.position.set(
        side * (front ? 0.884 : 0.953),
        front ? 0.96 : 1.61,
        -0.065,
      );
      lamp.rotation.y = side * 0.28;
      face.add(lamp);
      if (front) {
        add(lamp, "Housing", m.dark, [0.539, 0.352, 0.12], [0, 0, 0], 0.058);
        add(
          lamp,
          "HeadlightLens",
          m.clear,
          [0.443, 0.15, 0.07],
          [0, 0.056, 0.057],
          0.029,
        );
        add(
          lamp,
          "DRL",
          m.chrome,
          [0.428, 0.035, 0.035],
          [0, -0.062, 0.068],
          0.013,
        );
        add(
          lamp,
          "TurnIndicator",
          m.amber,
          [0.265, 0.064, 0.053],
          [side * 0.077, -0.097, 0.065],
          0.02,
        );
      } else {
        add(
          lamp,
          "Housing",
          m.dark,
          [0.29, 0.73, 0.084],
          [0, -0.12, -0.02],
          0.047,
        );
        for (const [key, material, y] of [
          ["BrakeLight", m.brake, 0.114],
          ["TailLight", m.red, -0.037],
          ["TurnIndicator", m.amber, -0.19],
          ["ReverseLight", m.clear, -0.34],
        ] as const)
          add(lamp, key, material, [0.215, 0.116, 0.05], [0, y, 0.019], 0.024);
      }
    }
  }

  for (const [side, key] of busSides) {
    const signage = new Group();
    signage.name = `SideSignage_${key}`;
    signage.position.x = side * half;
    signage.rotation.y = (side * Math.PI) / 2;
    root.add(signage);
    if (key === "R") {
      add(
        signage,
        "SideDestinationCase",
        m.dark,
        [1.05, 0.23, 0.055],
        [-side * 1.1, 2.505, -0.021],
        0.024,
      );
      decal(
        signage,
        "SideDestination",
        led,
        0.965,
        0.166,
        -side * 1.1,
        2.505,
        0.009,
      );
    }
    if (decals.fleet)
      decal(
        signage,
        "FleetNumber",
        fleet,
        0.98,
        0.22,
        side * 1.83,
        1.108,
        0.005,
      );
  }

  for (const [side, key] of busSides) {
    const mirror = new Group();
    mirror.name = `Mirror_${key}`;
    mirror.position.set(side * 1.15, 2.53, 5.13);
    root.add(mirror);
    const arm = add(
      mirror,
      "SupportArm",
      m.dark,
      [0.4, 0.073, 0.085],
      [side * 0.167, 0.018, 0.025],
      0.032,
    );
    arm.rotation.y = -side * 0.26;
    add(
      mirror,
      "Housing",
      m.dark,
      [0.245, 0.45, 0.16],
      [side * 0.36, -0.174, 0.038],
      0.056,
    );
    add(
      mirror,
      "Reflector",
      m.mirror,
      [0.181, 0.259, 0.018],
      [side * 0.36, -0.125, -0.042],
      0.008,
    );
    add(
      mirror,
      "WideAngleReflector",
      m.mirror,
      [0.171, 0.116, 0.018],
      [side * 0.36, -0.328, -0.042],
      0.008,
    );
  }
  for (const [side, label] of busSides) {
    const pivot = new Group();
    pivot.name = `Wiper_${label}`;
    pivot.position.set(side * 0.59, 1.59, 5.47);
    // Lean the arms with the glass, then offset each blade along the windshield.
    pivot.rotation.x = -0.13;
    pivot.rotation.z = -0.56;
    root.add(pivot);
    add(pivot, "WiperArm", m.dark, [0.034, 0.45, 0.033], [0, 0.21, 0], 0.009);
    add(
      pivot,
      "WiperBlade",
      m.dark,
      [0.048, 0.54, 0.03],
      [0, 0.42, -0.017],
      0.008,
    );
  }
}

function decalMaterial(map: Texture | undefined, color: string) {
  return new MeshBasicMaterial({
    map,
    color: map ? "#ffffff" : color,
    transparent: Boolean(map),
    depthWrite: !map,
    toneMapped: false,
  });
}

function decal(
  parent: Group,
  name: string,
  material: Material,
  width: number,
  height: number,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new Mesh(new PlaneGeometry(width, height), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}
