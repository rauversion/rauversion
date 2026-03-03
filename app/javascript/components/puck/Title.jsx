import React from "react";
import Typography from "./Typography";
import TypographyField from "./TypographyField";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";

const Title = ({ typography, padding = {}, margin = {} }) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });

  return (
    <div className={spacingClasses}>
      <Typography {...typography} />
    </div>
  );
};

export const config = {
  fields: {
    padding: createPaddingField(),
    margin: createMarginField(),
    typography: {
      type: "custom",
      label: "Typography",
      render: TypographyField,
      defaultValue: {
        text: "Title",
        size: { mobile: "text-4xl", tablet: "", desktop: "" },
        weight: { mobile: "font-bold", tablet: "", desktop: "" },
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
    typography: {
      text: "Title",
      size: { mobile: "text-4xl", tablet: "", desktop: "" },
      weight: { mobile: "font-bold", tablet: "", desktop: "" },
      letterSpacing: { mobile: "tracking-normal", tablet: "", desktop: "" },
      alignment: { mobile: "text-left", tablet: "", desktop: "" },
      color: "#000000",
      fontFamily: { mobile: "font-sans", tablet: "", desktop: "" },
      fontStretch: { mobile: "normal", tablet: "", desktop: "" },
    },
  },
};

export default Title;
