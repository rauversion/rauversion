import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function EmptyState({ title, description, actionText, onAction }) {
  return (
    <div className="text-center py-12">
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <div className="mt-6">
          <Button onClick={onAction}>
            <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
            {actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}
