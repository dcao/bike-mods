import { DOMExtensionContext } from "bike/dom";
import { Disclosure, SFSymbol } from "bike/components";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { TaskProtocol } from "./protocols";

function TaskInfoPanel({
  context,
}: {
  context: DOMExtensionContext<TaskProtocol>;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    context.onmessage = (message) => {
      switch (message.type) {
        case "row":
          if (message.scheduled === "non-task") {
            setText("Not a task");
          } else if (message.scheduled === "non-sched") {
            setText("No scheduled date");
          } else {
            setText("Todo");
          }
          break;
        case "clear":
          setText("");
          break;
      }
    };
    return () => {
      context.onmessage = undefined;
    };
  }, []);

  return (
    <Disclosure className="task-info" label="shoutout" defaultExpanded>
      <p>{text}</p>
    </Disclosure>
  );
}

export function activate(context: DOMExtensionContext<TaskProtocol>) {
  const container = context.element;
  const root = createRoot(container);
  root.render(<TaskInfoPanel context={context} />);
}
