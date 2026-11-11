import * as React from "react";

import {
  onParkingLayout,
  parkingLayout,
  type ParkingLayout,
} from "~/lib/board/parking-layouts";

/** The parking layout showing now. Redraws when the parked cars are moved. */
export function useParkingLayout(): ParkingLayout {
  return React.useSyncExternalStore(
    onParkingLayout,
    parkingLayout,
    parkingLayout,
  );
}
