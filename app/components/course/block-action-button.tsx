import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  AwardFreeIcons,
} from "@hugeicons/core-free-icons";

import { Button } from "~/components/ui/button";
import { useFeedback } from "~/lib/use-feedback";

/**
 * The per-block Continue / Complete-lesson button (Gonasi's BlockActionButton).
 * Plays a tap sound, gently nudges to draw the eye, and reads "Complete lesson"
 * on the final block.
 */
export function BlockActionButton({
  onClick,
  isLast,
  label,
}: {
  onClick: () => void;
  isLast?: boolean;
  label?: string;
}) {
  const { tap } = useFeedback();
  return (
    <motion.div
      className="inline-block"
      animate={{ x: [0, 3, 0] }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: "easeInOut",
      }}
    >
      <Button
        variant="rush"
        size="lg"
        onClick={() => {
          tap();
          onClick();
        }}
      >
        {label ?? (isLast ? "Complete lesson" : "Continue")}
        <HugeiconsIcon
          icon={isLast ? AwardFreeIcons : ArrowRight02FreeIcons}
          size={16}
          strokeWidth={2.5}
        />
      </Button>
    </motion.div>
  );
}
