import { useCallback } from "react";
import apiClient from "../api/client";
import type { Screening } from "../types/screening";
import { useFetch, type UseFetchResult } from "./useFetch";

interface ScreeningQuery {
  movieId?: number;
  cinemaId?: number;
  age?: number;
  when?: "today" | "tomorrow" | "weekend";
  date?: string;
}

export function useScreenings(
  filters?: ScreeningQuery,
): UseFetchResult<Screening[]> {
  const { movieId, cinemaId, age, when, date } = filters ?? {};

  const fetchScreenings = useCallback(
    (signal: AbortSignal) => {
      return apiClient.get<Screening[]>("/screenings", {
        signal,
        params: { movieId, cinemaId, age, when, date },
      });
    },
    [movieId, cinemaId, age, when, date],
  );

  return useFetch<Screening[]>(fetchScreenings, {
    deps: [movieId, cinemaId, age, when, date],
  });
}
