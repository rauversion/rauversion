import React, { useState } from "react";
import ColorPicker from "./ColorPicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Device-specific fields, including fontStretch
const VARIANT_FIELDS = [
  {
    key: "size", label: "Size", options: [
      { label: "XS", value: "text-xs" },
      { label: "Small", value: "text-sm" },
      { label: "Base", value: "text-base" },
      { label: "Large", value: "text-lg" },
      { label: "XL", value: "text-xl" },
      { label: "2XL", value: "text-2xl" },
      { label: "3XL", value: "text-3xl" },
      { label: "4XL", value: "text-4xl" },
      { label: "5XL", value: "text-5xl" },
      { label: "6XL", value: "text-6xl" },
      { label: "7XL", value: "text-7xl" },
      { label: "8XL", value: "text-8xl" },
      { label: "9XL", value: "text-9xl" },
    ]
  },
  {
    key: "weight", label: "Weight", options: [
      { label: "Thin", value: "font-thin" },
      { label: "Extra Light", value: "font-extralight" },
      { label: "Light", value: "font-light" },
      { label: "Normal", value: "font-normal" },
      { label: "Medium", value: "font-medium" },
      { label: "Semi Bold", value: "font-semibold" },
      { label: "Bold", value: "font-bold" },
      { label: "Extra Bold", value: "font-extrabold" },
      { label: "Black", value: "font-black" },
    ]
  },
  {
    key: "letterSpacing", label: "Letter Spacing", options: [
      { label: "Tighter", value: "tracking-tighter" },
      { label: "Tight", value: "tracking-tight" },
      { label: "Normal", value: "tracking-normal" },
      { label: "Wide", value: "tracking-wide" },
      { label: "Wider", value: "tracking-wider" },
      { label: "Widest", value: "tracking-widest" },
    ]
  },
  {
    key: "alignment", label: "Alignment", options: [
      { label: "Left", value: "text-left" },
      { label: "Center", value: "text-center" },
      { label: "Right", value: "text-right" },
    ]
  },
  {
    key: "fontFamily", label: "Font Family", options: [
      { label: "Sans", value: "font-sans" },
      { label: "Serif", value: "font-serif" },
      { label: "Mono", value: "font-mono" },
    ]
  },
  {
    key: "fontStretch", label: "Font Stretch", options: [
      { label: "Ultra Condensed", value: "ultra-condensed" },
      { label: "Extra Condensed", value: "extra-condensed" },
      { label: "Condensed", value: "condensed" },
      { label: "Semi Condensed", value: "semi-condensed" },
      { label: "Normal", value: "normal" },
      { label: "Semi Expanded", value: "semi-expanded" },
      { label: "Expanded", value: "expanded" },
      { label: "Extra Expanded", value: "extra-expanded" },
      { label: "Ultra Expanded", value: "ultra-expanded" },
    ]
  },
];

const DEVICES = [
  { key: "mobile", label: "Mobile" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
];

export default function TypographyField({ value = {}, onChange }) {
  const [tab, setTab] = useState("mobile");

  // Helper to update a device-specific field
  const handleVariantChange = (device, field, fieldValue) => {
    onChange({
      ...value,
      [field]: {
        ...(value[field] || {}),
        [device]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1">Text</label>
        <Input
          value={value.text || ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Enter text"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Variants</label>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            {DEVICES.map((device) => (
              <TabsTrigger key={device.key} value={device.key}>
                {device.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {DEVICES.map((device) => (
            <TabsContent key={device.key} value={device.key} className="space-y-2 pt-2">
              {VARIANT_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs mb-1">{field.label}</label>
                  <Select
                    value={(value[field.key] && value[field.key][device.key]) || ""}
                    onValueChange={(val) =>
                      handleVariantChange(device.key, field.key, val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Text Color</label>
        <ColorPicker
          value={value.color || "#000000"}
          onChange={(color) => onChange({ ...value, color })}
        />
      </div>
    </div>
  );
}
