/**
 * Every page in search keeps its title and description short enough to show
 * whole in a search result: about 60 characters for the title, with the
 * " · DriveRush" suffix, and 155 for the description.
 */
import { describe, expect, it } from "vitest";

import {
  BOARD_GUIDES,
  BOARD_LEVELS_DESCRIPTION,
  BOARD_LEVELS_TITLE,
} from "./board-guides";
import { COURSE_LEVELS } from "./board/curriculum";
import { SIGN_CLASS_PAGES } from "./sign-class-pages";
import {
  SIGN_PAGES,
  isSignConfirmed,
  signTitle,
} from "./road-sign-pages";
import {
  NTSA_QUESTIONS_DESCRIPTION,
  NTSA_QUESTIONS_TITLE,
} from "./ntsa-questions-page";
import { pageTitle } from "./site";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

describe("titles fit in a search result", () => {
  it.each(BOARD_GUIDES.map((g) => [g.path, g]))("%s", (_, guide) => {
    expect(pageTitle(guide.title).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(guide.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it.each(SIGN_CLASS_PAGES.map((p) => [p.path, p]))("%s", (_, page) => {
    expect(pageTitle(page.title).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(page.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("the NTSA questions page", () => {
    expect(pageTitle(NTSA_QUESTIONS_TITLE).length).toBeLessThanOrEqual(
      TITLE_MAX,
    );
    expect(NTSA_QUESTIONS_DESCRIPTION.length).toBeLessThanOrEqual(
      DESCRIPTION_MAX,
    );
  });

  it("the board's levels page", () => {
    expect(pageTitle(BOARD_LEVELS_TITLE).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(BOARD_LEVELS_TITLE).toContain(String(COURSE_LEVELS.length));
    expect(BOARD_LEVELS_DESCRIPTION.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("every sign in search", () => {
    const tooLong = SIGN_PAGES.filter(isSignConfirmed)
      .map((sign) => pageTitle(signTitle(sign.name!)))
      .filter((title) => title.length > TITLE_MAX);
    expect(tooLong).toEqual([]);
  });
});
