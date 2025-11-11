import React from 'react';

const Subtitle = ({ text, color }) => {
  return (
    <h2 className={`text-xl ${color}`}>{text}</h2>
  );
};

export const config = {
  fields: {
    text: {
      type: "text",
      label: "Subtitle Text",
    },
    color: {
      type: "text",
      label: "Text Color",
    },
  },
  defaultProps: {
    text: "Subtitle",
    color: "text-muted-foreground"
  }
};

export default Subtitle;
