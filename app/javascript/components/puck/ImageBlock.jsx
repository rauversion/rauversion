import React from 'react';
import ImageUploadField from './ImageUploadField';
import { composeSpacingClasses, createMarginField, createPaddingField } from './SpacingProps';

const MAX_WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  none: "max-w-none",
};

const ROUNDED_CLASSES = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const SHADOW_CLASSES = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
};

const ImageBlock = ({ 
  image, 
  href,
  alt,
  aspectRatio = "4/3",
  maxWidth = "2xl",
  rounded = "lg",
  shadow = "lg",
  padding = {},
  margin = {},
}) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });
  const containerStyle = {
    position: 'relative',
    aspectRatio: aspectRatio
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    display: 'block',
    color: 'transparent',
    objectFit: 'cover'
  };

  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES["2xl"];
  const roundedClass = ROUNDED_CLASSES[rounded] || ROUNDED_CLASSES.lg;
  const shadowClass = SHADOW_CLASSES[shadow] || SHADOW_CLASSES.lg;
  const wrapperClassName = `${spacingClasses} w-full`.trim();

  const ImageComponent = (
    <div className={`relative w-full ${maxWidthClass} mx-auto overflow-hidden ${roundedClass} ${shadowClass}`} style={containerStyle}>
      <img
        src={image}
        alt={alt || ''}
        style={imageStyle}
      />
    </div>
  );

  if (href) {
    return (
      <div className={wrapperClassName}>
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        {ImageComponent}
      </a>
      </div>
    );
  }

  return <div className={wrapperClassName}>{ImageComponent}</div>;
};

export const config = {
  fields: {
    image: {
      type: "custom",
      label: "Image",
      render: ImageUploadField,
    },
    alt: {
      type: "text",
      label: "Alt Text",
      defaultValue: "",
    },
    href: {
      type: "text",
      label: "Link URL (optional)",
      defaultValue: "",
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      options: [
        { label: "4:3", value: "4/3" },
        { label: "16:9", value: "16/9" },
        { label: "1:1", value: "1/1" },
        { label: "3:4", value: "3/4" },
        { label: "2:3", value: "2/3" }
      ],
      defaultValue: "4/3",
    },
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "None", value: "none" },
      ],
      defaultValue: "2xl",
    },
    rounded: {
      type: "select",
      label: "Rounded",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
      defaultValue: "lg",
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
      defaultValue: "lg",
    },
    padding: createPaddingField(),
    margin: createMarginField(),
  },
  defaultProps: {
    image: "",
    alt: "",
    href: "",
    aspectRatio: "4/3",
    maxWidth: "2xl",
    rounded: "lg",
    shadow: "lg",
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
  }
};

export default ImageBlock;
