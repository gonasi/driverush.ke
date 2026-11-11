/**
 * Every Model Town Board question with its answer, laid out on A4 pages to
 * print. `scripts/build-board-pdf.mjs` prints it from
 * `/tools/og?print=board-questions` to `public/downloads/`, and the questions
 * page links the file. Same data as the page, so the two never disagree.
 */
import {
  BOARD_QUESTIONS,
  BOARD_TOPICS,
  boardQuestionsIn,
} from "~/data/board-questions";
import { COURSE_LEVELS } from "~/lib/board/curriculum";

import { BoardPicture } from "~/components/board/board-picture";
import { UNSURE_NOTE } from "~/components/board/board-playback";

const PAGE_URL = "driverush.ke/model-town-board/questions";

export function BoardQuestionsPrint() {
  let n = 0;
  return (
    <div className="bg-white font-sans text-[#0e1014]">
      <style>{`
        @page { size: A4 portrait; margin: 12mm 12mm 16mm; }
        html, body { background: #fff; }
        .bq-foot { position: fixed; bottom: -10mm; left: 0; right: 0; }
        .bq-item { break-inside: avoid; }
        .bq-topic { break-after: avoid; }
      `}</style>
      <p className="bq-foot m-0 text-center text-[8px] text-[#5b6068]">
        Free from DriveRush. Practise every answer on the 3D board at {PAGE_URL}
        . Not affiliated with NTSA.
      </p>

      <header className="border-b-2 border-[#0e1014] pb-2">
        <h1 className="m-0 font-display text-[24px] font-extrabold uppercase leading-none tracking-tight">
          Model Town Board questions and answers
        </h1>
        <p className="m-0 mt-1 text-[11px]">
          {BOARD_QUESTIONS.length} questions from the Kenya Learner Driver
          Handbook (NTSA, 2016). These are not questions from any test centre.
          Ask your driving school about the board you will be tested on. Free at{" "}
          {PAGE_URL}, where you can drive the board in 3D.
        </p>
      </header>

      <BoardPicture
        part="whole"
        alt="The whole Model Town Board, numbered."
        className="my-3 [&_ol]:text-[10px] [&_ol]:text-[#0e1014]"
      />

      <div className="columns-2 gap-6 text-[10px] leading-snug">
        {BOARD_TOPICS.map((topic) => {
          const index = COURSE_LEVELS.findIndex((l) => l.id === topic.level);
          return (
            <section key={topic.id} className="mb-3">
              <h2 className="bq-topic m-0 mb-1 border-b border-[#0e1014] font-display text-[13px] font-extrabold uppercase tracking-tight">
                {topic.title}
              </h2>
              {boardQuestionsIn(topic.id).map((question) => {
                n += 1;
                return (
                  <div key={question.q} className="bq-item mb-2">
                    <p className="m-0 font-bold">
                      {n}. {question.q}
                    </p>
                    <p className="m-0">{question.a}</p>
                    {question.confirm ? (
                      <p className="m-0 italic">{UNSURE_NOTE}</p>
                    ) : null}
                    <p className="m-0 text-[8px] text-[#5b6068]">
                      {question.source}
                    </p>
                  </div>
                );
              })}
              {index >= 0 ? (
                <p className="bq-item m-0 mb-2 text-[9px] text-[#5b6068]">
                  Practise it on level {index + 1} at{" "}
                  driverush.ke/model-town-board
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
