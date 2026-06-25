import { DOMProtocol } from "bike/core";

export type Range = {
  allDay: boolean;
  // Timezone task was created in, for recurring tasks.
  // If null, assume local TZ for compatibility.
  tz: string | null;
  start: Date;
  end: Date | null;
  recur: string | null;
};

export type Task = {
  // priority, deadline, etc.
  scheduled: Range | null;
};

export interface ScheduleSheetProtocol extends DOMProtocol {
  toDOM: {
    type: "start";
    query: string;
    recur: string;
  };
  toApp:
    | { type: "ready" }
    | {
        type: "set";
        query: string;
        scheduled: Range | null;
      };
}

export interface TaskProtocol extends DOMProtocol {
  toDOM:
    | { type: "clear" }
    | {
        type: "row";
        task: Task | null;
      };
  toApp: {
    type: "clicked";
  };
}

export function normalizeDateToAllDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function makeUTCLocal(d: Date): Date {
  // If we have a date xx:yy UTC and we want to make it xx:yy local, we add back our timezone offset.
  const o = d.getTimezoneOffset();
  return new Date(d.getTime() + o * 60000);
}

export function makeLocalUTC(d: Date): Date {
  // If we have a date xx:yy local and we want to make it xx:yy UTC, we add back our timezone offset.
  const o = d.getTimezoneOffset();
  return new Date(d.getTime() - o * 60000);
}
