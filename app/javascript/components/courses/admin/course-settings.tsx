"use client"
import React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function CourseSettings({ courseData, onDataChange, onSave }) {
  const [localSettings, setLocalSettings] = React.useState(courseData)

  React.useEffect(() => {
    setLocalSettings(courseData)
  }, [courseData])

  const handleToggleChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }))
    onDataChange({ [field]: value })
  }

  const handleFieldChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }))
    onDataChange({ [field]: value })
  }

  const handleSave = () => {
    onSave && onSave(localSettings)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{I18n.t("courses.settings.course_settings")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="published">{I18n.t("courses.settings.published")}</Label>
              <p className="text-sm text-muted-foreground">{I18n.t("courses.settings.published_desc")}</p>
            </div>
            <Switch
              id="published"
              checked={localSettings.published}
              onCheckedChange={(checked) => handleToggleChange("published", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">{I18n.t("courses.settings.featured_course")}</Label>
              <p className="text-sm text-muted-foreground">{I18n.t("courses.settings.featured_course_desc")}</p>
            </div>
            <Switch
              id="featured"
              checked={localSettings.featured}
              onCheckedChange={(checked) => handleToggleChange("featured", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="certificate">{I18n.t("courses.settings.certificate")}</Label>
              <p className="text-sm text-muted-foreground">{I18n.t("courses.settings.certificate_desc")}</p>
            </div>
            <Switch
              id="certificate"
              checked={localSettings.certificate}
              onCheckedChange={(checked) => handleToggleChange("certificate", checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">{I18n.t("courses.settings.enrollment_settings")}</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="enrollment-type">{I18n.t("courses.settings.enrollment_type")}</Label>
            <Select
              defaultValue={localSettings.enrollment_type || "open"}
              onValueChange={(value) => handleFieldChange("enrollment_type", value)}
            >
              <SelectTrigger id="enrollment-type">
                <SelectValue placeholder={I18n.t("courses.settings.select_enrollment_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{I18n.t("courses.settings.open_enrollment")}</SelectItem>
                <SelectItem value="invite">{I18n.t("courses.settings.invite_only")}</SelectItem>
                {/*<SelectItem value="approval">{I18n.t("courses.settings.requires_approval")}</SelectItem>*/}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max-students">{I18n.t("courses.settings.max_students")}</Label>
            <Input
              id="max-students"
              type="number"
              placeholder={I18n.t("courses.settings.max_students_placeholder")}
              value={localSettings.max_students || "0"}
              onChange={(e) => handleFieldChange("max_students", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">{I18n.t("courses.settings.seo_settings")}</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="seo-title">{I18n.t("courses.settings.seo_title")}</Label>
            <Input
              id="seo-title"
              placeholder={I18n.t("courses.settings.seo_title_placeholder")}
              value={localSettings.seo_title || ""}
              onChange={(e) => handleFieldChange("seo_title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seo-description">{I18n.t("courses.settings.seo_description")}</Label>
            <Textarea
              id="seo-description"
              placeholder={I18n.t("courses.settings.seo_description_placeholder")}
              value={localSettings.seo_description || ""}
              onChange={(e) => handleFieldChange("seo_description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seo-keywords">{I18n.t("courses.settings.seo_keywords")}</Label>
            <Input
              id="seo-keywords"
              placeholder={I18n.t("courses.settings.seo_keywords_placeholder")}
              value={localSettings.seoKeywords || ""}
              onChange={(e) => handleFieldChange("seoKeywords", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="destructive" className="mr-2">
          {I18n.t("courses.settings.delete_course")}
        </Button>
        <Button onClick={handleSave}>{I18n.t("courses.settings.save_settings")}</Button>
      </div>
    </div>
  )
}
