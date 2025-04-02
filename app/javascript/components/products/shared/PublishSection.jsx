import React from "react";
import { useController } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

const PublishSection = ({ control, setValue, watch }) => {
  const {
    field: { value: status, onChange },
  } = useController({
    name: "status",
    control,
    defaultValue: "inactive",
  });

  const handleCheckboxChange = () => {
    const newStatus = status === "active" ? "inactive" : "active";
    setValue("status", newStatus);
    toast(`Status changed to ${newStatus}`);
  };

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={status === "active"}
        onChange={handleCheckboxChange}
        className="mr-2"
      />
      <label className="text-sm font-medium text-gray-700">
        {status === "active" ? "Active" : "Inactive"}
      </label>
    </div>
  );
};

export default PublishSection;
