import React from 'react';
import CheckboxField from './CheckboxField';

const Button = ({ 
  label, 
  href, 
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  className = '',
  target
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      outline: 'border-2 border-current text-blue-600 hover:bg-blue-50',
      ghost: 'text-blue-600 hover:bg-blue-50',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      success: 'bg-green-600 text-white hover:bg-green-700'
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = () => {
    const sizes = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2',
      large: 'px-6 py-3 text-lg'
    };
    return sizes[size] || sizes.medium;
  };

  const baseClasses = [
    'inline-flex items-center justify-center rounded-lg transition-colors duration-200',
    getVariantClasses(),
    getSizeClasses(),
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  const iconElement = icon && (
    <span className={`${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`}>
      {icon}
    </span>
  );

  const content = (
    <>
      {iconPosition === 'left' && iconElement}
      {label}
      {iconPosition === 'right' && iconElement}
    </>
  );

  if (href) {
    return (
      <a 
        href={href}
        className={baseClasses}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      type="button"
    >
      {content}
    </button>
  );
};

export const config = {
  fields: {
    label: {
      type: "text",
      label: "Button Text"
    },
    href: {
      type: "text",
      label: "Link URL (optional)"
    },
    variant: {
      type: "select",
      label: "Style Variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
        { label: "Danger", value: "danger" },
        { label: "Success", value: "success" }
      ]
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" }
      ]
    },
    fullWidth: {
      type: "custom",
      render: CheckboxField,
      label: "Full Width"
    },
    disabled: {
      type: "custom",
      render: CheckboxField,
      label: "Disabled"
    },
    target: {
      type: "select",
      label: "Link Target",
      options: [
        { label: "Same Window", value: "_self" },
        { label: "New Window", value: "_blank" }
      ]
    },
    className: {
      type: "text",
      label: "Additional Classes"
    }
  },
  defaultProps: {
    label: "Click Me",
    variant: "primary",
    size: "medium",
    fullWidth: false,
    disabled: false,
    target: "_self",
    className: ""
  }
};

export default Button;
