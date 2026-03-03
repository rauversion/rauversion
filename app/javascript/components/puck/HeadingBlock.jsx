import React from 'react';
import { composeSpacingClasses, createMarginField, createPaddingField } from './SpacingProps';

const HeadingBlock = ({ children, padding = {}, margin = {} }) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });
  return <h2 className={`text-2xl font-bold mb-4 ${spacingClasses}`}>{children}</h2>;
};

export const config = {
  fields: {
    padding: createPaddingField(),
    margin: createMarginField(),
    children: {
      type: "text",
      label: "Heading Text",
    },
  },
  defaultProps: {
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    children: "Heading",
  },
};

export default HeadingBlock;
