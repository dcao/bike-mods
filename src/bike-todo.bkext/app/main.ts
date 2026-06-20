import { AppExtensionContext, CommandContext, Window } from "bike/app";
import { ScheduleSheetProtocol, TaskProtocol } from "../dom/protocols";

export async function activate(context: AppExtensionContext) {
  console.log("bike-todo activated");

  bike.commands.addCommands({
    commands: {
      "bike-todo:hello": helloCommand,
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

        // We have a selection.
        // Next, let's do some computation.

        taskHandle.postMessage({
          type: "row",
          text: selection.row.text.string,
        });
      }, 25);
    });
  });
}

function helloCommand(context: CommandContext): boolean {
  let window = bike.frontmostWindow;
  if (!window) return false;

  let clickCount = 0;

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
            bike.frontmostOutlineEditor?.selection?.row.setAttribute(
              "scheduled",
              message.value,
            );
            handle.dispose();
            break;
        }
      };
    });

  return true;
}
