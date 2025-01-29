import React from 'react';
import { DropZone } from "@measured/puck";

const Grid = ({ columns = [], gap = 'gap-4', classes = '', gridColumns }) => {
  return (
    <div className={`grid ${gap} ${gridColumns} ${classes}`}>
      {columns.map((column, index) => (
        <div
          key={index}
          className={`${column.colSpan}`}
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
      label: "Grid Items",
      arrayFields: {
        colSpan: {
          type: "select",
          label: "Column Span",
          options: [
            { label: "1 Column", value: "md:col-span-1" },
            { label: "2 Columns", value: "md:col-span-2" },
            { label: "3 Columns", value: "md:col-span-3" },
            { label: "4 Columns", value: "md:col-span-4" },
            { label: "5 Columns", value: "md:col-span-5" },
            { label: "6 Columns", value: "md:col-span-6" },
            { label: "7 Columns", value: "md:col-span-7" },
            { label: "8 Columns", value: "md:col-span-8" },
            { label: "9 Columns", value: "md:col-span-9" },
            { label: "10 Columns", value: "md:col-span-10" },
            { label: "11 Columns", value: "md:col-span-11" },
            { label: "12 Columns", value: "md:col-span-12" },
          ],
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
    },
    gridColumns: {
      type: "select",
      label: "Grid Columns",
      options: [
        { label: "1", value: "md:grid-cols-1" },
        { label: "2", value: "md:grid-cols-2" },
        { label: "3", value: "md:grid-cols-3" },
        { label: "4", value: "md:grid-cols-4" },
        { label: "5", value: "md:grid-cols-5" },
        { label: "6", value: "md:grid-cols-6" },
        { label: "7", value: "md:grid-cols-7" },
        { label: "8", value: "md:grid-cols-8" },
        { label: "9", value: "md:grid-cols-9" },
        { label: "10", value: "md:grid-cols-10" },
        { label: "11", value: "md:grid-cols-11" },
        { label: "12", value: "md:grid-cols-12" },
      ],
    },
    classes: {
      type: "text",
      label: "Additional Classes",
    }
  },
  defaultProps: {
    columns: [
      { colSpan: "md:col-span-4" },
      { colSpan: "md:col-span-4" },
      { colSpan: "md:col-span-4" },
    ],
    gridColumns: "md:grid-cols-3",
    gap: "gap-4",
    classes: "",
  }
};

export default Grid;
