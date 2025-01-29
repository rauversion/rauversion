import React from 'react';
import ColorPicker from './ColorPicker';
import ImageUploadField from './ImageUploadField';

const CardBlock = ({ 
  image, 
  title, 
  subtitle, 
  text, 
  borderRadius, 
  shadow,
  backgroundColor,
  titleColor,
  subtitleColor,
  textColor,
  padding,
  imageHeight,
  titleSize,
  subtitleSize,
  textSize
}) => {
  return (
    <div 
      className={`overflow-hidden ${borderRadius} ${shadow} ${padding}`}
      style={{ backgroundColor }}
    >
      {image && (
        <div className={`w-full ${imageHeight} relative`}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="space-y-4">
        {title && (
          <h3 className={titleSize} style={{ color: titleColor }}>
            {title}
          </h3>
        )}
        
        {subtitle && (
          <h4 className={subtitleSize} style={{ color: subtitleColor }}>
            {subtitle}
          </h4>
        )}
        
        {text && (
          <p className={textSize} style={{ color: textColor }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export const config = {
  fields: {
    image: {
      type: "custom",
      label: "Image",
      render: ImageUploadField,
    },
    imageHeight: {
      type: "select",
      label: "Image Height",
      options: [
        { label: "Small", value: "h-48" },
        { label: "Medium", value: "h-64" },
        { label: "Large", value: "h-80" },
        { label: "Extra Large", value: "h-96" },
      ],
      defaultValue: "h-64",
    },
    title: {
      type: "text",
      label: "Title",
    },
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "Small", value: "text-lg font-semibold" },
        { label: "Medium", value: "text-xl font-semibold" },
        { label: "Large", value: "text-2xl font-bold" },
        { label: "Extra Large", value: "text-3xl font-bold" },
      ],
      defaultValue: "text-xl font-semibold",
    },
    titleColor: {
      type: "custom",
      label: "Title Color",
      render: ColorPicker,
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
    },
    subtitleSize: {
      type: "select",
      label: "Subtitle Size",
      options: [
        { label: "Small", value: "text-sm font-medium" },
        { label: "Medium", value: "text-base font-medium" },
        { label: "Large", value: "text-lg font-medium" },
      ],
      defaultValue: "text-base font-medium",
    },
    subtitleColor: {
      type: "custom",
      label: "Subtitle Color",
      render: ColorPicker,
    },
    text: {
      type: "textarea",
      label: "Text Content",
    },
    textSize: {
      type: "select",
      label: "Text Size",
      options: [
        { label: "Small", value: "text-sm" },
        { label: "Medium", value: "text-base" },
        { label: "Large", value: "text-lg" },
      ],
      defaultValue: "text-base",
    },
    textColor: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "rounded-none" },
        { label: "Small", value: "rounded-sm" },
        { label: "Medium", value: "rounded-md" },
        { label: "Large", value: "rounded-lg" },
        { label: "Extra Large", value: "rounded-xl" },
        { label: "Full", value: "rounded-full" },
      ],
      defaultValue: "rounded-lg",
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "shadow-none" },
        { label: "Small", value: "shadow-sm" },
        { label: "Medium", value: "shadow-md" },
        { label: "Large", value: "shadow-lg" },
        { label: "Extra Large", value: "shadow-xl" },
        { label: "2XL", value: "shadow-2xl" },
      ],
      defaultValue: "shadow-md",
    },
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: ColorPicker,
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "Small", value: "p-4" },
        { label: "Medium", value: "p-6" },
        { label: "Large", value: "p-8" },
        { label: "Extra Large", value: "p-10" },
      ],
      defaultValue: "p-6",
    },
  },
  defaultProps: {
    image: "",
    imageHeight: "h-64",
    title: "Card Title",
    titleSize: "text-xl font-semibold",
    titleColor: "#111827",
    subtitle: "Card Subtitle",
    subtitleSize: "text-base font-medium",
    subtitleColor: "#4B5563",
    text: "Card content goes here. You can add any description or details you want to display.",
    textSize: "text-base",
    textColor: "#6B7280",
    borderRadius: "rounded-lg",
    shadow: "shadow-md",
    backgroundColor: "#FFFFFF",
    padding: "p-6",
  }
};

export default CardBlock;
