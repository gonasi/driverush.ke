/**
 * The way to open the level picker from anywhere inside the game. The game
 * provides it. Outside the game there is none, and "All levels" is a link to
 * the levels page.
 */
import * as React from "react";

export const OpenLevelsContext = React.createContext<(() => void) | null>(null);

export function useOpenLevels(): (() => void) | null {
  return React.useContext(OpenLevelsContext);
}
