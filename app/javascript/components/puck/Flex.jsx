import React from 'react';
import { DropZone } from "@measured/puck";

const Flex = ({ 
  direction = 'flex-row',
  wrap = 'flex-wrap',
  justify = 'justify-start',
  align = 'items-start',
  gap = 'gap-4',
  className = '',
  basis = 'basis-auto',
  grow = 'grow-0',
  shrink = 'shrink-1'
}) => {
  return (
    <DropZone
      zone="flex-content"
      classNamessss="h-full flex w-full"
      className={`flex ${direction} ${wrap} ${justify} ${align} ${gap} ${basis} ${grow} ${shrink} ${className}`}
      style={{
        minHeight: '50px',
        minWidth: basis === 'basis-0' ? '100px' : 'auto'
      }}
    />
  );
};

export const config = {
  fields: {
    direction: {
      type: "select",
      label: "Direction",
      options: [
        { label: "Row", value: "flex-row" },
        { label: "Row Reverse", value: "flex-row-reverse" },
        { label: "Column", value: "flex-col" },
        { label: "Column Reverse", value: "flex-col-reverse" },
      ],
    },
    wrap: {
      type: "select",
      label: "Wrap",
      options: [
        { label: "Wrap", value: "flex-wrap" },
        { label: "No Wrap", value: "flex-nowrap" },
        { label: "Wrap Reverse", value: "flex-wrap-reverse" },
      ],
    },
    justify: {
      type: "select",
      label: "Justify Content",
      options: [
        { label: "Start", value: "justify-start" },
        { label: "End", value: "justify-end" },
        { label: "Center", value: "justify-center" },
        { label: "Space Between", value: "justify-between" },
        { label: "Space Around", value: "justify-around" },
        { label: "Space Evenly", value: "justify-evenly" },
      ],
    },
    align: {
      type: "select",
      label: "Align Items",
      options: [
        { label: "Start", value: "items-start" },
        { label: "End", value: "items-end" },
        { label: "Center", value: "items-center" },
        { label: "Baseline", value: "items-baseline" },
        { label: "Stretch", value: "items-stretch" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "gap-0" },
        { label: "Small", value: "gap-2" },
        { label: "Medium", value: "gap-4" },
        { label: "Large", value: "gap-6" },
        { label: "Extra Large", value: "gap-8" },
      ],
    },
    basis: {
      type: "select",
      label: "Basis (width)",
      options: [
        { label: "Auto", value: "basis-auto" },
        { label: "0 (fit content)", value: "basis-0" },
        { label: "25%", value: "basis-1/4" },
        { label: "33%", value: "basis-1/3" },
        { label: "50%", value: "basis-1/2" },
        { label: "66%", value: "basis-2/3" },
        { label: "75%", value: "basis-3/4" },
        { label: "100%", value: "basis-full" },
      ],
    },
    grow: {
      type: "select",
      label: "Grow",
      options: [
        { label: "No grow", value: "grow-0" },
        { label: "Grow", value: "grow" },
      ],
    },
    shrink: {
      type: "select",
      label: "Shrink",
      options: [
        { label: "No shrink", value: "shrink-0" },
        { label: "Shrink", value: "shrink" },
      ],
    },
    className: {
      type: "text",
      label: "Additional Classes",
    },
  },
  defaultProps: {
    direction: "flex-row",
    wrap: "flex-wrap",
    justify: "justify-start",
    align: "items-start",
    gap: "gap-4",
    basis: "basis-auto",
    grow: "grow-0",
    shrink: "shrink",
    className: "",
  }
};

export default Flex;
