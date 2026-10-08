import React, { useState } from "react";
import { patch } from "@rails/request.js";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import I18n from "@/stores/locales";
import { getUserDisplayName } from "@/utils/userDisplayName";
import { useToast } from "@/hooks/use-toast";

export default function DescriptionEditor({ user, onSaved }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenChange = (nextOpen) => {
    if (saving) return;
    if (nextOpen) {
      setBio(user.bio || "");
      setError(null);
    }
    setOpen(nextOpen);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const response = await patch(`/profiles/${encodeURIComponent(user.username)}/description.json`, {
        body: JSON.stringify({ user: { bio } }),
        responseKind: "json",
      });
      const data = await response.json;
      if (!response.ok || typeof data.bio !== "string") {
        setError(data.errors?.join(". ") || I18n.t("users.description_editor.error"));
        return;
      }

      onSaved(data.bio);
      toast({ description: I18n.t("users.description_editor.saved") });
      setOpen(false);
    } catch (error) {
      setError(I18n.t("users.description_editor.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          aria-label={I18n.t("users.description_editor.edit")}
          title={I18n.t("users.description_editor.edit")}
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{I18n.t("users.description_editor.edit")}</DialogTitle>
          <DialogDescription>
            {I18n.t("users.description_editor.help", { name: getUserDisplayName(user) })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`profile-description-${user.id}`}>
              {I18n.t("users.description_editor.label")}
            </Label>
            <Textarea
              id={`profile-description-${user.id}`}
              name="bio"
              rows={6}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              disabled={saving}
              className="min-h-36"
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => handleOpenChange(false)}>
              {I18n.t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {I18n.t(saving ? "users.description_editor.saving" : "save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
