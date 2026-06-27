import { AppExtensionContext, CommandContext, Row, Window } from "bike/app";
import {
  getOffset,
  makeLocalUTC,
  makeUTCLocal,
  ScheduleSheetProtocol,
  Task,
  TaskProtocol,
} from "../dom/protocols";
import { RRule } from "rrule";

function getTask(row: Row): Task | null {
  if (row.type !== "task") return null;

  let scheduled;
  if (row.getAttribute("scheduledAllDay") === undefined) {
    scheduled = null;
  } else {
    const e = row.getAttribute("scheduledEnd");

    scheduled = {
      tz: row.getAttribute("scheduledTZ") ?? null,
      allDay: !!+row.getAttribute("scheduledAllDay")!,
      start: new Date(row.getAttribute("scheduledStart")!),
      end: e !== undefined ? new Date(e) : null,
      recur: row.getAttribute("scheduledRecur") ?? null,
    };
  }

  return { scheduled };
}

export async function activate(context: AppExtensionContext) {
  console.log("bike-todo activated");

  bike.commands.addCommands({
    commands: {
      "bike-todo:schedule": scheduleCommand,
      "bike-todo:toggle-done": toggleDoneCommand,
    },
  });

  bike.observeWindows(async (window: Window) => {
    // const taskHandle = await window.inspector.addItem<TaskProtocol>({
    //   label: "TaskInfo",
    //   script: "TaskInfo.js",
    // });

    // window.observeCurrentOutlineEditor((editor) => {
    //   if (!editor) return;
    //   editor.observeSelection((selection) => {
    //     if (!selection) {
    //       taskHandle.postMessage({ type: "clear" });
    //       return;
    //     }

    //     // We have a row!
    //     const row = selection.row;

    //     taskHandle.postMessage({
    //       type: "row",
    //       task: getTask(row),
    //     });
    //   }, 300);
    // });

    window.inspector.addItem({
      label: "Agenda",
      script: "Agenda.js",
    });
  });
}

function toggleDoneCommand(context: CommandContext): boolean {
  const editor = context.editor;
  if (editor === undefined) return true;

  let rr = context.selection;
  if (rr === undefined) return true;

  editor.transaction({ label: "complete tasks" }, () => {
    for (const row of rr.rows) {
      // if (!editor.isFocused(row)) continue;
      const tz =
        row.getAttribute("scheduledTZ") ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const d = row.getAttribute("done");
      if (d !== undefined) {
        d.removeAttribute("done");
      } else {
        // First, toggle this thing done.
        row.setAttribute("done", new Date().toISOString());

        // Next, let's get the task info for this row.
        const info = getTask(row);
        if (
          info !== null &&
          info.scheduled !== null &&
          info.scheduled.recur !== null
        ) {
          const dtstart =
            new Date() > info.scheduled.start
              ? new Date()
              : info.scheduled.start;

          const rrule = RRule.fromString(info.scheduled.recur);
          const nn = rrule.after(makeLocalUTC(dtstart, getOffset(tz)));

          if (nn === null) {
            // We need to do it here cause otherwise, we'll copy the row with this recur.
            row.removeAttribute("scheduledRecur");
            continue;
          }
          const next = makeUTCLocal(nn);

          const oldStart = new Date(info.scheduled.start);
          const n = editor.outline.insertRows([row], row.parent, row);
          row.removeAttribute("scheduledRecur");
          editor.outline.moveRows(
            [row],
            row.parent ?? editor.outline.root,
            n[0],
          );

          n[0].removeAttribute("done");
          n[0].setAttribute("scheduledStart", next.toISOString());

          if (info.scheduled.end !== null) {
            const deltaMs = info.scheduled.end.getTime() - oldStart.getTime();
            n[0].setAttribute(
              "scheduledEnd",
              new Date(next.getTime() + deltaMs).toISOString(),
            );
          }

          if (rr.rows.length === 1) {
            editor.selectRows(n[0]);
          }
        }
      }
    }
  });

  return true;
}

function scheduleCommand(context: CommandContext): boolean {
  let window = bike.frontmostWindow;
  if (!window) return false;

  let rr = context.selection?.row;

  window
    .presentSheet<ScheduleSheetProtocol>("ScheduleSheet.js", {
      width: 450,
      height: 450,
    })
    .then((handle) => {
      handle.onmessage = (message) => {
        switch (message.type) {
          case "ready":
            let query = "";
            const allDay = !!+(rr?.getAttribute("scheduledAllDay") ?? "0");
            if (rr?.getAttribute("scheduledStart") !== undefined) {
              query += allDay
                ? makeUTCLocal(
                    new Date(rr?.getAttribute("scheduledStart")),
                  ).toLocaleDateString()
                : new Date(rr?.getAttribute("scheduledStart")).toLocaleString();
            }
            if (rr?.getAttribute("scheduledEnd") !== undefined) {
              query += " - ";
              query += allDay
                ? makeUTCLocal(
                    new Date(rr?.getAttribute("scheduledEnd")),
                  ).toLocaleDateString()
                : new Date(rr?.getAttribute("scheduledEnd")).toLocaleString();
            }
            const recur = rr?.getAttribute("scheduledRecur");

            handle.postMessage({
              type: "start",
              query,
              recur:
                recur !== undefined ? RRule.fromString(recur).toText() : "",
              tz: rr!.getAttribute("scheduledTZ") ?? "",
            });
            break;

          case "set":
            const e = bike.frontmostOutlineEditor;
            const r = e?.selection?.row;
            const s = message.scheduled;
            if (s !== null && r !== undefined) {
              e!.transaction({ label: "set scheduled" }, () => {
                r.setAttribute("scheduledAllDay", +s.allDay);
                r.setAttribute("scheduledStart", s.start.toISOString());
                if (s.tz !== null) r.setAttribute("scheduledTZ", s.tz);
                if (s.end !== null)
                  r.setAttribute("scheduledEnd", s.end.toISOString());
                if (s.recur !== null) r.setAttribute("scheduledRecur", s.recur);
              });
            } else if (message.query === "" && r !== undefined) {
              e!.transaction({ label: "set scheduled" }, () => {
                r.removeAttribute("scheduledAllDay");
                r.removeAttribute("scheduledStart");
                r.removeAttribute("scheduledEnd");
                r.removeAttribute("scheduledRecur");
                r.removeAttribute("scheduledTZ");
              });
            }
            handle.dispose();
            break;
        }
      };
    });

  return true;
}
