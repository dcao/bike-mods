import { DOMProtocol } from "bike/core";

export interface ScheduleSheetProtocol extends DOMProtocol {
  toApp: { type: "set"; value: string };
}

export interface TaskProtocol extends DOMProtocol {
  toDOM: { type: "clear" } | { type: "row"; text: string };
  toApp: { type: "clicked" };
}
