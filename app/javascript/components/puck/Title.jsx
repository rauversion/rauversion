import React from "react";
import Typography from "./Typography";
import TypographyField from "./TypographyField";

const Title = ({ typography }) => {
  return <Typography {...typography} />;
};

export const config = {
  fields: {
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
