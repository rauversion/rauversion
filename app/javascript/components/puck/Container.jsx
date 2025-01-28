import React from 'react';
import { DropZone } from "@measured/puck";
import ColorPicker from './ColorPicker';
import ImageUploadField from './ImageUploadField';

const Container = ({ 
  className, 
  backgroundColor,
  backgroundImage,
  backgroundPosition,
  backgroundSize,
  backgroundRepeat,
  children 
}) => {
  const style = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundPosition: backgroundPosition || 'center',
    backgroundSize: backgroundSize || 'cover',
    backgroundRepeat: backgroundRepeat || 'no-repeat'
  };

  return (
    <div 
      className={`${className || 'max-w-3xl mx-auto p-8 space-y-6'}`}
      style={style}
    >
      <DropZone zone="content" />
    </div>
  );
};

export const config = {
  fields: {
    className: {
      type: "text",
      label: "Container Classes",
      description: "Override default container classes",
      defaultValue: "max-w-3xl mx-auto p-8 space-y-6",
    },
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
    className: "max-w-3xl mx-auto p-8 space-y-6",
    backgroundColor: "#FFFFFF",
    backgroundImage: "",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },
};

export default Container;
