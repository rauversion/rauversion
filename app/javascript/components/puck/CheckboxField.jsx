import React from 'react';

const CheckboxField = ({ onChange, value, label }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
};

export default CheckboxField;
