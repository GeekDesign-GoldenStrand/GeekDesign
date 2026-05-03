"use client";

import { useEffect, useState } from "react";

/** This is a new type of file in our project: a custom hook. It has this comment section
 in order to let the rest of the team understand what it is and how to use it.
 
 They are functions that let you share logic between components without repeating code.
 They can manage state, side effects, and more. They usually start with "use" and can
 call other hooks inside them.
 
 The one below is a generic hook for fetching data from an API endpoint.
 It handles the classic 3 states: loading, error, and data.
 
 Use:
   const { data, loading, error } = useFetch<MaquinaOption[]>("/api/maquinas");
 
 If the endpoint returns a paginated response with shape `{ data, meta }`, the caller
 should extract .data after.
 
 If the URL is null, no fetch is dispatched. Useful for fetches that depend on
 a previous user choice (e.g. "machines for branch X" only fires after the admin
 picks a branch).
 */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  // Start non-loading when there's no URL yet — there's nothing to wait for.
  const [loading, setLoading] = useState(url !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if no URL was provided. Reset state so stale data from a previous
    // URL doesn't leak through (e.g. branch A's machines showing while branch B loads).
    if (url === null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function run() {
      try {
        const res = await fetch(url!);
        if (!res.ok) throw new Error(`Error al cargar ${url}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    // Cleanup function: if the component unmounts before the fetch finishes,
    // avoid calling setState on an unmounted component (memory leak).
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}