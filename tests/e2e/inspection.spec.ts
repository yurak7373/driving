import { expect, test, type Locator } from "@playwright/test";

test("개발 서버에서 Three.js 장면을 렌더링하고 화면 크기에 맞춘다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);

  await expect(
    page.getByRole("heading", { name: "3D 테스트 장면" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");
  const canvas = page.getByRole("img", { name: "시험 구역의 3D 뷰" });
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);

  const original = await canvas.getAttribute("data-camera-aspect");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("테스트 뷰포트가 설정되지 않았습니다");
  await page.setViewportSize({
    width: viewport.width - 100,
    height: viewport.height,
  });
  await expect(canvas).not.toHaveAttribute(
    "data-camera-aspect",
    original ?? "",
  );
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("캔버스 영역을 가져올 수 없습니다");
  const aspect = Number(await canvas.getAttribute("data-camera-aspect"));
  expect(aspect).toBeCloseTo(bounds.width / bounds.height, 2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(viewport.width - 100);
  expect(errors).toEqual([]);
});

test("PC 키보드 또는 모바일 터치로 이동, 시점 전환, 초기화를 처리한다", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");

  const cameraDirectionY = async () =>
    Number(
      await page.locator("#scene").getAttribute("data-camera-direction-y"),
    );
  await expect.poll(cameraDirectionY).toBeGreaterThan(-0.99);

  const camera = page.getByRole("button", { name: /시점 전환/ });
  const reset = page.getByRole("button", { name: "초기화" });

  if (isMobile) {
    await page.getByRole("button", { name: "오른쪽으로" }).tap();
    await camera.tap();
  } else {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("KeyC");
  }

  await expect(page.locator("#coordinates")).toHaveText("1 / 0");
  await expect.poll(cameraDirectionY).toBeLessThan(-0.99);
  await expect(page.locator("#view-label")).toHaveText("위에서 보기");

  if (isMobile) await reset.tap();
  else await reset.click();

  await expect(page.locator("#coordinates")).toHaveText("0 / 0");
  await expect(page.locator("#view-label")).toHaveText("사선");
  await expect.poll(cameraDirectionY).toBeGreaterThan(-0.99);
});

async function expectMarkerInFrame(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);
  const projection = JSON.parse(
    (await canvas.getAttribute("data-marker-projection")) ?? "null",
  );
  expect(projection).not.toBeNull();
  expect(projection).toHaveLength(2);
  for (const corner of projection) {
    expect(corner).toHaveLength(3);
    for (const coordinate of corner) {
      expect(Number.isFinite(coordinate)).toBe(true);
      expect(Math.abs(coordinate)).toBeLessThan(1);
    }
  }
  for (const axis of [0, 1, 2]) {
    expect(projection[1][axis]).toBeGreaterThan(projection[0][axis]);
  }
}

test("네 모서리의 표식 전체가 두 시점과 화면 회전 후에도 보인다", async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");

  const canvas = page.locator("#scene");
  const coordinates = page.locator("#coordinates");
  const activate = (action: string) => {
    const button = page.locator(`button[data-action="${action}"]`);
    return isMobile ? button.tap() : button.click();
  };
  const move = async (action: string, count: number) => {
    for (let i = 0; i < count; i++) await activate(action);
  };

  for (const [x, z] of [
    [-4, 6],
    [4, 6],
    [-4, -6],
    [4, -6],
  ]) {
    await activate("reset");
    await move(x < 0 ? "left" : "right", Math.abs(x));
    await move(z < 0 ? "forward" : "back", Math.abs(z));
    await expect(coordinates).toHaveText(`${x} / ${z}`);
    await expectMarkerInFrame(canvas);

    await activate("camera");
    await expect(page.locator("#view-label")).toHaveText("위에서 보기");
    await expectMarkerInFrame(canvas);

    if (isMobile) {
      const portraitAspect = await canvas.getAttribute("data-camera-aspect");
      await page.setViewportSize({ width: 900, height: 390 });
      await expect(canvas).not.toHaveAttribute(
        "data-camera-aspect",
        portraitAspect ?? "",
      );
      await expect(coordinates).toHaveText(`${x} / ${z}`);
      await expect(page.locator("#view-label")).toHaveText("위에서 보기");
      await expectMarkerInFrame(canvas);

      await activate("camera");
      await expect(page.locator("#view-label")).toHaveText("사선");
      await expectMarkerInFrame(canvas);

      await page.setViewportSize({ width: 390, height: 900 });
      await expect(canvas).toHaveAttribute(
        "data-camera-aspect",
        portraitAspect ?? "",
      );
      await expect(coordinates).toHaveText(`${x} / ${z}`);
      await expectMarkerInFrame(canvas);
    }
  }
});

test("배포 빌드에서 번들이 실행되고 장면을 조작할 수 있다", async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const [bundle, response] = await Promise.all([
    page.waitForResponse(
      (entry) => entry.ok() && /\/assets\/[^/]+\.js$/.test(entry.url()),
    ),
    page.goto("http://127.0.0.1:4174/"),
  ]);
  expect(response?.ok()).toBe(true);
  expect(bundle.request().resourceType()).toBe("script");
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");
  await expectMarkerInFrame(page.locator("#scene"));
  if (isMobile) await page.getByRole("button", { name: "오른쪽으로" }).tap();
  else await page.keyboard.press("ArrowRight");
  await expect(page.locator("#coordinates")).toHaveText("1 / 0");
  expect(errors).toEqual([]);
});
