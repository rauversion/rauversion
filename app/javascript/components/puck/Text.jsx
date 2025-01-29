import React from 'react';
import ColorPicker from './ColorPicker';

const Text = ({ content, size, weight, letterSpacing, alignment, color, variant, backgroundColor, padding }) => {
  const baseClasses = `${size} ${weight} ${letterSpacing} ${alignment} ${padding}`;
  
  if (variant === 'blockquote') {
    return (
      <blockquote 
        className={`${baseClasses} border-l-4 border-gray-300 italic`}
        style={{ color, backgroundColor }}
      >
        {content}
      </blockquote>
    );
  }

  return (
    <p 
      className={baseClasses}
      style={{ color, backgroundColor }}
    >
      {content}
    </p>
  );
};

export const config = {
  fields: {
    content: {
      type: "textarea",
      label: "Content",
      defaultValue: "Enter your text here",
    },
    variant: {
      type: "select",
      label: "Style Variant",
      options: [
        { label: "Regular Text", value: "text" },
        { label: "Blockquote", value: "blockquote" },
      ],
      defaultValue: "text",
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "XS", value: "text-xs" },
        { label: "Small", value: "text-sm" },
        { label: "Base", value: "text-base" },
        { label: "Large", value: "md:text-lg text-base" },
        { label: "XL", value: "md:text-xl text-large" },
        { label: "2XL", value: "md:text-2xl text-base" },
      ],
      defaultValue: "text-base",
    },
    weight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Light", value: "font-light" },
        { label: "Normal", value: "font-normal" },
        { label: "Medium", value: "font-medium" },
        { label: "Semi Bold", value: "font-semibold" },
        { label: "Bold", value: "font-bold" },
      ],
      defaultValue: "font-normal",
    },
    letterSpacing: {
      type: "select",
      label: "Letter Spacing",
      options: [
        { label: "Tight", value: "tracking-tight" },
        { label: "Normal", value: "tracking-normal" },
        { label: "Wide", value: "tracking-wide" },
      ],
      defaultValue: "tracking-normal",
    },
    alignment: {
      type: "select",
      label: "Alignment",
      options: [
        { label: "Left", value: "text-left" },
        { label: "Center", value: "text-center" },
        { label: "Right", value: "text-right" },
        { label: "Justify", value: "text-justify" },
      ],
      defaultValue: "text-left",
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "p-0" },
        { label: "Small", value: "p-2" },
        { label: "Medium", value: "p-4" },
        { label: "Large", value: "p-6" },
        { label: "XL", value: "p-8" },
      ],
      defaultValue: "p-4",
    },
    color: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: ColorPicker,
    },
  },
  defaultProps: {
    content: "Enter your text here",
    variant: "text",
    size: "text-base",
    weight: "font-normal",
    letterSpacing: "tracking-normal",
    alignment: "text-left",
    padding: "p-4",
    color: "#000000",
    backgroundColor: "transparent",
  }
};

export default Text;
