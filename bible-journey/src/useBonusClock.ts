import { useEffect, useRef, useState } from "react";
import type { Action, BonusAttempt, BonusQuestion } from "./types";

type Pause = { id: string; stopId: string; expectedDeadline: number; pausedAt: number };

/** Pauses the attempt itself, so returning to the stage retains its remaining time. */
export function useBonusClock({ bonus, attempt, stopId, running, dispatch }: {
  bonus?: BonusQuestion;
  attempt?: BonusAttempt;
  stopId?: string;
  running: boolean;
  dispatch: (action: Action) => void;
}) {
  const [now, setNow] = useState(Date.now);
  const pause = useRef<Pause | null>(null);

  useEffect(() => {
    const time = Date.now();
    if (!bonus || !stopId || (attempt && attempt.status !== "playing")) {
      pause.current = null;
      return;
    }
    const pending = pause.current;
    const sameAttempt = !!pending && pending.id === bonus.id && pending.stopId === stopId &&
      pending.expectedDeadline === attempt?.deadline;
    if (!sameAttempt) pause.current = null;

    if (!running) {
      if (attempt && !pause.current && time < attempt.deadline) {
        pause.current = { id: bonus.id, stopId, expectedDeadline: attempt.deadline, pausedAt: time };
        setNow(time);
      }
      return;
    }

    setNow(time);
    if (!attempt) {
      dispatch({ type: "bonus-start", id: bonus.id, stopId, now: time });
      return;
    }
    if (sameAttempt && pending && time > pending.pausedAt) {
      pause.current = null;
      dispatch({ type: "bonus-resume", ...pending, now: time });
      // Wait for the extended deadline before considering expiration.
      return;
    }
    pause.current = null;

    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const tickTime = Date.now();
      setNow(tickTime);
      if (tickTime >= attempt.deadline)
        dispatch({ type: "bonus-expire", id: bonus.id, stopId, now: tickTime });
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => { stopped = true; clearInterval(timer); };
  }, [bonus?.id, attempt?.status, attempt?.deadline, stopId, running, dispatch]);

  return now;
}
