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
import { useMemo, useState } from "react";
import { ScheduleSheetProtocol } from "./protocols";
import * as chrono from "chrono-node";

export function activate(context: DOMExtensionContext<ScheduleSheetProtocol>) {
  createRoot(context.element).render(<ScheduleSheet context={context} />);
}

function ScheduleSheet({
  context,
}: {
  context: DOMExtensionContext<ScheduleSheetProtocol>;
}) {
  const [sch, setSch] = useState("");
  const r = useMemo(() => {
    const p = chrono.parse(sch);
    return p.length === 0 ? null : p[0];
  }, [sch]);

  const displayD = (p: chrono.ParsedComponents) => {
    console.log(p);

    if (p.isCertain("hour")) {
      return p.date().toLocaleString();
    } else {
      return p.date().toLocaleDateString();
    }
  };

  let body;
  if (r === null) {
    body = <p>No results.</p>;
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

  return (
    <div style={{ padding: 8, maxWidth: 600, margin: "0 auto" }}>
      {/* FormRow */}
      <form
        onSubmit={() => {
          // Alright. Let's figure out what we're sending over.
          if (r === null) {
            context.postMessage({ type: "set", scheduled: null });
            return;
          }
          const notAllDay =
            r.start.isCertain("hour") ||
            (r.end !== null && r.end !== undefined && r.end.isCertain("hour"));
          const start = r.start.date();
          const end = r.end?.date() ?? null;
          context.postMessage({
            type: "set",
            scheduled: { allDay: !notAllDay, start, end },
          });
        }}
      >
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
            padding: "3px 6px",
            marginBottom: "0.25rem",
            width: "100%",
            boxSizing: "border-box",
          }}
          value={sch}
          onChange={(e) => setSch(e.target.value)}
        />
      </form>

      {body}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
    >
      {children}
    </div>
  );
}

function Swatch({
  bg,
  label,
  light,
  style,
}: {
  bg: string;
  label: string;
  light?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: bg,
        color: light ? "var(--selected-content-text)" : "var(--label)",
        padding: "4px 8px",
        borderRadius: 4,
        border: "0.5px solid var(--separator)",
        font: "-apple-system-caption1",
        ...style,
      }}
    >
      {label}
    </div>
  );
}
