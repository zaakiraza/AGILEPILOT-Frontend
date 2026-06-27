import React from "react";

export function useBusyAction() {
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  async function run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    setBusyKey(key);
    try {
      return await fn();
    } finally {
      setBusyKey(null);
    }
  }

  function isBusy(key?: string) {
    if (key === undefined) return busyKey !== null;
    return busyKey === key;
  }

  return { busyKey, run, isBusy, loading: busyKey !== null };
}
