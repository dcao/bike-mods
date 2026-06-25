import {
  Color,
  ContentsGravity,
  Decoration,
  defineEditorStyle,
  defineEditorStyleModifier,
  Font,
  Image,
  Insets,
  SymbolConfiguration,
  Text,
} from "bike/style";

const mod = defineEditorStyleModifier("bike-todo", "Bike Todo Styles");

const now = new Date();
const offset = now.getTimezoneOffset();
const thisYear = now.getFullYear();

type Obj = { month?: number; day?: number; hour?: number };

function s(x: Partial<ObjProper>): ContentsGravity {
  return JSON.stringify(x) as ContentsGravity;
}

function uns(x: string): Partial<ObjProper> {
  return JSON.parse(x);
}

// Copy of the function in protocols.ts
function localizeAllDayDate(d: Date): Date {
  // We assume d is a date at 00:00 UTC. We want to convert this to 00:00 local time. So we should undo the timezone offset!
  const o = d.getTimezoneOffset();
  return new Date(d.getTime() + o * 60000);
}

type ObjProper = {
  allDay: boolean;
  recur?: boolean;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};
function render(o: ObjProper): string {
  let utc = new Date(Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute));
  const res = o.recur === true ? "⟳ " : "";

  if (o.allDay) {
    utc = localizeAllDayDate(utc);

    if (utc.getFullYear() !== thisYear) {
      return (
        res +
        utc.toLocaleDateString(undefined, {
          year: "numeric",
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    } else {
      return (
        res +
        utc.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }
  } else {
    if (utc.getFullYear() !== thisYear) {
      return (
        res +
        utc.toLocaleString(undefined, {
          year: "numeric",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    } else {
      return (
        res +
        utc.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
  }
}

mod.layer("big", (row, run, caret, viewport, include) => {
  row(`.@text beginswith "@" and @type = task`, (context, row) => {
    row.text.color = !context.isDarkMode
      ? Color.oklch(0.479, 0.1055, 327.07 / 360)
      : Color.oklch(0.958, 0.0373, 325.86 / 360);
    row.text.strikethrough.thick = false;
  });
});

mod.layer("base", (row, run, caret, viewport, include) => {
  for (let year = thisYear - 5; year <= thisYear + 5; year++) {
    row(`.@scheduledStart beginswith "${year}-"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        mark.contents.gravity = s({ year });
      });
    });
  }

  for (let month = 1; month <= 12; month++) {
    const monthTxt = month.toString().padStart(2, "0");
    row(`.@scheduledStart contains "-${monthTxt}-"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        const o = uns(mark.contents.gravity);
        o.month = month;
        mark.contents.gravity = s(o);
      });
    });
  }

  for (let day = 1; day <= 31; day++) {
    const dayTxt = day.toString().padStart(2, "0");
    row(`.@scheduledStart contains "-${dayTxt}T"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        const o = uns(mark.contents.gravity);
        o.day = day;
        mark.contents.gravity = s(o);
      });
    });
  }

  for (let hour = 0; hour <= 23; hour++) {
    let modHr = hour - Math.floor(offset / 60);

    const hourTxt = hour.toString().padStart(2, "0");
    row(`.@scheduledStart contains "T${hourTxt}:"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        const o = uns(mark.contents.gravity);
        o.hour = hour;
        mark.contents.gravity = s(o);
      });
    });
  }

  for (let minute = 0; minute <= 59; minute++) {
    const minuteTxt = minute.toString().padStart(2, "0");
    const modMin = (minute + (offset % 60)) % 60;

    row(`.@scheduledStart contains ":${minuteTxt}:"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        const o = uns(mark.contents.gravity);
        o.minute = minute;
        mark.contents.gravity = s(o);
      });
    });
  }

  row(`.@scheduledRecur`, (context, row) => {
    row.decoration("todo-chip", (mark, layout) => {
      const o = uns(mark.contents.gravity);
      o.recur = true;
      mark.contents.gravity = s(o);
    });
  });

  const allDayPoss = [0, 1];
  for (const poss of allDayPoss) {
    row(`.@scheduledAllDay = ${poss}`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        const o = uns(mark.contents.gravity);
        o.allDay = !!poss;
        const oo = o as ObjProper;

        const i = Image.fromText(new Text(render(oo)));
        row.text.margin.right = i.resolve(context).width;
        mark.contents.gravity = "right";
        mark.contents.image = i;
        mark.y = layout.firstLine.centerY;
      });
    });
  }
});
