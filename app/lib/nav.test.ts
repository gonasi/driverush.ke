import { describe, expect, it } from "vitest";

import { activeTab, tabBarHidden } from "./nav";

describe("which tab a page belongs to", () => {
  it.each([
    ["/", "home"],
    ["/model-town-board", "board"],
    ["/model-town-board/rules", "guides"],
    ["/road-signs", "signs"],
    ["/road-signs/pelican", "signs"],
    ["/road-signs/stop", "signs"],
    ["/road-signs/warning-signs", "guides"],
    ["/guides", "guides"],
    ["/ntsa-test/", "guides"],
    ["/blogs/some-post", "guides"],
    ["/s", null],
  ])("%s is %s", (path, tab) => {
    expect(activeTab(path)).toBe(tab);
  });

  it("hides the bar in the game and the tools, and nowhere else", () => {
    expect(tabBarHidden("/model-town-board/play")).toBe(true);
    expect(tabBarHidden("/tools/sign-3d")).toBe(true);
    expect(tabBarHidden("/model-town-board")).toBe(false);
    expect(tabBarHidden("/road-signs/pelican")).toBe(false);
  });
});
