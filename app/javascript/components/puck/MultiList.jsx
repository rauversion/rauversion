import React from 'react';

const MultiList = ({ columns, gridCols, textColor, textSize, className }) => {
  return (
    <div className={className}>
      <div className={`grid md:${gridCols} grid-cols-1 gap-4 ${textColor} ${textSize}`}>
        {columns.map((column, index) => (
          <div key={index}>
            <h3 className="font-bold mb-2">{column.title}</h3>
            <ul className="space-y-1">
              {column.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.url ? (
                    <a 
                      href={item.url} 
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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
            },
            url: {
              type: "text",
              label: "Item URL (optional)",
              defaultValue: "",
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
    },
    className: {
      type: "text",
      label: "Wrapper Classes",
      description: "Add custom classes to the wrapper element",
      defaultValue: "",
    }
  },
  defaultProps: {
    columns: [
      {
        title: "RECENT SHOWS",
        items: [
          { text: "2025 | Aniversario 30 años Perrera Arte", url: "https://example.com/show1" },
          { text: "2024 | Creamfields, Chile", url: "https://example.com/show2" },
          { text: "2024 | M100: Festival Le Rock", url: "https://example.com/show3" },
          { text: "2023 | Creamfields, Chile", url: "https://example.com/show4" },
          { text: "2023 | Micro Mutek, Chile", url: "https://example.com/show5" }
        ]
      },
      {
        title: "CONTACT",
        // change the text keys to a sample text
        items: [
          { text: "contacto@example.info", url: "mailto:contacto@reneroco.info" },
          { text: "contacto@example.com", url: "mailto:contacto@tensarecords.com" },
          { text: "example.info", url: "https://reneroco.info" },
          { text: "@example", url: "https://twitter.com/renerocovmv" },
          { text: "example.com", url: "https://tensarecords.com" }
        ]
      }
    ],
    gridCols: "grid-cols-2",
    textColor: "text-default0",
    textSize: "text-xs",
    className: ""
  }
};

export default MultiList;
