import React from 'react';
import ColorPicker from './ColorPicker';
import ImageUploadField from './ImageUploadField';
import SimpleEditor from '@/components/ui/SimpleEditor';

const Section = ({ 
  variant,
  title,
  subtitle,
  description,
  image,
  backgroundColor,
  borderColor,
  titleColor,
  subtitleColor,
  textColor,
  padding,
  titleSize,
  subtitleSize,
  textSize
}) => {
  const renderLeftVariant = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col sm:flex-row space-y-4 items-center space-x-4">
        {image && (
          <img src={image} alt="" className="rounded-lg w-full object-cover" />
        )}
        <div className={`${textSize} text-subtle`} style={{ color: textColor }}>
          {description}
        </div>
      </div>
      <div className="flex flex-col justify-between">
        <div className="flex justify-end">
          <p className={`${subtitleSize} font-bold`} style={{ color: subtitleColor }}>
            {subtitle}
          </p>
        </div>
        <p className={`${titleSize} font-bold uppercase tracking-tight text-right`} style={{ color: titleColor }}>
          {title}
        </p>
      </div>
    </div>
  );

  const renderRightVariant = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col space-y-4">
        <h2 className={`${titleSize} font-bold uppercase`} style={{ color: titleColor }}>
          {title}
        </h2>
        <div className={`${textSize} text-subtle`} style={{ color: textColor }}>
          {description}
        </div>
      </div>
      <div className="flex justify-end flex-col">
        {image && (
          <img src={image} alt="" className="rounded-lg w-full object-cover mb-4" />
        )}
        <p className={`${subtitleSize} font-bold text-subtle text-right`} style={{ color: subtitleColor }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  const renderFixedVariant = () => (
    <div className="flex flex-col space-y-6">
      <h2 className={`${titleSize} font-bold uppercase`} style={{ color: titleColor }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className={`${textSize} text-subtle`} style={{ color: textColor }}>
            {description}
          </div>
        </div>
        <div className="flex flex-col">
          {image && (
            <img src={image} alt="" className="rounded-lg w-full object-cover" />
          )}
        </div>
      </div>
    </div>
  );

  const renderOverlayVariant = () => (
    <div className="w-full relative">
      <div className="w-full aspect-[4/3] md:aspect-[16/9] relative">
        {image && (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full sm:grayscale hover:grayscale-0 transition-all duration-300"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div className="sm:absolute top-0 right-0 bottom-0 w-full md:w-1/2 lg:w-2/5 flex items-center justify-center">
        <div 
          className="p-6 md:p-8 w-full h-full flex flex-col justify-center"
          style={{ 
            backgroundColor: backgroundColor,
            opacity: 0.75
          }}
        >
          <h1 
            className={`${titleSize} font-bold tracking-tight leading-none`}
            style={{ color: titleColor }}
          >
            {title}
          </h1>
          <p 
            className={`${subtitleSize} font-bold uppercase tracking-tight text-right`}
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
          <div 
            className="mt-4 text-sm"
            style={{ color: textColor }}
          >
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        </div>
      </div>
    </div>
  );

  const variants = {
    left: renderLeftVariant,
    right: renderRightVariant,
    fixed: renderFixedVariant,
    overlay: renderOverlayVariant
  };

  const renderVariant = variants[variant] || variants.left;

  return (
    <section 
      className={`${variant === 'overlay' ? '' : 'container--- mx-auto---'} ${padding} border-t-4`}
      style={{ 
        backgroundColor: variant === 'overlay' ? 'transparent' : backgroundColor,
        borderColor: borderColor
      }}
    >
      {renderVariant()}
    </section>
  );
};

export const config = {
  fields: {
    variant: {
      type: "select",
      label: "Layout Variant",
      options: [
        { label: "Left Image", value: "left" },
        { label: "Right Image", value: "right" },
        { label: "Fixed Layout", value: "fixed" },
        { label: "Overlay", value: "overlay" }
      ],
      defaultValue: "left",
    },
    title: {
      type: "text",
      label: "Title",
    },
    titleSize: {
      type: "select",
      label: "Title Size",
      options: [
        { label: "Small", value: "text-2xl" },
        { label: "Medium", value: "text-3xl" },
        { label: "Large", value: "text-4xl" },
        { label: "Extra Large", value: "text-5xl" },
        { label: "2XL", value: "text-6xl" },
      ],
      defaultValue: "text-5xl",
    },
    titleColor: {
      type: "custom",
      label: "Title Color",
      render: ColorPicker,
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
    },
    subtitleSize: {
      type: "select",
      label: "Subtitle Size",
      options: [
        { label: "Large", value: "text-6xl" },
        { label: "Extra Large", value: "text-7xl" },
        { label: "2XL", value: "text-8xl" },
        { label: "3XL", value: "text-9xl" },
      ],
      defaultValue: "text-8xl",
    },
    subtitleColor: {
      type: "custom",
      label: "Subtitle Color",
      render: ColorPicker,
    },
    description: {
      type: "custom",
      label: "Description",
      render: SimpleEditor,
    },
    textSize: {
      type: "select",
      label: "Text Size",
      options: [
        { label: "Small", value: "text-base" },
        { label: "Medium", value: "text-lg" },
        { label: "Large", value: "text-xl" },
      ],
      defaultValue: "text-lg",
    },
    textColor: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
    image: {
      type: "custom",
      label: "Image",
      render: ImageUploadField,
    },
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: ColorPicker,
    },
    borderColor: {
      type: "custom",
      label: "Border Color",
      render: ColorPicker,
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "p-0" },
        { label: "Small", value: "px-4 py-8" },
        { label: "Medium", value: "px-6 py-10" },
        { label: "Large", value: "px-8 py-12" },
        { label: "Extra Large", value: "px-10 py-16" },
      ],
      defaultValue: "px-8 py-12",
    },
  },
  defaultProps: {
    variant: "left",
    title: "Section Title",
    titleSize: "text-5xl",
    titleColor: "#000000",
    subtitle: "01",
    subtitleSize: "text-8xl",
    subtitleColor: "#6B7280",
    description: "Add your section description here...",
    textSize: "text-lg",
    textColor: "#4B5563",
    image: "",
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    padding: "px-8 py-12",
  }
};

export default Section;
