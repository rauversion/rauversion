import React from 'react';

const MultiList = ({ columns, gridCols, textColor, textSize }) => {
  return (
    <div className={`grid ${gridCols} gap-4 ${textColor} ${textSize}`}>
      {columns.map((column, index) => (
        <div key={index}>
          <h3 className="font-bold mb-2">{column.title}</h3>
          <ul className="space-y-1">
            {column.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export const config = {
  fields: {
    columns: {
      type: "array",
      label: "List Columns",
      arrayFields: {
        title: {
          type: "text",
          label: "Column Title",
        },
        items: {
          type: "array",
          label: "List Items",
          arrayFields: {
            text: {
              type: "text",
              label: "Item Text"
            }
          }
        }
      }
    },
    gridCols: {
      type: "select",
      label: "Number of Columns",
      options: [
        { label: "2 Columns", value: "grid-cols-2" },
        { label: "3 Columns", value: "grid-cols-3" },
        { label: "4 Columns", value: "grid-cols-4" },
      ],
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    textSize: {
      type: "select",
      label: "Text Size",
      options: [
        { label: "Extra Small", value: "text-xs" },
        { label: "Small", value: "text-sm" },
        { label: "Base", value: "text-base" },
        { label: "Large", value: "text-lg" },
      ],
    }
  },
  defaultProps: {
    columns: [
      {
        title: "RECENT SHOWS",
        items: [
          { text: "2025 | Aniversario 30 años Perrera Arte" },
          { text: "2024 | Creamfields, Chile" },
          { text: "2024 | M100: Festival Le Rock" },
          { text: "2023 | Creamfields, Chile" },
          { text: "2023 | Micro Mutek, Chile" }
        ]
      },
      {
        title: "CONTACT",
        items: [
          { text: "contacto@reneroco.info" },
          { text: "contacto@tensarecords.com" },
          { text: "reneroco.info" },
          { text: "@renerocovmv" },
          { text: "tensarecords.com" }
        ]
      }
    ],
    gridCols: "grid-cols-2",
    textColor: "text-default0",
    textSize: "text-xs"
  }
};

export default MultiList;
