declare module "react-color" {
  import * as React from "react";
  export interface ColorResult {
    hex: string;
    rgb: { r: number; g: number; b: number; a: number };
    hsl: { h: number; s: number; l: number; a: number };
  }
  export interface ChromePickerProps {
    color: string;
    onChange: (color: ColorResult) => void;
    disableAlpha?: boolean;
    styles?: any;
  }
  export class ChromePicker extends React.Component<ChromePickerProps> { }
}
