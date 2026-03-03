import React from "react";
import TypographyField from "./TypographyField";
import { normalizeVariantValue } from "./ClassField";

const RESPONSIVE_KEYS = ["size", "weight", "letterSpacing", "alignment", "fontFamily", "fontStretch"];

const BASE_TYPOGRAPHY = {
  text: "",
  size: { mobile: "text-base", tablet: "", desktop: "" },
  weight: { mobile: "font-normal", tablet: "", desktop: "" },
  letterSpacing: { mobile: "tracking-normal", tablet: "", desktop: "" },
  alignment: { mobile: "text-left", tablet: "", desktop: "" },
  color: "#000000",
  fontFamily: { mobile: "font-sans", tablet: "", desktop: "" },
  fontStretch: { mobile: "normal", tablet: "", desktop: "" },
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const stringOrFallback = (value, fallback = "") => (typeof value === "string" ? value : fallback);

const mergeResponsiveValues = (baseValue, overrideValue) => {
  const base = normalizeVariantValue(baseValue);

  if (overrideValue === undefined || overrideValue === null) return base;
  if (typeof overrideValue === "string") return normalizeVariantValue(overrideValue);
  if (typeof overrideValue !== "object") return base;

  return {
    mobile: hasOwn(overrideValue, "mobile")
      ? stringOrFallback(overrideValue.mobile, "")
      : base.mobile,
    tablet: hasOwn(overrideValue, "tablet")
      ? stringOrFallback(overrideValue.tablet, "")
      : base.tablet,
    desktop: hasOwn(overrideValue, "desktop")
      ? stringOrFallback(overrideValue.desktop, "")
      : base.desktop,
  };
};

const buildTypography = (base = {}, overrides = {}) => {
  const result = {
    text: stringOrFallback(overrides.text, stringOrFallback(base.text, "")),
    color: stringOrFallback(overrides.color, stringOrFallback(base.color, "")),
  };

  RESPONSIVE_KEYS.forEach((key) => {
    result[key] = mergeResponsiveValues(base[key], overrides[key]);
  });

  return result;
};

export const createTypographyDefaults = (overrides = {}) => buildTypography(BASE_TYPOGRAPHY, overrides);

export const mergeTypographyProps = (base = {}, overrides = {}) =>
  buildTypography(createTypographyDefaults(base), overrides || {});

export const createTypographyField = ({
  label = "Typography",
  defaultValue = {},
  includeText = true,
  textLabel = "Text",
  textPlaceholder = "Enter text",
} = {}) => ({
  type: "custom",
  label,
  render: (props) =>
    React.createElement(TypographyField, {
      ...props,
      showText: includeText,
      textLabel,
      textPlaceholder,
    }),
  defaultValue: createTypographyDefaults(defaultValue),
});
