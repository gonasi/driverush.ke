/**
 * The words on the board course's one button ("Start level 1", "Continue:
 * level N"). For a learner who has started, they are kept out of sight until
 * their saved progress has been read, so the button never says one thing and
 * then another. See `course-label.css`.
 */
import * as React from "react";

import "./course-label.css";

export function CourseLabel({
  label,
  ready,
  started,
}: {
  label: string;
  /** The saved progress has been read: the label is the right one. */
  ready: boolean;
  /** The learner has finished a level, now or before. */
  started: boolean;
}) {
  // A first level finished on this visit: the page is theirs from now on too.
  React.useEffect(() => {
    if (started) document.documentElement.dataset.board = "started";
  }, [started]);
  return (
    <span data-course-label data-ready={ready ? "" : undefined}>
      {label}
    </span>
  );
}
