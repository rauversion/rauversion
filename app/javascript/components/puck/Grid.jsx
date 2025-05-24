import React from "react";
import { DropZone } from "@measured/puck";
import ClassField, { mergeVariantClasses } from "./ClassField";

const Grid = ({
  gap = {},
  gridColumns = {},
  columns = [],
  className = "",
}) => {
  return (
    <div
      className={`grid ${mergeVariantClasses(gap, v => v)} ${mergeVariantClasses(gridColumns, v => v)} ${className}`}
      style={{
        minHeight: "50px",
      }}
    >
      {columns.map((item, idx) => (
        <DropZone
          key={item.id || idx}
          zone={`grid-item-${idx}`}
          className={`w-full h-full ${item.colSpan || ""}`}
          {...item}
        />
      ))}
    </div>
  );
};

export const config = {
  fields: {
    gap: {
      type: "custom",
      label: "Gap",
      render: (props) =>
        ClassField({
          ...props,
          type: "select",
          label: "Gap",
          options: [
            { label: "None", value: "gap-0" },
            { label: "Small", value: "gap-2" },
            { label: "Medium", value: "gap-4" },
            { label: "Large", value: "gap-6" },
            { label: "Extra Large", value: "gap-8" },
          ],
        }),
      defaultValue: { mobile: "gap-4", tablet: "", desktop: "" },
    },
    gridColumns: {
      type: "custom",
      label: "Grid Columns",
      render: (props) =>
        ClassField({
          ...props,
          type: "select",
          label: "Grid Columns",
          options: [
            { label: "1", value: "grid-cols-1" },
            { label: "2", value: "grid-cols-2" },
            { label: "3", value: "grid-cols-3" },
            { label: "4", value: "grid-cols-4" },
            { label: "5", value: "grid-cols-5" },
            { label: "6", value: "grid-cols-6" },
            { label: "7", value: "grid-cols-7" },
            { label: "8", value: "grid-cols-8" },
            { label: "9", value: "grid-cols-9" },
            { label: "10", value: "grid-cols-10" },
            { label: "11", value: "grid-cols-11" },
            { label: "12", value: "grid-cols-12" },
          ],
        }),
      defaultValue: { mobile: "grid-cols-1", tablet: "", desktop: "" },
    },
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
    className: {
      type: "text",
      label: "Additional Classes",
    },
  },
  defaultProps: {
    gap: { mobile: "gap-4", tablet: "", desktop: "" },
    gridColumns: { mobile: "grid-cols-1", tablet: "", desktop: "" },
    columns: [],
    className: "",
  },
};

export default Grid;
