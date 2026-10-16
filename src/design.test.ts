import { describe, it, expect } from "vitest";
import {
  newContent,
  makeItem,
  id,
  now,
  servicePages,
  outputProfiles,
  defaultBackground,
  serviceMediaRefs,
  validateService,
  type ServiceOrder,
} from "./model";
function service(): ServiceOrder {
  const song = newContent("song");
  song.sections[0].pages[0].text = "Line one\n第二行";
  return {
    id: id(),
    title: "Design rehearsal",
    date: "2026-10-16",
    items: [makeItem(song)],
    createdAt: now(),
    updatedAt: now(),
  };
}
describe("design inheritance", () => {
  it("resolves profile, service, item and explicit slide overrides independently", () => {
    const order = service();
    order.profile = { ...outputProfiles[1] };
    order.style = { color: "#ff0000" };
    const item = order.items[0];
    item.overrides = { fontSize: 88 };
    const page = item.snapshot.sections[0].pages[0];
    expect(servicePages(order)[0].style.fontSize).toBe(88);
    expect(servicePages(order)[0].style.color).toBe("#ff0000");
    item.typographyMode = "inherit";
    expect(servicePages(order)[0].style.fontSize).toBe(77.76);
    page.typographyMode = "custom";
    page.style.fontSize = 52;
    expect(servicePages(order)[0].style.fontSize).toBe(52);
    expect(page.text).toBe("Line one\n第二行");
  });
  it("preserves 0.2 legacy item-over-slide precedence without rewriting data", () => {
    const order = service(),
      item = order.items[0],
      page = item.snapshot.sections[0].pages[0];
    delete page.typographyMode;
    page.style.fontSize = 56;
    item.overrides.fontSize = 84;
    expect(servicePages(order)[0].style.fontSize).toBe(84);
    expect(page.style.fontSize).toBe(56);
  });
  it("resolves nearest explicit background and retains every referenced asset", () => {
    const order = service();
    order.backgroundDesign = {
      ...defaultBackground,
      mode: "video",
      mediaId: "service-video",
      posterId: "poster",
    };
    const item = order.items[0],
      page = item.snapshot.sections[0].pages[0];
    expect(servicePages(order)[0].backgroundDesign?.mediaId).toBe(
      "service-video",
    );
    item.backgroundDesign = {
      ...defaultBackground,
      mode: "image",
      mediaId: "item-image",
    };
    expect(servicePages(order)[0].backgroundDesign?.mediaId).toBe("item-image");
    page.backgroundDesign = {
      ...defaultBackground,
      mode: "color",
      color: "#123456",
    };
    expect(servicePages(order)[0].backgroundDesign?.color).toBe("#123456");
    expect(serviceMediaRefs(order)).toEqual(
      expect.arrayContaining(["service-video", "poster", "item-image"]),
    );
  });
  it("rejects unsafe font syntax and invalid scoped design values", () => {
    const order = service();
    order.style = { fontFamily: "Arial; background:url(https://evil.test)" };
    expect(() => validateService(order)).toThrow("font");
    order.style = { horizontalMargin: 99 };
    expect(() => validateService(order)).toThrow("typography");
    order.style = {};
    order.backgroundDesign = { ...defaultBackground, mode: "video" };
    expect(() => validateService(order)).toThrow("background");
  });
});

it("section headings stay out of projection and language selection preserves both stored channels", async () => {
  const { displayChannels } = await import("./model");
  const order = service();
  const item = order.items[0];
  const page = item.snapshot.sections[0].pages[0];
  page.text = "Primary";
  page.secondary = "第二语言";
  page.languageMode = "secondary";
  expect(displayChannels(page)).toEqual({ primary: "第二语言", secondary: "" });
  expect(page.text).toBe("Primary");
  page.secondary = "   ";
  expect(displayChannels(page)).toEqual({ primary: "Primary", secondary: "" });
  page.secondary = "Secondary";
  page.languageMode = "primary";
  expect(displayChannels(page)).toEqual({ primary: "Primary", secondary: "" });
  delete page.languageMode;
  expect(displayChannels(page)).toEqual({
    primary: "Primary",
    secondary: "Secondary",
  });
  item.nonPresenting = true;
  validateService(order);
  expect(servicePages(order)).toEqual([]);
});
