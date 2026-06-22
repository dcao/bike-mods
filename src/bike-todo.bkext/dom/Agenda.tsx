import { DOMExtensionContext } from "bike/dom";
import { Checkbox, Disclosure, Label } from "bike/components";
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import { Task } from "./protocols";

export async function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<Todos />);
}

type Todo = Task & {
  id: SessionId;
  text: string;
};

function collectTodos(snapshot: SessionOutline | null): Todo[] {
  return (
    snapshot?.root.children?.map((row) => {
      const as = row.attributes;

      let scheduled;
      if (as === undefined) {
        scheduled = null;
      } else if (as["scheduledAllDay"] === undefined) {
        scheduled = null;
      } else {
        const e = as["scheduledEnd"];

        scheduled = {
          query: as["scheduledQuery"],
          allDay: !!+as["scheduledAllDay"]!,
          start: new Date(as["scheduledStart"]!),
          end: e !== undefined ? new Date(e) : null,
        };
      }

      return {
        id: row.id,
        text: row.text.map((run) => run.string).join(""),
        scheduled,
      };
    }) ?? []
  );
}

function dateDiffInDays(a: Date, b: Date) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<SessionId>>(new Set());
  const [closed, setClosed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let sub: SessionSubscription | undefined;
    let canceled = false;
    bike.session
      .observeOutlineQuery(
        { path: "//task not @done", shape: "flat" },
        (snapshot) => {
          const next = collectTodos(snapshot).filter(
            (t) =>
              t.scheduled !== null &&
              dateDiffInDays(t.scheduled.start, new Date()) <= 7,
          );
          setTodos(next);
          setCheckedIds((prev) => {
            const ids = new Set(next.map((t) => t.id));
            return new Set([...prev].filter((id) => ids.has(id)));
          });
        },
        { onClose: () => setClosed(true) },
      )
      .then((s) => {
        if (canceled) {
          s.dispose();
        } else {
          sub = s;
        }
      });
    return () => {
      canceled = true;
      sub?.dispose();
    };
  }, []);

  const checkOff = (todo: Todo) => {
    setCheckedIds((prev) => new Set(prev).add(todo.id));
    bike.session.evaluateCommands({
      ids: ["row:toggle-done"],
      rows: [todo.id],
    });
  };

  const grouped = useMemo(() => {
    return Object.groupBy(todos, ({ scheduled }) => {
      return scheduled!.start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    });
  }, [todos]);

  return (
    <Disclosure
      label="Agenda"
      accessory={<Label color="secondary">{todos.length}</Label>}
      expanded={expanded}
      onChange={setExpanded}
    >
      {!expanded ? null : todos.length === 0 ? (
        <Label color="secondary">
          {closed ? "Outline closed" : "No unchecked tasks"}
        </Label>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
          {Object.entries(grouped)
            .toSorted((a, b) => a[0].localeCompare(b[0]))
            .map(([header, todos]) => (
              <div>
                <h1 style={{ marginTop: 0 }}>{header}</h1>
                {todos!
                  .toSorted((a, b) => {
                    return (
                      a.scheduled!.start.getTime() -
                      b.scheduled!.start.getTime()
                    );
                  })
                  .map((todo) => {
                    let timestr = "";

                    if (!todo.scheduled!.allDay) {
                      timestr += todo.scheduled!.start.toLocaleTimeString(
                        undefined,
                        {
                          hour: "numeric",
                          hour12: true,
                          minute: "2-digit",
                        },
                      );

                      if (todo.scheduled!.end !== null) {
                        timestr += " – ";
                        timestr += todo.scheduled!.end.toLocaleTimeString(
                          undefined,
                          {
                            hour: "numeric",
                            hour12: true,
                            minute: "2-digit",
                          },
                        );
                      }
                    }

                    return (
                      <div
                        key={todo.id}
                        style={{
                          display: "flex",
                          gap: "0.4em",
                        }}
                      >
                        <Checkbox
                          checked={checkedIds.has(todo.id)}
                          onChange={() => checkOff(todo)}
                        />
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span
                            role="button"
                            style={{
                              cursor: "pointer",
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.textDecoration =
                                "underline")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.textDecoration = "none")
                            }
                            onClick={() =>
                              bike.session.updateEditor({ select: todo.id })
                            }
                          >
                            {todo.text || "Untitled task"}
                          </span>
                          <span
                            style={{
                              cursor: "pointer",
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flexShrink: "0",
                              opacity: "50%",
                            }}
                          >
                            {timestr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
        </div>
      )}
    </Disclosure>
  );
};
