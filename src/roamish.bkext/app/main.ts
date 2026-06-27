import {
  AppExtensionContext,
  AttributedString,
  CommandContext,
  Row,
  RowRun,
  Window,
} from "bike/app";

export async function activate(context: AppExtensionContext) {
  console.log("roamish activated");

  bike.commands.addCommands({
    commands: {
      "roamish:insert-roam-link": makeRoamLink,
      "roamish:process-roam-links": processRoamLinks,
    },
  });

  bike.observeWindows(async (window: Window) => {
    window.observeCurrentOutlineEditor((editor) => {
      if (!editor) return;
      editor.observeSelection((_sel) => {
        bike.commands.performCommand("roamish:process-roam-links");
      }, 10000);
    });
  });
}

async function makeRoamLink(context: CommandContext): Promise<boolean> {
  const sel = context.selection;
  const ed = context.editor;
  if (sel === undefined || ed === undefined) return true;

  switch (sel.type) {
    case "caret":
      return await insertMaybeRoamLink(context);

    case "text":
      ed.transaction({ label: "make roam link" }, () => {
        sel.row.text.addAttribute(
          "roam-link",
          sel.detail.text.string,
          sel.detail.range,
        );
        sel.row.text.removeAttribute("a", sel.detail.range);
      });
      return true;

    case "block":
      ed.transaction({ label: "make roam link" }, () => {
        for (const row of sel.rows) {
          row.text.addAttribute("roam-link", row.text.string);
          row.text.removeAttribute("a");
        }
      });
      return true;
  }
}

async function insertMaybeRoamLink(context: CommandContext): Promise<boolean> {
  const ed = context.editor;
  const sel = context.selection;
  if (ed === undefined || sel === undefined || sel.type !== "caret")
    return true;

  const q1 = ed.outline.query(
    `//heading union //@text beginswith "@" and @type = task`,
  );
  const r1 = (q1.value as Row[]).map((r) => ({
    name: r.text.string,
    container: r.ancestors.map((a) => a.text.string).join("/"),
    symbol: "line",
    row: r,
  }));

  const q2 = ed.outline.query(`//*/run::@roam-link/..`);
  const r2 = (q2.value as Row[]).map((r) => ({
    name: r.text.string,
    container: r.ancestors.map((a) => a.text.string).join("/"),
    symbol: "plus.circle",
    row: r,
  }));

  const rrs = [...r2, ...r1];

  const c = await bike.showChoiceBox({
    placeholder: "Insert link to row or previous roam link...",
    items: () =>
      rrs.map((r) => ({
        name: r.name,
        container: r.container,
        symbol: r.symbol,
      })),
  });

  // TODO: if we can ever get user's text from showChoiceBox, insert that as a new roam link.
  if (c === null) return true;
  ed.transaction({ label: "make roam link" }, () => {
    sel.row.text.insert(sel.detail.char, c.items[0].name);
    if (c.items[0].symbol === "plus.circle") {
      sel.row.text.addAttribute("roam-link", c.items[0].name, [
        sel.detail.char,
        sel.detail.char + c.items[0].name.length,
      ]);
    } else {
      // Insert a regular degular link!
      const r = rrs[c.indices[0]].row;
      sel.row.text.addAttribute(
        "a",
        `bike://${ed.outline.root.ensuredPersistentId}/${r.ensuredPersistentId}`,
        [sel.detail.char, sel.detail.char + c.items[0].name.length],
      );
    }
  });

  return true;
}

function processRoamLinks(context: CommandContext): boolean {
  const ed = context.editor;
  if (ed === undefined) return true;

  ed.transaction({ label: "process roam links" }, () => {
    ed.outline.scheduleQuery(`//*/run::@roam-link`, (value) => {
      const runs = value.value as RowRun[];
      const roamlinks = new Set(
        runs.map((r) => ({
          row: r.row,
          start: r.runStart,
          text: r.runString,
          l: r.runAttributes["roam-link"],
        })),
      );

      for (const link of roamlinks) {
        ed.outline.scheduleQuery(`//@text = "${link.l}"`, (rrs) => {
          const matched = rrs.value as Row[];
          if (matched.length > 0) {
            link.row.text.addAttribute(
              "a",
              `bike://${ed.outline.root.ensuredPersistentId}/${matched[0].ensuredPersistentId}`,
              [link.start, link.start + link.text.length],
            );
            link.row.text.removeAttribute("roam-link", [
              link.start,
              link.start + link.text.length,
            ]);
          }
        });
      }
    });
  });

  return true;
}
