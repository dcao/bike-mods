import { AppExtensionContext, CommandContext, Row, Window } from "bike/app";
import { ScheduleSheetProtocol, Task, TaskProtocol } from "../dom/protocols";

function getTask(row: Row): Task | null {
  if (row.type !== "task") return null;

  let scheduled;
  if (row.getAttribute("scheduledAllDay") === undefined) {
    scheduled = null;
  } else {
    const e = row.getAttribute("scheduledEnd");

    scheduled = {
      query: row.getAttribute("scheduledQuery")!,
      allDay: !!+row.getAttribute("scheduledAllDay")!,
      start: new Date(row.getAttribute("scheduledStart")!),
      end: e !== undefined ? new Date(e) : null,
    };
  }

  return { scheduled };
}

export async function activate(context: AppExtensionContext) {
  console.log("bike-todo activated");

  bike.commands.addCommands({
    commands: {
      "bike-todo:schedule": scheduleCommand,
    },
  });

  bike.observeWindows(async (window: Window) => {
    const taskHandle = await window.inspector.addItem<TaskProtocol>({
      label: "TaskInfo",
      script: "TaskInfo.js",
    });

    window.observeCurrentOutlineEditor((editor) => {
      if (!editor) return;
      editor.observeSelection((selection) => {
        if (!selection) {
          taskHandle.postMessage({ type: "clear" });
          return;
        }

        // We have a row!
        const row = selection.row;

        taskHandle.postMessage({
          type: "row",
          task: getTask(row),
        });
      }, 300);
    });

    window.inspector.addItem({
      label: "Agenda",
      script: "Agenda.js",
    });
  });
}

function scheduleCommand(context: CommandContext): boolean {
  let window = bike.frontmostWindow;
  if (!window) return false;

  const query = context.selection?.row.getAttribute("scheduledQuery") ?? "";

  window
    .presentSheet<ScheduleSheetProtocol>("ScheduleSheet.js", {
      width: 450,
      height: 150,
    })
    .then((handle) => {
      handle.postMessage({ type: "start", query: "" });
      handle.onmessage = (message) => {
        switch (message.type) {
          case "set":
            const r = bike.frontmostOutlineEditor?.selection?.row;
            if (message.scheduled !== null && r !== undefined) {
              const s = message.scheduled;
              r.setAttribute("scheduledQuery", s.query);
              r.setAttribute("scheduledAllDay", +s.allDay);
              r.setAttribute("scheduledStart", s.start.toISOString());
              if (s.end) r.setAttribute("scheduledEnd", s.end.toISOString());
            } else if (message.query === "" && r !== undefined) {
              r.removeAttribute("scheduledAllDay");
              r.removeAttribute("scheduledStart");
              r.removeAttribute("scheduledEnd");
              r.removeAttribute("scheduledQuery");
            }
            handle.dispose();
            break;
        }
      };
    });

  return true;
}
