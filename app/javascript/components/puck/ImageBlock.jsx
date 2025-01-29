import React from 'react';
import ImageUploadField from './ImageUploadField';

const ImageBlock = ({ 
  image, 
  href,
  alt,
  aspectRatio = "4/3",
  maxWidth = "2xl",
  rounded = "lg",
  shadow = "lg"
}) => {
  const containerStyle = {
    position: 'relative',
    aspectRatio: aspectRatio
  };

  const imageStyle = {
    position: 'absolute',
    height: '100%',
    width: '100%',
    inset: '0px',
    color: 'transparent'
  };

  const ImageComponent = (
    <div className={`relative w-full max-w-${maxWidth} mx-auto overflow-hidden rounded-${rounded} shadow-${shadow}`} style={containerStyle}>
      <img
        src={image}
        alt={alt || ''}
        className="object-cover"
        style={imageStyle}
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
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      options: [
        { label: "4:3", value: "4/3" },
        { label: "16:9", value: "16/9" },
        { label: "1:1", value: "1/1" },
        { label: "3:4", value: "3/4" },
        { label: "2:3", value: "2/3" }
      ],
      defaultValue: "4/3",
    },
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "None", value: "none" },
      ],
      defaultValue: "2xl",
    },
    rounded: {
      type: "select",
      label: "Rounded",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
      defaultValue: "lg",
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
      defaultValue: "lg",
    }
  },
  defaultProps: {
    image: "",
    alt: "",
    href: "",
    aspectRatio: "4/3",
    maxWidth: "2xl",
    rounded: "lg",
    shadow: "lg"
  }
};

export default ImageBlock;
