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
        <h3 className="text-lg font-medium mb-4">Course Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="published">Published</Label>
              <p className="text-sm text-muted-foreground">Make this course available to students</p>
            </div>
            <Switch
              id="published"
              checked={localSettings.published}
              onCheckedChange={(checked) => handleToggleChange("published", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Featured Course</Label>
              <p className="text-sm text-muted-foreground">Show this course on the homepage</p>
            </div>
            <Switch
              id="featured"
              checked={localSettings.featured}
              onCheckedChange={(checked) => handleToggleChange("featured", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="certificate">Certificate</Label>
              <p className="text-sm text-muted-foreground">Enable course completion certificate</p>
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
        <h3 className="text-lg font-medium mb-4">Enrollment Settings</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="enrollment-type">Enrollment Type</Label>
            <Select
              defaultValue={localSettings.enrollment_type || "open"}
              onValueChange={(value) => handleFieldChange("enrollment_type", value)}
            >
              <SelectTrigger id="enrollment-type">
                <SelectValue placeholder="Select enrollment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open Enrollment</SelectItem>
                <SelectItem value="invite">Invite Only</SelectItem>
                {/*<SelectItem value="approval">Requires Approval</SelectItem>*/}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max-students">Maximum Students (0 for unlimited)</Label>
            <Input
              id="max-students"
              type="number"
              placeholder="0"
              value={localSettings.max_students || "0"}
              onChange={(e) => handleFieldChange("max_students", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              placeholder="SEO optimized title"
              value={localSettings.seo_title || ""}
              onChange={(e) => handleFieldChange("seo_title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seo-description">SEO Description</Label>
            <Textarea
              id="seo-description"
              placeholder="Brief description for search engines"
              value={localSettings.seo_description || ""}
              onChange={(e) => handleFieldChange("seo_description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seo-keywords">SEO Keywords (comma separated)</Label>
            <Input
              id="seo-keywords"
              placeholder="music, guitar, lessons"
              value={localSettings.seoKeywords || ""}
              onChange={(e) => handleFieldChange("seoKeywords", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="destructive" className="mr-2">
          Delete Course
        </Button>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}
