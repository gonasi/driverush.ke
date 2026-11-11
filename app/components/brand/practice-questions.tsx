/**
 * Questions with the answer tucked into a native `<details>`: readable with no
 * JavaScript and fully present in the server's HTML, so search engines see them too.
 */
import {
  ALL_PRACTICE_QUESTIONS,
  PRACTICE_QUESTIONS,
  PRACTICE_TOPICS,
  type PracticeQuestion,
} from "~/data/ntsa-practice-questions";

import { MDX } from "~/components/brand/mdx-components";

export function PracticeQuestions({
  questions = PRACTICE_QUESTIONS,
  start = 1,
}: {
  questions?: readonly PracticeQuestion[];
  /** The number the first question shows. */
  start?: number;
}) {
  return (
    <ol className="m-0 my-6 grid list-none gap-3 p-0 font-sans">
      {questions.map((question, index) => (
        <li
          key={question.prompt}
          className="border-2 border-ink bg-paper-3 p-4 sm:p-5"
        >
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Question {start + index}
          </p>
          <p className="m-0 mt-1.5 text-[16px] font-semibold leading-snug text-ink">
            {question.prompt}
          </p>
          <ul className="m-0 mt-3 grid list-none gap-1 p-0 text-[15px] leading-snug text-ink-2">
            {question.choices.map((choice, choiceIndex) => (
              <li key={choice} className="flex gap-2">
                <span aria-hidden className="font-mono text-[12px] text-ink-3">
                  {String.fromCharCode(65 + choiceIndex)}
                </span>
                <span>{choice}</span>
              </li>
            ))}
          </ul>
          <details className="mt-3 border-t border-dashed border-ink pt-2.5">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-rush outline-none focus-visible:underline">
              Show the answer
            </summary>
            <p className="m-0 mt-2 text-[15px] leading-snug text-ink">
              <strong>
                {String.fromCharCode(65 + question.answer)}:{" "}
                {question.choices[question.answer]}.
              </strong>{" "}
              {question.why}
            </p>
            <p className="m-0 mt-1.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              Source: {question.source}
            </p>
          </details>
        </li>
      ))}
    </ol>
  );
}

/** Every practice question, one section per topic, numbered straight through. */
export function PracticeQuestionBank() {
  let start = 1;
  return (
    <>
      {PRACTICE_TOPICS.map((topic) => {
        const questions = ALL_PRACTICE_QUESTIONS.filter(
          (question) => question.topic === topic.id,
        );
        const first = start;
        start += questions.length;
        return (
          <section key={topic.id} aria-labelledby={`t-${topic.id}`}>
            <MDX.h2 id={`t-${topic.id}`}>{topic.title}</MDX.h2>
            <PracticeQuestions questions={questions} start={first} />
          </section>
        );
      })}
    </>
  );
}

export const PRACTICE_QUESTION_COUNT = ALL_PRACTICE_QUESTIONS.length;
