import { DOMExtensionContext } from "bike/dom";
import {
  Box,
  SFSymbol,
  Button,
  Label,
  FormRow,
  SegmentedControl,
} from "bike/components";
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import {
  getOffset,
  makeLocalUTC,
  makeUTCLocal,
  normalizeDateToAllDay,
  ScheduleSheetProtocol,
} from "./protocols";
import * as chrono from "chrono-node";
import { RRule } from "rrule";

export function activate(context: DOMExtensionContext<ScheduleSheetProtocol>) {
  createRoot(context.element).render(<ScheduleSheet context={context} />);
}

const isEmpty = (o: object) => {
  for (const prop in o) {
    if (Object.hasOwn(o, prop)) {
      return false;
    }
  }

  return true;
};

function isValidTimeZone(tz: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (ex) {
    return false;
  }
}

function ScheduleSheet({
  context,
}: {
  context: DOMExtensionContext<ScheduleSheetProtocol>;
}) {
  const [sch, setSch] = useState("");
  const [rr, setRr] = useState("");
  const [tzTxt, setTzTxt] = useState("");

  const localTz = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);
  const tz = useMemo(() => {
    if (isValidTimeZone(tzTxt)) {
      return tzTxt;
    } else {
      return localTz;
    }
  }, [tzTxt]);

  useEffect(() => {
    context.onmessage = (message) => {
      switch (message.type) {
        case "start":
          setSch(message.query);
          setRr(message.recur);
          setTzTxt(message.tz);
          break;
      }
    };

    context.postMessage({ type: "ready" });
  }, []);

  const r = useMemo(() => {
    // Chrono doesn't understand JavaScript's timezones, so we have to
    // get creative.
    const p = chrono.parse(sch, { timezone: -getOffset(tz) });
    return p.length === 0 ? null : p[0];
  }, [sch, tz]);

  const notAllDay =
    r === null
      ? null
      : r.start.isCertain("hour") ||
        (r.end !== null && r.end !== undefined && r.end.isCertain("hour"));

  const displayD = (p: chrono.ParsedComponents) => {
    if (p.isCertain("hour")) {
      return p.date().toLocaleString();
    } else {
      return p.date().toLocaleDateString();
    }
  };

  const parsedRr = useMemo(() => {
    try {
      const opts = RRule.parseText(rr);
      if (isEmpty(opts)) {
        return null;
      } else {
        if (r === null) return null;
        opts.dtstart = notAllDay
          ? makeLocalUTC(r.date(), getOffset(tz))
          : normalizeDateToAllDay(r.date());
        opts.tzid = tz;
        return new RRule(opts);
      }
    } catch {
      return null;
    }
  }, [r, rr, tz]);

  let body;
  if (r === null) {
    body = <span>Empty / unparseable date</span>;
  } else {
    body = (
      <>
        <div style={{ marginTop: "1em" }}>
          <FormRow label="Start">
            <strong>{displayD(r.start)}</strong>
          </FormRow>
          <FormRow label="End">
            <strong>
              {r.end !== undefined && r.end !== null ? displayD(r.end) : ""}
            </strong>
          </FormRow>
        </div>
      </>
    );
  }

  let rrb;
  if (parsedRr === null) {
    rrb = <span>No recurrence</span>;
  } else {
    rrb = (
      <>
        <div
          style={{ marginTop: "1em", display: "flex", flexDirection: "row" }}
        >
          <strong>{parsedRr.toText()}</strong>
          <div style={{ flexGrow: "1", textAlign: "right", color: "gray" }}>
            {parsedRr
              .all((_, l) => l <= 4)
              .map((d) => {
                return (
                  <p style={{ margin: 0 }}>
                    {makeUTCLocal(d).toLocaleString()}
                  </p>
                );
              })}
          </div>
        </div>
      </>
    );
  }

  const submit: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;

    // Alright. Let's figure out what we're sending over.
    if (r === null) {
      context.postMessage({ type: "set", query: sch, scheduled: null });
      return;
    }
    let start = r.start.date();
    let end = r.end?.date() ?? null;

    if (!notAllDay) {
      start = normalizeDateToAllDay(start);
      if (end) end = normalizeDateToAllDay(end);
    }

    context.postMessage({
      type: "set",
      query: sch,
      scheduled: {
        allDay: !notAllDay,
        tz,
        start,
        end,
        recur: parsedRr?.toString() ?? null,
      },
    });
  };

  return (
    <div style={{ padding: 8, maxWidth: 600, margin: "0 auto" }}>
      {/* FormRow */}
      <input
        autoFocus
        type="text"
        placeholder="Enter scheduled date"
        style={{
          font: "inherit",
          fontSize: "1.25em",
          color: "var(--label)",
          background: "var(--control-background)",
          border: "0.5px solid var(--container-border)",
          borderRadius: 4,
          padding: "6px",
          marginBottom: "0.5rem",
          width: "100%",
          boxSizing: "border-box",
        }}
        value={sch}
        onChange={(e) => setSch(e.target.value)}
        onKeyDown={submit}
      />
      <div style={{ marginBottom: "2em" }}>{body}</div>
      {r !== null ? (
        <>
          <div style={{ display: "flex", flexDirection: "row", gap: "0.25em" }}>
            <input
              type="text"
              placeholder="Recurrence rule"
              style={{
                font: "inherit",
                color: "var(--label)",
                background: "var(--control-background)",
                border: "0.5px solid var(--container-border)",
                borderRadius: 4,
                padding: "6px",
                marginBottom: "0.5rem",
                width: "60%",
                boxSizing: "border-box",
              }}
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              onKeyDown={submit}
            />
            <input
              type="text"
              placeholder="Timezone"
              style={{
                font: "inherit",
                color: tzTxt !== tz ? "red" : "var(--label)",
                background: "var(--control-background)",
                border: "0.5px solid var(--container-border)",
                borderRadius: 4,
                padding: "6px",
                marginBottom: "0.5rem",
                width: "40%",
                boxSizing: "border-box",
              }}
              value={tzTxt}
              onChange={(e) => setTzTxt(e.target.value)}
              onKeyDown={submit}
            />
          </div>
          <div style={{ marginBottom: "2em" }}>{rrb}</div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
