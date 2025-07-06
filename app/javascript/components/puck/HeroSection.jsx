import React from 'react';
import ImageUploadField from './ImageUploadField';
import Button from './Button';
import SimpleEditor from '@/components/ui/SimpleEditor';

const HeroSection = ({
  backgroundImage,
  overlayColor,
  height,
  title,
  description,
  buttons,
  align,
  image,
  puck
}) => {
  // Ensure image is always an object to prevent TypeError
  image = image || {};
  const getClassName = (element) => {
    const baseClasses = {
      content: "relative z-10 container mx-auto px-4 py-12 flex flex-col",
      subtitle: "mt-4 text-lg text-gray-600 max-w-2xl",
      actions: "mt-8 flex gap-4"
    };

    if (align === "center") {
      baseClasses.content += " items-center text-center";
      baseClasses.subtitle += " text-center";
      baseClasses.actions += " justify-center";
    }

    return baseClasses[element];
  };


  return (
    <div
      className={`relative ${height}`}
      style={{
        backgroundImage: image?.mode === "background" ? `url(${image?.url})` : `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor }}
      ></div>
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="w-full flex gap-8">
          <div className={getClassName("content")}>
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className={getClassName("subtitle")}>{description}</p>
            <div className={getClassName("actions")}>
              {buttons.map((button, i) => (
                <Button
                  key={i}
                  label={button.label}
                  href={button.href}
                  variant={button.variant}
                  size={button.size}
                  tabIndex={puck.isEditing ? -1 : undefined}
                />
              ))}
            </div>
          </div>

          {align !== "center" && image?.mode !== "background" && image?.url && (
            <div
              style={{
                backgroundImage: `url('${image?.url}')`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                borderRadius: 24,
                height: 356,
                marginLeft: "auto",
                width: "100%",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const config = {
  fields: {
    title: {
      type: "text",
      label: "Title"
    },
    description: {
      type: "custom",
      label: "Description",
      render: SimpleEditor
    },
    backgroundImage: {
      type: "custom",
      render: ImageUploadField
    },
    overlayColor: {
      type: "text",
      label: "Overlay Color"
    },
    height: {
      type: "select",
      label: "Section Height",
      options: [
        { label: "Small", value: "h-64" },
        { label: "Medium", value: "h-96" },
        { label: "Large", value: "h-screen" }
      ]
    },
    align: {
      type: "select",
      label: "Content Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" }
      ]
    },
    image: {
      type: "object",
      label: "Image",
      fields: {
        url: {
          type: "custom",
          render: ImageUploadField,
          label: "Image URL"
        },
        mode: {
          type: "select",
          label: "Display Mode",
          options: [
            { label: "Side", value: "side" },
            { label: "Background", value: "background" }
          ]
        }
      }
    },
    buttons: {
      type: "array",
      label: "Buttons",
      arrayFields: {
        label: {
          type: "text",
          label: "Button Text"
        },
        href: {
          type: "text",
          label: "Button Link"
        },
        variant: {
          type: "select",
          label: "Button Style",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" }
          ]
        },
        size: {
          type: "select",
          label: "Button Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" }
          ]
        }
      }
    }
  },
  defaultProps: {
    title: "Welcome to Our Site",
    description: "This is a sample hero section. Customize it to match your needs.",
    backgroundImage: "",
    overlayColor: "rgba(0,0,0,0.5)",
    height: "h-96",
    align: "left",
    image: {
      url: "",
      mode: "side"
    },
    buttons: [
      {
        label: "Get Started",
        href: "#",
        variant: "primary",
        size: "large"
      },
      {
        label: "Learn More",
        href: "#",
        variant: "secondary",
        size: "large"
      }
    ]
  }
};

export default HeroSection;
