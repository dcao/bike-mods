import { DOMExtensionContext } from "bike/dom";
import { Disclosure, SFSymbol } from "bike/components";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { Task, TaskProtocol } from "./protocols";

function TaskInfoPanel({
  context,
}: {
  context: DOMExtensionContext<TaskProtocol>;
}) {
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    context.onmessage = (message) => {
      switch (message.type) {
        case "row":
          setTask(message.task);
          break;
        case "clear":
          setTask(null);
          break;
      }
    };
    return () => {
      context.onmessage = undefined;
    };
  }, []);

  let body;
  if (task === null) {
    body = <p>Not a task</p>;
  } else {
    body = (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "20% 80%",
          alignItems: "center",
          justifyItems: "left",
        }}
      >
        <SFSymbol name="calendar.badge.clock" scale="small" />
        {task.scheduled === null ? (
          <p>No scheduled</p>
        ) : task.scheduled.allDay ? (
          <span>{task.scheduled.start.toLocaleDateString()}</span>
        ) : (
          <span>{task.scheduled.start.toLocaleString()}</span>
        )}
      </div>
    );
  }

  return (
    <Disclosure className="task-info" label="Task Inspector" defaultExpanded>
      {body}
    </Disclosure>
  );
}

export function activate(context: DOMExtensionContext<TaskProtocol>) {
  const container = context.element;
  const root = createRoot(container);
  root.render(<TaskInfoPanel context={context} />);
}
