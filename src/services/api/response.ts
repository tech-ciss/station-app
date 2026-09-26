export function unwrapApiData<T = unknown>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function unwrapApiList<T = unknown>(payload: unknown): T[] {
  const data = unwrapApiData(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const record = data as {
      items?: T[];
      results?: T[];
      rows?: T[];
      transactions?: T[];
      pumps?: T[];
    };

    return record.items ?? record.results ?? record.rows ?? record.transactions ?? record.pumps ?? [];
  }

  return [];
}
