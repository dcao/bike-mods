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
    tz: string;
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

export function makeUTCLocal(d: Date, o: number = d.getTimezoneOffset()): Date {
  // If we have a date xx:yy UTC and we want to make it xx:yy local, we add back our timezone offset.
  return new Date(d.getTime() + o * 60000);
}

export function makeLocalUTC(d: Date, o: number = d.getTimezoneOffset()): Date {
  // If we have a date xx:yy local and we want to make it xx:yy UTC, we add back our timezone offset.
  return new Date(d.getTime() - o * 60000);
}

export function getOffset(timeZone: string) {
  const timeZoneName = Intl.DateTimeFormat("ia", {
    timeZoneName: "short",
    timeZone,
  })
    .formatToParts()
    .find((i) => i.type === "timeZoneName")!.value;
  const offset = timeZoneName.slice(3);
  if (!offset) return 0;

  const matchData = offset.match(/([+-])(\d+)(?::(\d+))?/);
  if (!matchData) throw `cannot parse timezone name: ${timeZoneName}`;

  const [, sign, hour, minute] = matchData;
  let result = parseInt(hour) * 60;
  if (sign === "+") result *= -1;
  if (minute) result += parseInt(minute);

  return result;
}
