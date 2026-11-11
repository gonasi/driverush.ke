/**
 * Board shares: the link carries numbers only, the words read like a person
 * wrote them, and the landing page makes sense of whatever comes back.
 */
import { describe, expect, it } from "vitest";

import { SHARE_OG_CARD, buildShareLink, resolveShare } from "./share";

describe("sharing a board round", () => {
  it("builds a short link with only numbers in it", () => {
    const link = buildShareLink({ kind: "board", total: 5, firstTry: 4 });
    expect(link.url).toMatch(/\/s\?k=board&t=5&f=4$/);
    expect(link.title).toBe(
      "I drove 5 Model Town Board tasks, 4 clean on the first try",
    );
    expect(link.title + link.text).not.toContain("—");
  });

  it("words a single clean task and a round with none clean", () => {
    expect(buildShareLink({ kind: "board", total: 1, firstTry: 1 }).title).toBe(
      "I drove a Model Town Board task, clean on the first try",
    );
    expect(buildShareLink({ kind: "board", total: 5, firstTry: 0 }).title).toBe(
      "I drove 5 Model Town Board tasks",
    );
  });

  it("lands on a page that sends the reader to the game", () => {
    const landed = resolveShare(new URLSearchParams("k=board&t=5&f=4"));
    expect(landed.valid).toBe(true);
    expect(landed.kind).toBe("board");
    expect(landed.headline).toBe("They drove 5 Model Town Board tasks");
    expect(landed.ctaHref).toBe("/model-town-board/play");
    expect(SHARE_OG_CARD.board).toBe("board");
  });

  it("falls back, and never throws, on a broken board link", () => {
    for (const query of [
      "k=board",
      "k=board&t=0&f=0",
      "k=board&t=3&f=9",
      "k=board&t=x&f=1",
    ]) {
      expect(resolveShare(new URLSearchParams(query)).valid).toBe(false);
    }
  });
});
