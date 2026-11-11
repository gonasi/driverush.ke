/**
 * The Model Town Board question bank (`data/board-questions.ts`), one section
 * per topic. Every question and answer is in the server's HTML: the answers
 * sit in native `<details>`, so they open without JavaScript and search
 * engines read them. Each topic ends with the course level that teaches it.
 */
import {
  BOARD_QUESTIONS,
  BOARD_TOPICS,
  boardQuestionsIn,
} from "~/data/board-questions";
import { levelHref } from "~/lib/board-guides";
import { COURSE_LEVELS } from "~/lib/board/curriculum";

import { UNSURE_NOTE } from "~/components/board/board-playback";
import { Accordion, AccordionItem } from "~/components/brand/accordion";
import { MDX } from "~/components/brand/mdx-components";

export const BOARD_QUESTION_COUNT = BOARD_QUESTIONS.length;

export function BoardQuestionBank() {
  return (
    <>
      {BOARD_TOPICS.map((topic) => {
        const index = COURSE_LEVELS.findIndex((l) => l.id === topic.level);
        const level = COURSE_LEVELS[index];
        return (
          <section key={topic.id} aria-labelledby={`q-${topic.id}`}>
            <MDX.h2 id={`q-${topic.id}`}>{topic.title}</MDX.h2>
            <Accordion className="my-6">
              {boardQuestionsIn(topic.id).map((question, i) => (
                <AccordionItem
                  key={question.q}
                  summary={question.q}
                  open={topic.id === "board" && i === 0}
                >
                  <p className="m-0">{question.a}</p>
                  {question.confirm ? (
                    <p className="m-0 mt-2 text-[14px] text-ink-3">
                      {UNSURE_NOTE}
                    </p>
                  ) : null}
                  <p className="m-0 mt-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                    {question.source}
                  </p>
                </AccordionItem>
              ))}
            </Accordion>
            {level ? (
              <MDX.p>
                Practise it:{" "}
                <MDX.a href={levelHref(level.id)}>
                  level {index + 1}, {level.title}
                </MDX.a>
                .
              </MDX.p>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
