import { useEffect, useRef, type RefObject } from "react";
import { trackSimulationAbandoned } from "@/lib/analytics/analytics";

/** Lacak pengguna yang meninggalkan /simulate tanpa menyelesaikan simulasi. */
export function useSimulationAbandonTracking(simulationCompletedRef: RefObject<boolean>) {
  const abandonTrackedRef = useRef(false);

  useEffect(() => {
    abandonTrackedRef.current = false;

    const maybeTrackAbandon = () => {
      if (simulationCompletedRef.current || abandonTrackedRef.current) return;
      abandonTrackedRef.current = true;
      trackSimulationAbandoned();
    };

    window.addEventListener("pagehide", maybeTrackAbandon);
    return () => {
      window.removeEventListener("pagehide", maybeTrackAbandon);
      maybeTrackAbandon();
    };
  }, [simulationCompletedRef]);
}
