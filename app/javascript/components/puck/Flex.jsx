import React from 'react';
import { DropZone } from "@measured/puck";
import ClassField, { mergeVariantClasses } from "./ClassField";

const Flex = ({
  direction = {},
  wrap = {},
  justify = {},
  align = {},
  gap = {},
  className = '',
  basis = {},
  grow = {},
  shrink = {}
}) => {
  return (
    <DropZone
      zone="flex-content"
      classNamessss="h-full flex w-full"
      className={`flex ${mergeVariantClasses(direction, v => v)} ${mergeVariantClasses(wrap, v => v)} ${mergeVariantClasses(justify, v => v)} ${mergeVariantClasses(align, v => v)} ${mergeVariantClasses(gap, v => v)} ${mergeVariantClasses(basis, v => v)} ${mergeVariantClasses(grow, v => v)} ${mergeVariantClasses(shrink, v => v)} ${className}`}
      style={{
        minHeight: '50px',
        minWidth: (basis.mobile || basis) === 'basis-0' ? '100px' : 'auto'
      }}
    />
  );
};

export const config = {
  fields: {
    direction: {
      type: "custom",
      label: "Direction",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Direction",
          options: [
            { label: "Row", value: "flex-row" },
            { label: "Row Reverse", value: "flex-row-reverse" },
            { label: "Column", value: "flex-col" },
            { label: "Column Reverse", value: "flex-col-reverse" },
          ]
        })
      ),
      defaultValue: { mobile: "flex-row", tablet: "", desktop: "" },
    },
    wrap: {
      type: "custom",
      label: "Wrap",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Wrap",
          options: [
            { label: "Wrap", value: "flex-wrap" },
            { label: "No Wrap", value: "flex-nowrap" },
            { label: "Wrap Reverse", value: "flex-wrap-reverse" },
          ]
        })
      ),
      defaultValue: { mobile: "flex-wrap", tablet: "", desktop: "" },
    },
    justify: {
      type: "custom",
      label: "Justify Content",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Justify Content",
          options: [
            { label: "Start", value: "justify-start" },
            { label: "End", value: "justify-end" },
            { label: "Center", value: "justify-center" },
            { label: "Space Between", value: "justify-between" },
            { label: "Space Around", value: "justify-around" },
            { label: "Space Evenly", value: "justify-evenly" },
          ]
        })
      ),
      defaultValue: { mobile: "justify-start", tablet: "", desktop: "" },
    },
    align: {
      type: "custom",
      label: "Align Items",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Align Items",
          options: [
            { label: "Start", value: "items-start" },
            { label: "End", value: "items-end" },
            { label: "Center", value: "items-center" },
            { label: "Baseline", value: "items-baseline" },
            { label: "Stretch", value: "items-stretch" },
          ]
        })
      ),
      defaultValue: { mobile: "items-start", tablet: "", desktop: "" },
    },
    gap: {
      type: "custom",
      label: "Gap",
      render: (props) => (
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
          ]
        })
      ),
      defaultValue: { mobile: "gap-4", tablet: "", desktop: "" },
    },
    basis: {
      type: "custom",
      label: "Basis (width)",
      render: (props) => (
        ClassField({
          ...props,
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
          ]
        })
      ),
      defaultValue: { mobile: "basis-auto", tablet: "", desktop: "" },
    },
    grow: {
      type: "custom",
      label: "Grow",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Grow",
          options: [
            { label: "No grow", value: "grow-0" },
            { label: "Grow", value: "grow" },
          ]
        })
      ),
      defaultValue: { mobile: "grow-0", tablet: "", desktop: "" },
    },
    shrink: {
      type: "custom",
      label: "Shrink",
      render: (props) => (
        ClassField({
          ...props,
          type: "select",
          label: "Shrink",
          options: [
            { label: "No shrink", value: "shrink-0" },
            { label: "Shrink", value: "shrink" },
          ]
        })
      ),
      defaultValue: { mobile: "shrink", tablet: "", desktop: "" },
    },
    className: {
      type: "text",
      label: "Additional Classes",
    },
  },
  defaultProps: {
    direction: { mobile: "flex-row", tablet: "", desktop: "" },
    wrap: { mobile: "flex-wrap", tablet: "", desktop: "" },
    justify: { mobile: "justify-start", tablet: "", desktop: "" },
    align: { mobile: "items-start", tablet: "", desktop: "" },
    gap: { mobile: "gap-4", tablet: "", desktop: "" },
    basis: { mobile: "basis-auto", tablet: "", desktop: "" },
    grow: { mobile: "grow-0", tablet: "", desktop: "" },
    shrink: { mobile: "shrink", tablet: "", desktop: "" },
    className: "",
  }
};

export default Flex;
