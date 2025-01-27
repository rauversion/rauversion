import React from 'react';

const HeadingBlock = ({ children }) => {
  return <h2 className="text-2xl font-bold mb-4">{children}</h2>;
};

export const config = {
  fields: {
    children: {
      type: "text",
      label: "Heading Text",
    },
  }
};

export default HeadingBlock;
