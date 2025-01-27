import React from 'react';
import { DropZone } from "@measured/puck";

const Grid = ({ columns = [], gap = 'gap-4', className = '' }) => {
  return (
    <div className={`grid ${gap} ${className}`} 
         style={{ 
           gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
         }}>
      {columns.map((column, index) => (
        <div
          key={index}
          className={`${column.colSpan || 'col-span-4'}`}
          style={{
            minHeight: '100px'
          }}
        >
          <DropZone
            zone={`grid-${index}`}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
};

export const config = {
  fields: {
    columns: {
      type: "array",
      label: "Grid Columns",
      arrayFields: {
        colSpan: {
          type: "select",
          label: "Column Span",
          options: [
            { label: "1 Column", value: "col-span-1" },
            { label: "2 Columns", value: "col-span-2" },
            { label: "3 Columns", value: "col-span-3" },
            { label: "4 Columns", value: "col-span-4" },
            { label: "5 Columns", value: "col-span-5" },
            { label: "6 Columns", value: "col-span-6" },
            { label: "7 Columns", value: "col-span-7" },
            { label: "8 Columns", value: "col-span-8" },
            { label: "9 Columns", value: "col-span-9" },
            { label: "10 Columns", value: "col-span-10" },
            { label: "11 Columns", value: "col-span-11" },
            { label: "12 Columns", value: "col-span-12" },
          ],
          defaultValue: "col-span-4",
        },
      },
    },
    gap: {
      type: "select",
      label: "Grid Gap",
      options: [
        { label: "None", value: "gap-0" },
        { label: "Small", value: "gap-2" },
        { label: "Medium", value: "gap-4" },
        { label: "Large", value: "gap-6" },
        { label: "Extra Large", value: "gap-8" },
      ],
      defaultValue: "gap-4",
    },
    className: {
      type: "text",
      label: "Additional Classes",
      defaultValue: "",
    }
  },
  defaultProps: {
    columns: [
      { colSpan: "col-span-4" },
      { colSpan: "col-span-4" },
      { colSpan: "col-span-4" },
    ],
    gap: "gap-4",
    className: "",
  }
};

export default Grid;
