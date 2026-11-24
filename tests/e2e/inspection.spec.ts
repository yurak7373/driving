import { expect, test } from "@playwright/test";

test("개발 서버에서 Three.js 장면을 렌더링하고 화면 크기에 맞춘다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole("heading", { name: "3D 테스트 장면" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");
  const canvas = page.getByRole("img", { name: "시험 구역의 3D 뷰" });
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-draw-calls", /^[1-9]\d*$/);

  const original = await canvas.getAttribute("data-camera-aspect");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("테스트 뷰포트가 설정되지 않았습니다");
  await page.setViewportSize({ width: viewport.width - 100, height: viewport.height });
  await expect(canvas).not.toHaveAttribute("data-camera-aspect", original ?? "");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("캔버스 영역을 가져올 수 없습니다");
  const aspect = Number(await canvas.getAttribute("data-camera-aspect"));
  expect(aspect).toBeCloseTo(bounds.width / bounds.height, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width - 100,
  );
  expect(errors).toEqual([]);
});

test("PC 키보드 또는 모바일 터치로 이동, 시점 전환, 초기화를 처리한다", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("WebGL 렌더링 중");

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
  await expect(page.locator("#view-label")).toHaveText("위에서 보기");

  if (isMobile) await reset.tap();
  else await reset.click();

  await expect(page.locator("#coordinates")).toHaveText("0 / 0");
  await expect(page.locator("#view-label")).toHaveText("사선");
});
