import React from 'react';
import ColorPicker from './ColorPicker';

const Title = ({ title, size, weight, letterSpacing, alignment, color }) => {
  return (
    <div className={`${size} ${weight} ${letterSpacing} ${alignment}`} style={{ color }}>
      {title}
    </div>
  );
};

export const config = {
  fields: {
    title: {
      type: "text",
      label: "Title",
      defaultValue: "Title",
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "XS", value: "text-xs" },
        { label: "Small", value: "text-sm" },
        { label: "Base", value: "text-base" },
        { label: "Large", value: "text-lg" },
        { label: "XL", value: "text-xl" },
        { label: "2XL", value: "text-2xl" },
        { label: "3XL", value: "md:text-3xl text-xl" },
        { label: "4XL", value: "md:text-4xl text-xl" },
        { label: "5XL", value: "md:text-5xl text-2xl" },
        { label: "6XL", value: "md:text-6xl text-2xl" },
        { label: "7XL", value: "md:text-7xl text-3xl" },
        { label: "8XL", value: "md:text-8xl text-4xl" },
        { label: "9XL", value: "md:text-9xl text-5xl" },
      ],
      defaultValue: "text-4xl",
    },
    weight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Thin", value: "font-thin" },
        { label: "Extra Light", value: "font-extralight" },
        { label: "Light", value: "font-light" },
        { label: "Normal", value: "font-normal" },
        { label: "Medium", value: "font-medium" },
        { label: "Semi Bold", value: "font-semibold" },
        { label: "Bold", value: "font-bold" },
        { label: "Extra Bold", value: "font-extrabold" },
        { label: "Black", value: "font-black" },
      ],
      defaultValue: "font-bold",
    },
    letterSpacing: {
      type: "select",
      label: "Letter Spacing",
      options: [
        { label: "Tighter", value: "tracking-tighter" },
        { label: "Tight", value: "tracking-tight" },
        { label: "Normal", value: "tracking-normal" },
        { label: "Wide", value: "tracking-wide" },
        { label: "Wider", value: "tracking-wider" },
        { label: "Widest", value: "tracking-widest" },
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
      ],
      defaultValue: "text-left",
    },
    color: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
  },
  defaultProps: {
    title: "Title",
    size: "text-4xl",
    weight: "font-bold",
    letterSpacing: "tracking-normal",
    alignment: "text-left",
    color: "#000000",
  }
};

export default Title;
