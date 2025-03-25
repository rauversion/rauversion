import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId } from "react";

export function CurrencyInput({ currency, currencySymbol, label, ...props}) {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>
        {label}
      </Label>
      <div className="relative flex rounded-md shadow-xs">
        <span className="text-default pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm">
          {currencySymbol}
        </span>
        <Input
          id={id}
          className="-me-px rounded-e-none ps-6 shadow-none"
          {...props}
        />
        <span className="border-input bg-default text-default z-10 inline-flex items-center rounded-e-md border px-3 text-sm">
          {currency}
        </span>
      </div>
    </div>
  );
}
