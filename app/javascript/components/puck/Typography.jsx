import React from "react";
import { mergeVariantClasses, normalizeVariantValue } from "./ClassField";

function mergeClasses(field) {
  return mergeVariantClasses(field, (value) => value);
}

function getFontStretch(fontStretch) {
  if (typeof fontStretch === "string") return fontStretch || "normal";

  const normalized = normalizeVariantValue(fontStretch);
  return normalized.mobile || "normal";
}

const Typography = ({
  as: Component = "div",
  text = "",
  size = {},
  weight = {},
  letterSpacing = {},
  alignment = {},
  color = "",
  fontFamily = {},
  fontStretch = {},
  className = "",
  style: customStyle = {},
}) => {
  const typographyClassName = [
    mergeClasses(size),
    mergeClasses(weight),
    mergeClasses(letterSpacing),
    mergeClasses(alignment),
    mergeClasses(fontFamily),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    ...(color ? { color } : {}),
    fontStretch: getFontStretch(fontStretch),
    ...customStyle,
  };

  return (
    <Component className={typographyClassName} style={style} dangerouslySetInnerHTML={{ __html: text || "" }} />
  );
};

export default Typography;
