import React from "react";

// Helper to merge Tailwind classes for breakpoints
function mergeClasses({ mobile, tablet, desktop }) {
  return [
    mobile,
    tablet ? `md:${tablet}` : "",
    desktop ? `lg:${desktop}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Helper to merge fontStretch for breakpoints
function getFontStretch({ mobile, tablet, desktop }) {
  // Only mobile is supported inline, but we can add md: and lg: via style if needed
  // For now, just use mobile, or fallback to normal
  return mobile || "normal";
}

const Typography = ({
  text = "",
  size = {},
  weight = {},
  letterSpacing = {},
  alignment = {},
  color = "#000000",
  fontFamily = {},
  fontStretch = {},
}) => {
  const className = [
    mergeClasses(size),
    mergeClasses(weight),
    mergeClasses(letterSpacing),
    mergeClasses(alignment),
    mergeClasses(fontFamily),
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    color,
    fontStretch: getFontStretch(fontStretch),
  };

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

export default Typography;
