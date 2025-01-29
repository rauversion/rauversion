import React, { useState } from 'react';
import { ChromePicker, SketchPicker } from 'react-color';

const ColorPicker = ({ onChange, value, label }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const decimalToHex = (alpha) => {
    console.log(alpha)
   return alpha <= 0.04 ? '00' : Math.round(255 * alpha).toString(16)
  }

  const handleColorChange = (color) => {
    console.log(color);
    const hexCode = `${color.hex}${decimalToHex(color.rgb.a)}` 
    return hexCode
  }

  const handleChange = (color) => {
    onChange(handleColorChange(color));
  };

  const styles = {
    color: {
      width: '36px',
      height: '36px',
      borderRadius: '4px',
      background: value,
      border: '1px solid #ddd',
      cursor: 'pointer',
    },
    swatch: {
      padding: '4px',
      background: '#fff',
      borderRadius: '4px',
      boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
      display: 'inline-block',
      cursor: 'pointer',
    },
    popover: {
      position: 'absolute',
      zIndex: '2',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-default mb-2">
        {label}
      </label>
      <div>
        <div style={styles.swatch} onClick={handleClick}>
          <div style={styles.color} />
        </div>
        {displayColorPicker ? (
          <div style={styles.popover}>
            <div style={styles.cover} onClick={handleClose} />
            <ChromePicker color={value} onChange={handleChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ColorPicker;
