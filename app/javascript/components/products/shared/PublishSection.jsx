import React from "react";
import { useController } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, EyeOff, RadioTower } from "lucide-react";
import I18n from "@/stores/locales";

const PublishSection = ({ control, setValue, watch }) => {
  const {
    field: { value: status },
  } = useController({
    name: "status",
    control,
    defaultValue: "inactive",
  });

  const isActive = status === "active";

  const handleStatusChange = (checked = !isActive) => {
    const newStatus = checked ? "active" : "inactive";
    setValue("status", newStatus, { shouldDirty: true, shouldValidate: true });
    toast({
      title: checked
        ? I18n.t("products.form.publish.toast_active")
        : I18n.t("products.form.publish.toast_inactive"),
    });
  };

  return (
    <div
      className={`rounded-lg border p-4 transition ${
        isActive
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground"
            }`}
          >
            {isActive ? <RadioTower className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {I18n.t("products.form.publish.title")}
              </p>
              <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
                {isActive && <CheckCircle2 className="h-3 w-3" />}
                {isActive
                  ? I18n.t("products.form.publish.active_label")
                  : I18n.t("products.form.publish.inactive_label")}
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {isActive
                ? I18n.t("products.form.publish.active_description")
                : I18n.t("products.form.publish.inactive_description")}
            </p>
          </div>
        </div>

        <Switch
          checked={isActive}
          onCheckedChange={handleStatusChange}
          className="mt-1 data-[state=checked]:bg-primary"
          aria-label={I18n.t("products.form.publish.title")}
        />
      </div>
    </div>
  );
};

export default PublishSection;
