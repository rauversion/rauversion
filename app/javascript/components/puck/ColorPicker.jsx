import React from 'react';

const ColorPicker = ({ onChange, value, label }) => {
  return (
    <div>
      <label>{label}:</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
};

export default ColorPicker;
