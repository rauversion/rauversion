import React from "react";
import Typography from "./Typography";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";
import {
  createTypographyDefaults,
  createTypographyField,
  mergeTypographyProps,
} from "./TypographyProps";

const getDefaultTitleTypography = () =>
  createTypographyDefaults({
    text: "Title",
    size: { mobile: "text-4xl", tablet: "", desktop: "" },
    weight: { mobile: "font-bold", tablet: "", desktop: "" },
  });

const Title = ({ typography = {}, padding = {}, margin = {} }) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });
  const resolvedTypography = mergeTypographyProps(getDefaultTitleTypography(), typography);

  return (
    <div className={spacingClasses}>
      <Typography {...resolvedTypography} />
    </div>
  );
};

export const config = {
  fields: {
    padding: createPaddingField(),
    margin: createMarginField(),
    typography: createTypographyField({ defaultValue: getDefaultTitleTypography() }),
  },
  defaultProps: {
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    typography: getDefaultTitleTypography(),
  },
};

export default Title;
