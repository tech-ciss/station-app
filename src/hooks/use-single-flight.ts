import { useRef } from "react";

export type SingleFlightResult<T> =
  | { executed: true; value: T }
  | { executed: false };

export function createSingleFlight() {
  let isRunning = false;

  return async function run<T>(task: () => Promise<T>): Promise<SingleFlightResult<T>> {
    if (isRunning) {
      return { executed: false };
    }

    isRunning = true;

    try {
      return { executed: true, value: await task() };
    } finally {
      isRunning = false;
    }
  };
}

export function useSingleFlight() {
  const runner = useRef<ReturnType<typeof createSingleFlight> | null>(null);

  if (!runner.current) {
    runner.current = createSingleFlight();
  }

  return runner.current;
}
