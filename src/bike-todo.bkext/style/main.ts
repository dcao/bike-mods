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

const months = {
  Jan: 31,
  Feb: 28,
  Mar: 31,
  Apr: 30,
  May: 31,
  Jun: 30,
  Jul: 31,
  Aug: 31,
  Sep: 30,
  Oct: 31,
  Nov: 30,
  Dec: 31,
};

const offset = new Date().getTimezoneOffset();

type Obj = { month?: number; day?: number; hour?: number };

function s(x: Obj): ContentsGravity {
  return JSON.stringify(x) as ContentsGravity;
}

function uns(x: string): Obj {
  return JSON.parse(x);
}

function fmt(o: Obj, min: number) {
  const mon = Object.keys(months)[o.month! - 1];
  const day = o.day!.toString().padStart(2, "0");
  const mod12 = o.hour! % 12;
  const hour = (mod12 === 0 ? 12 : mod12).toString();
  const minute = min.toString().padStart(2, "0");
  const ampm = o.hour! < 12 ? "AM" : "PM";
  return `${mon} ${day} ${hour}:${minute} ${ampm}`;
}

mod.layer("base", (row, run, caret, viewport, include) => {
  for (let month = 1; month <= 12; month++) {
    const monthTxt = month.toString().padStart(2, "0");
    row(`.@scheduledStart contains "-${monthTxt}-"`, (context, row) => {
      row.decoration("todo-chip", (mark, layout) => {
        // @ts-ignore
        mark.contents.gravity = s({ month: month });
        // mark.contents.image = Image.fromSymbol(
        //   new SymbolConfiguration("square")
        //     .withHierarchicalColor(Color.text())
        //     .withFont(Font.systemBody()),
        // );
      });
    });
  }

  for (let day = 1; day <= 31; day++) {
    const dayTxt = day.toString().padStart(2, "0");
    row(
      `.@scheduledStart contains "-${dayTxt}T" and @scheduledAllDay = 1`,
      (context, row) => {
        row.decoration("todo-chip", (mark, layout) => {
          const o = uns(mark.contents.gravity);

          mark.contents.image = Image.fromText(
            new Text(Object.keys(months)[o.month! - 1] + " " + day),
          );
          mark.contents.gravity = "right";
        });
      },
    );

    row(
      `.@scheduledStart contains "-${dayTxt}T" and @scheduledAllDay = 0`,
      (context, row) => {
        row.decoration("todo-chip", (mark, layout) => {
          const o = uns(mark.contents.gravity);
          o.day = day;
          mark.contents.gravity = s(o);
        });
      },
    );
  }

  for (let hour = 0; hour <= 23; hour++) {
    let modHr = hour - Math.floor(offset / 60);

    const hourTxt = hour.toString().padStart(2, "0");
    row(
      `.@scheduledStart contains "T${hourTxt}:" and @scheduledAllDay = 0`,
      (context, row) => {
        row.decoration("todo-chip", (mark, layout) => {
          const o = uns(mark.contents.gravity);

          if (modHr < 0) {
            modHr = ((modHr % 24) + 24) % 24;

            // Shift back the day.
            o.day! -= 1;

            if (o.day === 0) {
              o.month! -= 1;
              if (o.month === 0) {
                o.month = 12;
              }

              o.day = Object.values(months)[o.month! - 1];
            }
            //
          }

          o.hour = modHr;

          mark.contents.gravity = s(o);
        });
      },
    );
  }

  for (let minute = 0; minute <= 59; minute++) {
    const minuteTxt = minute.toString().padStart(2, "0");
    const modMin = (minute + (offset % 60)) % 60;

    row(
      `.@scheduledStart contains ":${minuteTxt}:" and @scheduledAllDay = 0`,
      (context, row) => {
        row.decoration("todo-chip", (mark, layout) => {
          const o = uns(mark.contents.gravity);
          mark.contents.image = Image.fromText(new Text(fmt(o, modMin)));
          mark.contents.gravity = "right";
        });
      },
    );
  }
});
