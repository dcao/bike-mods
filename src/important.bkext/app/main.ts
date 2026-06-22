import { AppExtensionContext, CommandContext } from "bike/app";

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      "important:toggle": toggleImportant,
    },
  });
}

function toggleImportant(context: CommandContext): boolean {
  const s = context.selection;
  const e = context.editor;
  if (s === undefined || e === undefined) return true;

  for (const r of s.rows) {
    if (!e.isFocused(r)) continue;

    const i = r.getAttribute("important");
    if (i === undefined) {
      r.setAttribute("important", "true");
    } else {
      r.removeAttribute("important");
    }
  }

  return true;
}
