import { Color, defineEditorStyleModifier } from "bike/style";

const mod = defineEditorStyleModifier("important", "Important Styles");

mod.layer("important-base", (row, run, caret, viewport, include) => {
  row(`.@important`, (context, row) => {
    if (!context.isDarkMode) {
      row.text.color = Color.oklch(0.479, 0.1055, 327.07 / 360);
    } else {
      row.text.color = Color.oklch(0.958, 0.0373, 325.86 / 360);
    }
  });
});
