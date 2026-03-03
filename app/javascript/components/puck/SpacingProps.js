import ClassField, { mergeVariantClasses, normalizeVariantValue } from "./ClassField";

const BASE_SPACING_SCALE = ["0", "1", "2", "3", "4", "6", "8", "10", "12", "16", "20", "24", "32"];

const spacingOptions = (prefix, { includeAuto = false, extraOptions = [] } = {}) => {
  const options = BASE_SPACING_SCALE.map((value) => ({
    label: `${prefix}-${value}`,
    value: `${prefix}-${value}`,
  }));

  if (includeAuto) {
    options.push({
      label: `${prefix}-auto`,
      value: `${prefix}-auto`,
    });
  }

  return [...options, ...extraOptions];
};

const responsiveField = ({ label, defaultMobile = "", options = [] }) => ({
  type: "custom",
  label,
  render: (props) =>
    ClassField({
      ...props,
      value: normalizeVariantValue(props.value),
      type: "select",
      label,
      options,
    }),
  defaultValue: normalizeVariantValue(defaultMobile),
});

export const createPaddingField = ({
  label = "Padding",
  defaultMobile = "",
  extraOptions = [],
} = {}) =>
  responsiveField({
    label,
    defaultMobile,
    options: spacingOptions("p", { extraOptions }),
  });

export const createMarginField = ({
  label = "Margin",
  defaultMobile = "",
  extraOptions = [],
} = {}) =>
  responsiveField({
    label,
    defaultMobile,
    options: spacingOptions("m", { includeAuto: true, extraOptions }),
  });

export const composeSpacingClasses = ({ padding, margin }) =>
  [mergeVariantClasses(padding, (value) => value), mergeVariantClasses(margin, (value) => value)]
    .filter(Boolean)
    .join(" ");
