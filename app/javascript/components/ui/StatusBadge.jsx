import React from "react";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function StatusBadge({ status }) {
  return (
    <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </Badge>
  );
}
