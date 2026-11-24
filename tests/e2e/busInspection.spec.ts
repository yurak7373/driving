import { expect, test, type Locator } from "@playwright/test";

async function boundsInView(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);
  const projection: number[][] = JSON.parse(
    (await canvas.getAttribute("data-bus-projection")) ?? "[]",
  );
  expect(projection).toHaveLength(2);
  for (const corner of projection) {
    expect(corner).toHaveLength(3);
    for (const coordinate of corner) {
      expect(Number.isFinite(coordinate)).toBe(true);
      expect(Math.abs(coordinate)).toBeLessThan(1);
    }
  }
  for (const axis of [0, 1, 2])
    expect(projection[1][axis]).toBeGreaterThan(projection[0][axis]);
}

test("버스가 좁은 화면에도 표시되고 실제 카메라, 재질, 바퀴를 조작한다", async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 390, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("link", { name: "버스 외부 살펴보기" }).click();
  await expect(
    page.getByRole("heading", { name: "버스 외부 관찰" }),
  ).toBeVisible();
  await expect(page.locator("#bus-render-status")).toHaveText(
    "WebGL 렌더링 중",
  );
  await expect(page.locator("#bus-wheels")).toHaveText("6개");
  await expect(page.locator("#bus-doors")).toHaveText("앞문 있음 · 중문 있음");
  await expect(page.locator("#bus-parts")).toHaveText("필수 부품 확인");

  const canvas = page.locator("#bus-canvas");
  await boundsInView(canvas);
  const initialDirection: number[] = JSON.parse(
    (await canvas.getAttribute("data-camera-direction")) ?? "[]",
  );

  for (const [name, axis, sign] of [
    ["전면", 2, -1],
    ["후면", 2, 1],
    ["좌측", 0, -1],
    ["우측", 0, 1],
    ["상단", 1, -1],
  ] as const) {
    await page.getByRole("button", { name, exact: true }).click();
    const direction: number[] = JSON.parse(
      (await canvas.getAttribute("data-camera-direction")) ?? "[]",
    );
    expect(direction[axis] * sign).toBeGreaterThan(0.98);
    await boundsInView(canvas);
  }
  await page.getByRole("button", { name: "기본 시점" }).click();
  const resetDirection: number[] = JSON.parse(
    (await canvas.getAttribute("data-camera-direction")) ?? "[]",
  );
  expect(initialDirection).toHaveLength(3);
  expect(resetDirection).toHaveLength(3);
  resetDirection.forEach((coordinate, axis) =>
    expect(coordinate).toBeCloseTo(initialDirection[axis], 8),
  );
  const initialProjection = await canvas.getAttribute("data-bus-projection");
  await page.getByRole("button", { name: "확대" }).click();
  await expect(canvas).not.toHaveAttribute(
    "data-bus-projection",
    initialProjection ?? "",
  );
  await page.getByRole("button", { name: "기본 시점" }).click();

  await page.evaluate(() => document.fonts.ready.then(() => true));
  const greenFrame = await canvas.screenshot();
  await page.getByLabel("차체 도색").selectOption("blue");
  await expect(canvas).toHaveAttribute("data-paint-color", "#1666b1");
  expect((await canvas.screenshot()).equals(greenFrame)).toBe(false);
  await page.getByLabel("전륜 조향").fill("18");
  await page.getByLabel("바퀴 회전").fill("90");
  const pose = await canvas.getAttribute("data-wheel-pose");
  const [steering, rolling] = JSON.parse(pose ?? "[]");
  expect(steering).toBeCloseTo(Math.PI / 10);
  expect(rolling).toBeCloseTo(Math.PI / 2);

  const originalAspect = await canvas.getAttribute("data-camera-aspect");
  await page.setViewportSize(
    isMobile ? { width: 900, height: 390 } : { width: 830, height: 720 },
  );
  await expect(canvas).not.toHaveAttribute(
    "data-camera-aspect",
    originalAspect ?? "",
  );
  await expect(canvas).toHaveAttribute("data-paint-color", "#1666b1");
  await expect(canvas).toHaveAttribute("data-wheel-pose", pose ?? "");
  await boundsInView(canvas);
  expect(errors).toEqual([]);
});

test("PC 드래그와 모바일 터치 드래그로 카메라가 자유 회전한다", async ({
  page,
  isMobile,
}) => {
  await page.goto("/#bus");
  const canvas = page.locator("#bus-canvas");
  await expect(canvas).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);
  const original = await canvas.getAttribute("data-camera-direction");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("버스 캔버스의 위치를 찾을 수 없습니다.");
  const x = Math.round(bounds.x + bounds.width / 2);
  const y = Math.round(bounds.y + bounds.height / 2);
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 60, y: y + 12 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    const projection = await canvas.getAttribute("data-bus-projection");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: x - 35, y, id: 0 },
        { x: x + 35, y, id: 1 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - 65, y, id: 0 },
        { x: x + 65, y, id: 1 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(canvas).not.toHaveAttribute(
      "data-bus-projection",
      projection ?? "",
    );
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 100, y + 16, { steps: 5 });
    await page.mouse.up();
    const projection = await canvas.getAttribute("data-bus-projection");
    await page.mouse.wheel(0, -150);
    await expect(canvas).not.toHaveAttribute(
      "data-bus-projection",
      projection ?? "",
    );
  }
  await expect(page.locator("#bus-view")).toHaveText("자유 관찰");
  await expect(canvas).not.toHaveAttribute(
    "data-camera-direction",
    original ?? "",
  );
});

test("두 장면을 반복 전환해도 WebGL 컨텍스트와 관찰자가 정리되고 입력은 한 번 적용된다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Observer = window.ResizeObserver;
    const active = new Set<ResizeObserver>();
    window.ResizeObserver = class extends Observer {
      override observe(...args: Parameters<ResizeObserver["observe"]>) {
        super.observe(...args);
        active.add(this);
        document.documentElement.dataset.activeResizeObservers = String(
          active.size,
        );
      }
      override disconnect() {
        super.disconnect();
        active.delete(this);
        document.documentElement.dataset.activeResizeObservers = String(
          active.size,
        );
      }
    };
  });
  await page.goto("/");
  for (let i = 0; i < 3; i++) {
    const inspection = page.locator("#scene");
    await expect(inspection).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);
    const inspectionHandle = await inspection.elementHandle();
    await page.getByRole("link", { name: "버스 외부 살펴보기" }).click();
    await expect(page.locator("#bus-render-status")).toHaveText(
      "WebGL 렌더링 중",
    );
    await expect
      .poll(() =>
        inspectionHandle!.evaluate(
          (el) =>
            el instanceof HTMLCanvasElement &&
            el.getContext("webgl2")?.isContextLost(),
        ),
      )
      .toBe(true);

    const bus = page.locator("#bus-canvas");
    await expect(bus).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);
    const busHandle = await bus.elementHandle();
    await expect(page.locator("html")).toHaveAttribute(
      "data-active-resize-observers",
      "1",
    );

    await bus.evaluate((element) => {
      element.dataset.paintUpdates = "0";
      const observer = new MutationObserver((records) => {
        element.dataset.paintUpdates = String(
          Number(element.dataset.paintUpdates) + records.length,
        );
      });
      observer.observe(element, { attributeFilter: ["data-paint-color"] });
      element.addEventListener(
        "webglcontextlost",
        () => observer.disconnect(),
        { once: true },
      );
    });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.getByLabel("차체 도색").selectOption("red");
    const updates = Number(await bus.getAttribute("data-paint-updates"));
    await page.getByLabel("차체 도색").selectOption("yellow");
    await expect(bus).toHaveAttribute(
      "data-paint-updates",
      String(updates + 1),
    );

    await page.getByRole("link", { name: "표식 시험 장면" }).click();
    await expect(
      page.getByRole("heading", { name: "3D 테스트 장면" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        busHandle!.evaluate(
          (el) =>
            el instanceof HTMLCanvasElement &&
            el.getContext("webgl2")?.isContextLost(),
        ),
      )
      .toBe(true);
    await expect(page.locator("html")).toHaveAttribute(
      "data-active-resize-observers",
      "1",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#coordinates")).toHaveText("1 / 0");
    await inspectionHandle?.dispose();
    await busHandle?.dispose();
  }
});

test("배포 빌드에서 버스 화면과 한국어 표시 글꼴을 불러온다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const [bundle, font, navigation] = await Promise.all([
    page.waitForResponse(
      (entry) => entry.ok() && /busInspectionUi-[^/]+\.js$/.test(entry.url()),
    ),
    page.waitForResponse(
      (entry) => entry.ok() && /destination-ko-[^/]+\.woff2$/.test(entry.url()),
    ),
    page.goto("http://127.0.0.1:4174/#bus"),
  ]);
  expect(navigation?.ok()).toBe(true);
  expect(bundle.request().resourceType()).toBe("script");
  expect(font.request().resourceType()).toBe("font");
  await expect(page.locator("#bus-render-status")).toHaveText(
    "WebGL 렌더링 중",
  );
  await boundsInView(page.locator("#bus-canvas"));
  await page.getByRole("link", { name: "표식 시험 장면" }).click();
  await expect(page.locator("#scene")).toHaveAttribute(
    "data-draw-calls",
    /^[1-9]\d*$/,
  );
  expect(errors).toEqual([]);
});

test("가로·세로 첫 화면에서 실제 차량 전체가 브라우저 가시 영역에 있다", async ({
  page,
  isMobile,
}) => {
  const sizes = isMobile
    ? [
        [390, 900],
        [900, 390],
        [340, 780],
      ]
    : [[1440, 900]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto("/#bus");
    await expect(page.locator("#bus-render-status")).toHaveText(
      "WebGL 렌더링 중",
    );
    const canvas = page.locator("#bus-canvas");
    await boundsInView(canvas);
    const actual = await canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const [min, max] = JSON.parse(element.dataset.busProjection ?? "[]");
      const viewport = window.visualViewport!;
      return {
        left: rect.x + ((min[0] + 1) * rect.width) / 2 - viewport.offsetLeft,
        right: rect.x + ((max[0] + 1) * rect.width) / 2 - viewport.offsetLeft,
        top: rect.y + ((1 - max[1]) * rect.height) / 2 - viewport.offsetTop,
        bottom: rect.y + ((1 - min[1]) * rect.height) / 2 - viewport.offsetTop,
        width: viewport.width,
        height: viewport.height,
        scrollY: window.scrollY,
      };
    });
    expect(actual.scrollY).toBe(0);
    expect(actual.left).toBeGreaterThanOrEqual(0);
    expect(actual.top).toBeGreaterThanOrEqual(0);
    expect(actual.right).toBeLessThanOrEqual(actual.width);
    expect(actual.bottom).toBeLessThanOrEqual(actual.height);
  }
});
