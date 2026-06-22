import { DOMProtocol } from "bike/core";

export type Range = {
  query: string;
  allDay: boolean;
  start: Date;
  end: Date | null;
};

export type Task = {
  // priority, deadline, etc.
  scheduled: Range | null;
};

export interface ScheduleSheetProtocol extends DOMProtocol {
  toDOM: {
    type: "start";
    query: string;
  };
  toApp: {
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
