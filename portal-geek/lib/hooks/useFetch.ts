"use client";

import { useEffect, useState } from "react";

/**
This is a new type of file in our project: a custom hook. It has this comment section 
in order to let the rest of the team understand what it is and how to use it. 

They are functions that let you share logic between components without repeating code. 
They can manage state, side effects, and more. They usually start with "use" and can 
call other hooks inside them.

The one below is a generic hook for fetching data from an API endpoint. 
It handles the classic 3 states: loading, error, and data.

 
Use:
    const { data, loading, error } = useFetch<MaquinaOption[]>("/api/maquinas");


if the endpoint returns a paginated response with shape `{ data, meta }`, the caller 
should extract .data after, like this:

 */
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(url);
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