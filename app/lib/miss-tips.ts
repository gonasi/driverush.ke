/**
 * What a trainer shows after "Missed it": the sign's memory cue and the sign it
 * gets mixed up with, from its guide. Signs without a guide (not yet confirmed
 * for search) fall back to how their whole class reads, so every miss teaches
 * something rather than just repeating the name.
 */
import {
  SIGN_CLASS_GUIDE,
  signGuide,
  signPageByCode,
  type SignPage,
} from "~/lib/road-sign-pages";
import type { SignCategoryId } from "~/lib/image-focus";

export type MissTip = {
  remember?: string;
  lookAlike?: { sign: SignPage; how: string };
  /** Always there, as the fallback. */
  classRule?: string;
  source: "guide" | "class_rule";
};

export function missTip(sign: { code?: string; category: string }): MissTip {
  const guide = signGuide(sign);
  const classRule =
    SIGN_CLASS_GUIDE[sign.category as SignCategoryId]?.rule ?? undefined;
  if (!guide) return { classRule, source: "class_rule" };
  const first = guide.confusedWith
    .map(({ code, how }) => {
      const other = signPageByCode(code);
      return other ? { sign: other, how } : null;
    })
    .find((x) => x !== null);
  return {
    remember: guide.remember,
    lookAlike: first ?? undefined,
    classRule,
    source: "guide",
  };
}
