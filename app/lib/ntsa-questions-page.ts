/**
 * `/ntsa-test/questions`: its address, title and description, read by the
 * route, the sitemap and `title-lengths.test.ts`.
 */
import { ALL_PRACTICE_QUESTIONS } from "~/data/ntsa-practice-questions";

export const NTSA_QUESTIONS_PATH = "/ntsa-test/questions";
/** The date the questions were last checked against their sources. */
export const NTSA_QUESTIONS_CHECKED = "2026-11-11";
export const NTSA_QUESTIONS_TITLE = "NTSA driving test questions and answers";
export const NTSA_QUESTIONS_DESCRIPTION = `${ALL_PRACTICE_QUESTIONS.length} NTSA driving test practice questions with answers: rules of the road, signs, safety, car control and emergencies, each with its source.`;
