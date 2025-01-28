import React from 'react';
import ImageUploadField from './ImageUploadField';

const ImageBlock = ({ 
  image, 
  href, 
  borderRadius,
  width,
  height,
  objectFit,
  shadow,
  alt,
  containerClasses,
  containerStyle
}) => {
  // Parse containerStyle from string to object
  let parsedStyle = {};
  try {
    parsedStyle = containerStyle ? JSON.parse(containerStyle) : {};
  } catch (e) {
    console.warn('Invalid containerStyle JSON:', e);
  }

  const ImageComponent = (
    <div className={containerClasses} style={parsedStyle}>
      <img
        src={image}
        alt={alt || ''}
        className={`${width} ${height} ${objectFit} ${borderRadius} ${shadow}`}
      />
    </div>
  );

  if (href) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {ImageComponent}
      </a>
    );
  }

  return ImageComponent;
};

export const config = {
  fields: {
    image: {
      type: "custom",
      label: "Image",
      render: ImageUploadField,
    },
    alt: {
      type: "text",
      label: "Alt Text",
      defaultValue: "",
    },
    href: {
      type: "text",
      label: "Link URL (optional)",
      defaultValue: "",
    },
    containerClasses: {
      type: "text",
      label: "Container Classes",
      description: "Add custom classes to the container div (e.g., 'flex justify-center p-4')",
      defaultValue: "",
    },
    containerStyle: {
      type: "text",
      label: "Container Inline Style",
      description: "Add custom inline styles as JSON (e.g., {'maxWidth': '500px'})",
      defaultValue: "{}",
    },
    width: {
      type: "select",
      label: "Width",
      options: [
        { label: "Auto", value: "w-auto" },
        { label: "Full", value: "w-full" },
        { label: "1/2", value: "w-1/2" },
        { label: "1/3", value: "w-1/3" },
        { label: "2/3", value: "w-2/3" },
        { label: "1/4", value: "w-1/4" },
        { label: "3/4", value: "w-3/4" },
      ],
      defaultValue: "w-full",
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Auto", value: "h-auto" },
        { label: "Small", value: "h-48" },
        { label: "Medium", value: "h-64" },
        { label: "Large", value: "h-96" },
        { label: "Screen", value: "h-screen" },
      ],
      defaultValue: "h-auto",
    },
    objectFit: {
      type: "select",
      label: "Object Fit",
      options: [
        { label: "Cover", value: "object-cover" },
        { label: "Contain", value: "object-contain" },
        { label: "Fill", value: "object-fill" },
        { label: "None", value: "object-none" },
      ],
      defaultValue: "object-cover",
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "rounded-none" },
        { label: "Small", value: "rounded-sm" },
        { label: "Medium", value: "rounded-md" },
        { label: "Large", value: "rounded-lg" },
        { label: "Extra Large", value: "rounded-xl" },
        { label: "2XL", value: "rounded-2xl" },
        { label: "3XL", value: "rounded-3xl" },
        { label: "Full", value: "rounded-full" },
      ],
      defaultValue: "rounded-none",
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "shadow-none" },
        { label: "Small", value: "shadow-sm" },
        { label: "Medium", value: "shadow-md" },
        { label: "Large", value: "shadow-lg" },
        { label: "Extra Large", value: "shadow-xl" },
        { label: "2XL", value: "shadow-2xl" },
      ],
      defaultValue: "shadow-none",
    },
  },
  defaultProps: {
    image: "",
    alt: "",
    href: "",
    containerClasses: "",
    containerStyle: "{}",
    width: "w-full",
    height: "h-auto",
    objectFit: "object-cover",
    borderRadius: "rounded-none",
    shadow: "shadow-none",
  }
};

export default ImageBlock;
