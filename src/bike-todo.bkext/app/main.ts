import { AppExtensionContext, CommandContext, Window } from "bike/app";
import { ScheduleSheetProtocol, TaskProtocol } from "../dom/protocols";

export async function activate(context: AppExtensionContext) {
  console.log("bike-todo activated");

  bike.commands.addCommands({
    commands: {
      "bike-todo:schedule": scheduleCommand,
    },
  });

  // bike.observeWindows(async (window: Window) => {
  //   const taskHandle = await window.inspector.addItem<TaskProtocol>({
  //     label: "TaskInfo",
  //     script: "TaskInfo.js",
  //   });

  //   window.observeCurrentOutlineEditor((editor) => {
  //     if (!editor) return;
  //     editor.observeSelection((selection) => {
  //       if (!selection) {
  //         taskHandle.postMessage({ type: "clear" });
  //         return;
  //       }

  //       // We have a row!
  //       const row = selection.row;
  //       let scheduled:
  //         | { allDay: boolean; start: Date; end: Date | null }
  //         | "non-task"
  //         | "non-sched";

  //       // First, let's check if this is a task.
  //       if (row.getAttribute("@type") !== "task") {
  //         scheduled = "non-task";
  //       } else {
  //         if (row.getAttribute("@scheduledAllDay") === undefined) {
  //           scheduled = "non-sched";
  //         } else {
  //           scheduled = {
  //             allDay: !!row.getAttribute("@scheduledAllDay"),
  //             start: new Date(row.getAttribute("@scheduledStart")),
  //             end:
  //               row.getAttribute("@scheduledEnd") !== undefined
  //                 ? new Date(row.getAttribute("@scheduledEnd"))
  //                 : null,
  //           };
  //         }
  //       }

  //       taskHandle.postMessage({
  //         type: "row",
  //         scheduled,
  //       });
  //     }, 300);
  //   });
  // });
}

function scheduleCommand(context: CommandContext): boolean {
  let window = bike.frontmostWindow;
  if (!window) return false;

  window
    .presentSheet<ScheduleSheetProtocol>("ScheduleSheet.js", {
      width: 450,
      height: 150,
    })
    .then((handle) => {
      handle.postMessage({ type: "greeting", name: "World" });
      handle.onmessage = (message) => {
        switch (message.type) {
          case "set":
            const r = bike.frontmostOutlineEditor?.selection?.row;
            if (message.scheduled !== null && r !== undefined) {
              const s = message.scheduled;
              r.setAttribute("scheduledAllDay", +s.allDay);
              r.setAttribute("scheduledStart", s.start.toISOString());
              if (s.end) r.setAttribute("scheduledEnd", s.end.toISOString());
            }
            handle.dispose();
            break;
        }
      };
    });

  return true;
}
