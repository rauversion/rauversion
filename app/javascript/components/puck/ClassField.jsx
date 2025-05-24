import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Usage: <VariantField value={value} onChange={onChange} type="color" render={ColorPicker} />
// type: "color", "text", "select"
// options: for select type

const DEVICES = [
  { key: "mobile", label: "Mobile" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
];

// Helper to merge device-specific classes (mobile, tablet, desktop)
export function mergeVariantClasses(field, map) {
  if (!field) return "";
  let cls = "";
  if (typeof field === "string") {
    // legacy: single value
    cls += map(field, "");
  } else {
    if (field.mobile) cls += map(field.mobile, "");
    if (field.tablet) cls += " sm:" + map(field.tablet, "");
    if (field.desktop) cls += " md:" + map(field.desktop, "");
  }
  return cls.trim();
}

export default function VariantField({
  value = {},
  onChange,
  type = "text",
  render, // for custom render, e.g. ColorPicker
  options = [],
  label = "",
  placeholder = "",
}) {
  const [tab, setTab] = useState("mobile");

  const handleChange = (device, val) => {
    const updatedValue = {
      ...value,
      [device]: val,
    };
    onChange(updatedValue);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold mb-1">{label}</label>}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          {DEVICES.map((device) => (
            <TabsTrigger key={device.key} value={device.key}>
              {device.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {DEVICES.map((device) => (
          <TabsContent key={device.key} value={device.key}>
            {type === "color" && render ? (
              render({
                value: value[device.key] || "",
                onChange: (val) => handleChange(device.key, val),
              })
            ) : type === "select" ? (
              <Select
                value={value[device.key] || ""}
                onValueChange={(val) => handleChange(device.key, val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={value[device.key] || ""}
                onChange={(e) => handleChange(device.key, e.target.value)}
                placeholder={placeholder}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
