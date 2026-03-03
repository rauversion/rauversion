import React from "react";
import Typography from "./Typography";
import TypographyField from "./TypographyField";
import SimpleEditor from "@/components/ui/SimpleEditor";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";


// Custom field for editing text content using SimpleEditor
function TextContentField({ value = "", onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1">Text</label>
      <SimpleEditor
        value={value}
        onChange={onChange}
      />
    </div>
  );
}


const Text = ({ text, typography = {}, padding = {}, margin = {} }) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });

  // Render the text as a div, styled with Typography (but allow multi-line)
  return (
    <div className={spacingClasses}>
      <Typography
        {...typography}
        text={text}
      />
    </div>
  );
};

export const config = {
  fields: {
    padding: createPaddingField(),
    margin: createMarginField(),
    text: {
      type: "custom",
      label: "Text",
      render: TextContentField,
      defaultValue: "Text",
    },
    typography: {
      type: "custom",
      label: "Typography",
      render: TypographyField,
      defaultValue: {
        size: { mobile: "text-base", tablet: "", desktop: "" },
        weight: { mobile: "font-normal", tablet: "", desktop: "" },
        letterSpacing: { mobile: "tracking-normal", tablet: "", desktop: "" },
        alignment: { mobile: "text-left", tablet: "", desktop: "" },
        color: "#000000",
        fontFamily: { mobile: "font-sans", tablet: "", desktop: "" },
        fontStretch: { mobile: "normal", tablet: "", desktop: "" },
      },
    },
  },
  defaultProps: {
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    text: "Text",
    typography: {
      size: { mobile: "text-base", tablet: "", desktop: "" },
      weight: { mobile: "font-normal", tablet: "", desktop: "" },
      letterSpacing: { mobile: "tracking-normal", tablet: "", desktop: "" },
      alignment: { mobile: "text-left", tablet: "", desktop: "" },
      color: "#000000",
      fontFamily: { mobile: "font-sans", tablet: "", desktop: "" },
      fontStretch: { mobile: "normal", tablet: "", desktop: "" },
    },
  },
};

export default Text;
