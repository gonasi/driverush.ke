/**
 * One whole sign, cropped from the chart to its measured edges. A tiny margin keeps
 * it off the frame, and the clip stops anything beside it on the chart showing there.
 */
import { regionSpriteStyle } from "~/lib/image-focus";
import { CHART_SRC, type SignPage } from "~/lib/road-sign-pages";
import { cn } from "~/lib/utils";

export function SignImage({
  sign,
  label,
  className,
}: {
  sign: Pick<SignPage, "crop">;
  /** Accessible name. Leave out when text beside the image already names the sign. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      className={cn("relative block bg-white", className)}
    >
      <span
        className="absolute inset-[6%]"
        style={{
          ...regionSpriteStyle(sign.crop, CHART_SRC, -0.03),
          clipPath: "inset(2.6%)",
        }}
      />
    </span>
  );
}
