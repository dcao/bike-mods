import { DOMProtocol } from "bike/core";

export interface ScheduleSheetProtocol extends DOMProtocol {
  toApp: {
    type: "set";
    scheduled: { allDay: boolean; start: Date; end: Date | null } | null;
  };
}

export interface TaskProtocol extends DOMProtocol {
  toDOM:
    | { type: "clear" }
    | {
        type: "row";
        scheduled:
          | { allDay: boolean; start: Date; end: Date | null }
          | "non-task"
          | "non-sched";
      };
  toApp: {
    type: "clicked";
  };
}
