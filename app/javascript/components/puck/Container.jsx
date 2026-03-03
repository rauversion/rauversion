import React from 'react';
import ColorPicker from './ColorPicker';
import ImageUploadField from './ImageUploadField';
import { composeSpacingClasses, createMarginField, createPaddingField } from './SpacingProps';

const Container = ({ 
  className, 
  margin = {},
  padding = {},
  backgroundColor,
  backgroundImage,
  backgroundPosition,
  backgroundSize,
  backgroundRepeat,
  content,
  children 
}) => {
  const ContentSlot = content;
  const style = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundPosition: backgroundPosition || 'center',
    backgroundSize: backgroundSize || 'cover',
    backgroundRepeat: backgroundRepeat || 'no-repeat'
  };
  const spacingClasses = composeSpacingClasses({ margin, padding });
  const mergedClassName = [
    className || 'max-w-3xl mx-auto space-y-6',
    spacingClasses,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div 
      className={mergedClassName}
      style={style}
    >
      {ContentSlot ? ContentSlot() : children}
    </div>
  );
};

export const config = {
  fields: {
    content: {
      type: "slot",
      label: "Content",
    },
    className: {
      type: "text",
      label: "Container Classes",
      description: "Override default container classes",
      defaultValue: "max-w-3xl mx-auto space-y-6",
    },
    padding: createPaddingField({
      defaultMobile: "p-8",
    }),
    margin: createMarginField(),
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: ColorPicker,
    },
    backgroundImage: {
      type: "custom",
      label: "Background Image",
      render: ImageUploadField,
    },
    backgroundPosition: {
      type: "select",
      label: "Background Position",
      options: [
        { label: "Center", value: "center" },
        { label: "Top", value: "top" },
        { label: "Right", value: "right" },
        { label: "Bottom", value: "bottom" },
        { label: "Left", value: "left" },
      ],
      defaultValue: "center",
    },
    backgroundSize: {
      type: "select",
      label: "Background Size",
      options: [
        { label: "Cover", value: "cover" },
        { label: "Contain", value: "contain" },
        { label: "Auto", value: "auto" },
        { label: "100%", value: "100%" },
      ],
      defaultValue: "cover",
    },
    backgroundRepeat: {
      type: "select",
      label: "Background Repeat",
      options: [
        { label: "No Repeat", value: "no-repeat" },
        { label: "Repeat", value: "repeat" },
        { label: "Repeat X", value: "repeat-x" },
        { label: "Repeat Y", value: "repeat-y" },
      ],
      defaultValue: "no-repeat",
    },
  },
  defaultProps: {
    className: "max-w-3xl mx-auto space-y-6",
    padding: { mobile: "p-8", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
    backgroundColor: "#FFFFFF",
    backgroundImage: "",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },
};

export default Container;
