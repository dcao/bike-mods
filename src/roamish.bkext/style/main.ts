import { Color, defineEditorStyleModifier, Insets } from "bike/style";

let style = defineEditorStyleModifier("roamish", "roamish");

style.layer("roamish-unlinked", (row, run, caret, viewport, include) => {
  run(`.@roam-link`, (context, run) => {
    run.color = context.theme.runs.link.color ?? Color.systemBlue();
    run.underline.single = true;
    run.underline.patternDot = true;
  });
});
