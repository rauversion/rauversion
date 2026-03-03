import React from "react";
import Typography from "./Typography";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";
import {
  createTypographyDefaults,
  createTypographyField,
  mergeTypographyProps,
} from "./TypographyProps";

const getDefaultHeadingTypography = () =>
  createTypographyDefaults({
    text: "Heading",
    size: { mobile: "text-2xl", tablet: "", desktop: "" },
    weight: { mobile: "font-bold", tablet: "", desktop: "" },
  });

const HeadingBlock = ({ children = "", typography = {}, padding = {}, margin = {} }) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });
  const resolvedTypography = mergeTypographyProps(getDefaultHeadingTypography(), typography);
  const headingText = resolvedTypography.text || children || "Heading";

  return (
    <div className={`mb-4 ${spacingClasses}`.trim()}>
      <Typography as="h2" {...resolvedTypography} text={headingText} />
    </div>
  );
};

export const config = {
  fields: {
    padding: createPaddingField(),
    margin: createMarginField(),
    typography: createTypographyField({
      defaultValue: getDefaultHeadingTypography(),
      textLabel: "Heading Text",
    }),
  },
  defaultProps: {
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    typography: getDefaultHeadingTypography(),
    children: "Heading",
  },
};

export default HeadingBlock;
