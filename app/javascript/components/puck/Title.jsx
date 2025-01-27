import React from 'react';

const Title = ({ text, size, alignment }) => {
  return (
    <h1 className={`${size} ${alignment}`}>{text}</h1>
  );
};

export const config = {
  fields: {
    text: {
      type: "text",
      label: "Title Text",
    },
    size: {
      type: "select",
      label: "Text Size",
      options: [
        { label: "Small", value: "text-2xl" },
        { label: "Medium", value: "text-4xl" },
        { label: "Large", value: "text-6xl" },
      ],
      defaultValue: "text-4xl",
    },
    alignment: {
      type: "select",
      label: "Text Alignment",
      options: [
        { label: "Left", value: "text-left" },
        { label: "Center", value: "text-center" },
        { label: "Right", value: "text-right" },
      ],
      defaultValue: "text-left",
    },
  }
};

export default Title;
