import React from "react";
import Typography from "./Typography";
import SimpleEditor from "@/components/ui/SimpleEditor";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";
import {
  createTypographyDefaults,
  createTypographyField,
  mergeTypographyProps,
} from "./TypographyProps";


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
  const resolvedTypography = mergeTypographyProps(
    createTypographyDefaults(),
    typography
  );

  // Render the text as a div, styled with Typography (but allow multi-line)
  return (
    <div className={spacingClasses}>
      <Typography
        {...resolvedTypography}
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
    typography: createTypographyField({
      includeText: false,
      defaultValue: createTypographyDefaults(),
    }),
  },
  defaultProps: {
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    text: "Text",
    typography: createTypographyDefaults(),
  },
};

export default Text;
