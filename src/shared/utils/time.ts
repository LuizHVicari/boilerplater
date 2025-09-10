import { ONE_SECOND_MILLISECONDS } from "../constants/time-units.constants";

export function secondsToMilliseconds(seconds: number): number {
  return seconds * ONE_SECOND_MILLISECONDS;
}

export function millisecondsToSeconds(milliseconds: number): number {
  return milliseconds / ONE_SECOND_MILLISECONDS;
}
