import React from 'react';

const ColorPicker = ({ onChange, value, label }) => {
  return (
    <div>
      <label>{label}:</label>
      <input type="color" value={value} onChange={onChange} />
    </div>
  );
};

export default ColorPicker;
