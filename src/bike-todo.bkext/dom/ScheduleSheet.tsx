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
import { useState } from "react";
import { ScheduleSheetProtocol } from "./protocols";

export function activate(context: DOMExtensionContext<ScheduleSheetProtocol>) {
  createRoot(context.element).render(<ScheduleSheet context={context} />);
}

function ScheduleSheet({
  context,
}: {
  context: DOMExtensionContext<ScheduleSheetProtocol>;
}) {
  const [sch, setSch] = useState("");

  return (
    <div style={{ padding: 8, maxWidth: 600, margin: "0 auto" }}>
      {/* FormRow */}
      <form
        onSubmit={() => {
          context.postMessage({ type: "set", value: sch });
        }}
      >
        <FormRow label="Scheduled">
          <input
            autoFocus
            type="text"
            placeholder="Enter name"
            style={inputStyle}
            value={sch}
            onChange={(e) => setSch(e.target.value)}
          />
        </FormRow>
      </form>
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

const inputStyle: React.CSSProperties = {
  font: "inherit",
  color: "var(--label)",
  background: "var(--control-background)",
  border: "0.5px solid var(--container-border)",
  borderRadius: 4,
  padding: "3px 6px",
  width: "100%",
  boxSizing: "border-box",
};
