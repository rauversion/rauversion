import React from "react";
import Typography from "./Typography";
import { composeSpacingClasses, createMarginField, createPaddingField } from "./SpacingProps";
import {
  createTypographyDefaults,
  createTypographyField,
  mergeTypographyProps,
} from "./TypographyProps";

const getDefaultTitleTypography = () =>
  createTypographyDefaults({
    size: { mobile: "text-base", tablet: "", desktop: "" },
    weight: { mobile: "font-bold", tablet: "", desktop: "" },
    color: "",
  });

const getDefaultItemTypography = () =>
  createTypographyDefaults({
    size: { mobile: "text-xs", tablet: "", desktop: "" },
    weight: { mobile: "font-normal", tablet: "", desktop: "" },
    color: "",
  });

const MultiList = ({
  columns = [],
  gridCols = "grid-cols-2",
  textColor,
  textSize,
  titleTypography = {},
  itemTypography = {},
  className,
  padding = {},
  margin = {},
}) => {
  const spacingClasses = composeSpacingClasses({ margin, padding });
  const resolvedTitleTypography = mergeTypographyProps(
    getDefaultTitleTypography(),
    titleTypography
  );
  const resolvedItemTypography = mergeTypographyProps(
    getDefaultItemTypography(),
    itemTypography
  );
  const legacyTextClasses = [textColor, textSize].filter(Boolean).join(" ");

  return (
    <div className={`${className || ""} ${spacingClasses}`.trim()}>
      <div className={`grid md:${gridCols} grid-cols-1 gap-4 ${legacyTextClasses}`.trim()}>
        {columns.map((column, index) => (
          <div key={index}>
            <Typography
              as="h3"
              className="mb-2"
              {...resolvedTitleTypography}
              text={column.title || ""}
            />
            <ul className="space-y-1">
              {(column.items || []).map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.url ? (
                    <a 
                      href={item.url} 
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Typography as="span" {...resolvedItemTypography} text={item.text || ""} />
                    </a>
                  ) : (
                    <Typography as="span" {...resolvedItemTypography} text={item.text || ""} />
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
      label: "Text Color (legacy class)",
    },
    textSize: {
      type: "select",
      label: "Text Size (legacy class)",
      options: [
        { label: "Extra Small", value: "text-xs" },
        { label: "Small", value: "text-sm" },
        { label: "Base", value: "text-base" },
        { label: "Large", value: "text-lg" },
      ],
    },
    titleTypography: createTypographyField({
      label: "Title Typography",
      includeText: false,
      defaultValue: getDefaultTitleTypography(),
    }),
    itemTypography: createTypographyField({
      label: "Item Typography",
      includeText: false,
      defaultValue: getDefaultItemTypography(),
    }),
    className: {
      type: "text",
      label: "Wrapper Classes",
      description: "Add custom classes to the wrapper element",
      defaultValue: "",
    },
    padding: createPaddingField(),
    margin: createMarginField(),
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
    titleTypography: getDefaultTitleTypography(),
    itemTypography: getDefaultItemTypography(),
    className: "",
    padding: { mobile: "", tablet: "", desktop: "" },
    margin: { mobile: "", tablet: "", desktop: "" },
  }
};

export default MultiList;
