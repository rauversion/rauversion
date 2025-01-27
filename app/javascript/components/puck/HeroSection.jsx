import React from 'react';
import ImageUploadField from './ImageUploadField';

const HeroSection = ({ backgroundImage, overlayColor, height }) => {
  return (
    <div
      className={`relative ${height}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor }}
      ></div>
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="w-full">
          {/* Content can be added here */}
        </div>
      </div>
    </div>
  );
};

export const config = {
  fields: {
    backgroundImage: {
      type: "custom",
      render: ImageUploadField
    },
    overlayColor: {
      type: "text",
      label: "Overlay Color",
      defaultValue: "rgba(0,0,0,0.5)",
    },
    height: {
      type: "select",
      label: "Section Height",
      options: [
        { label: "Small", value: "h-64" },
        { label: "Medium", value: "h-96" },
        { label: "Large", value: "h-screen" },
      ],
      defaultValue: "h-96",
    },
  }
};

export default HeroSection;
