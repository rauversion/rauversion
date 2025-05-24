import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Tailwind spacing options (0-10, auto)
const SPACING_OPTIONS = [
  { label: "0", value: "0" },
  { label: "0.5", value: "0.5" },
  { label: "1", value: "1" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
  { label: "3.5", value: "3.5" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "10", value: "10" },
  { label: "Auto", value: "auto" },
];

const DEVICES = [
  { key: "mobile", label: "Mobile" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
];

function getClass(prefix, value) {
  if (!value) return "";
  if (value === "auto") return `${prefix}-auto`;
  return `${prefix}-${value.replace(".", "\\.")}`;
}

export default function MarginPaddingField({ value = {}, onChange }) {
  const [tab, setTab] = useState("mobile");

  // Helper to update a device-specific field
  const handleChange = (device, type, val) => {
    onChange({
      ...value,
      [type]: {
        ...(value[type] || {}),
        [device]: val,
      },
    });
  };

  return (
    <div className="space-y-4">
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
            <div>
              <label className="block text-xs mb-1">Margin</label>
              <Select
                value={(value.margin && value.margin[device.key]) || ""}
                onValueChange={(val) => handleChange(device.key, "margin", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  {SPACING_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.value === "auto" ? "Auto" : opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Padding</label>
              <Select
                value={(value.padding && value.padding[device.key]) || ""}
                onValueChange={(val) => handleChange(device.key, "padding", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  {SPACING_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.value === "auto" ? "Auto" : opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
