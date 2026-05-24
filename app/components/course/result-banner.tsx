import * as React from "react";
import { motion } from "framer-motion";

import { FeedbackBanner } from "~/components/brand/feedback-banner";

/**
 * Verdict banner shown after an answer (Gonasi's RenderFeedback). Pops in on a
 * correct answer, shakes on a wrong one, optionally shows the earned score, and
 * hosts the action buttons (Continue / Why? / Try again / Show answer) on the
 * right. Sounds + haptics are fired by the renderer's answer handler, not here,
 * so they play exactly once.
 */
export function ResultBanner({
  correct,
  title,
  description,
  score,
  actions,
}: {
  correct: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  score?: number | null;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={
        correct
          ? { opacity: 1, scale: 1 }
          : { opacity: 1, scale: 1, x: [0, -7, 7, -5, 5, 0] }
      }
      transition={{ duration: correct ? 0.18 : 0.42, ease: "easeOut" }}
    >
      <FeedbackBanner
        tone={correct ? "win" : "fail"}
        title={
          <span className="flex items-center gap-2">
            {title}
            {typeof score === "number" && (
              <span className="font-mono text-[11px] font-bold tabular-nums opacity-90">
                +{score} pts
              </span>
            )}
          </span>
        }
        description={description}
        action={actions}
      />
    </motion.div>
  );
}
