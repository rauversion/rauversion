import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"
import { useThemeStore } from '@/stores/theme'
import { permissionDefinitions } from "@/lib/constants"

export default function PermissionsForm({ control, watch }) {
  const { isDarkMode } = useThemeStore()
  const watchCopyright = watch('copyright')
  const watchPermissions = permissionDefinitions.reduce((acc, permission) => {
    acc[permission.name] = watch(permission.name)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>License</Label>
        <Controller
          name="copyright"
          control={control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              value={field.value}
              onValueChange={field.onChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all-rights" id="all-rights" />
                <Label htmlFor="all-rights">All rights reserved</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="common" id="common" />
                <Label htmlFor="common">Creative commons</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      {watchCopyright === "common" && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="attribution"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="attribution" className="text-sm">
              Allow others to copy, distribute, display and perform your copyrighted work but only if they give credit the way you request.
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="noncommercial"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label>Non-Commercial</Label>
          </div>

          <div className="space-y-2">
            <Label>Usage Rights</Label>
            <Controller
              name="copies"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non_derivative_works" id="non_derivative_works" />
                    <div className="space-y-1">
                      <Label htmlFor="non_derivative_works">Non derivative works</Label>
                      <p className="text-sm text-gray-500">
                        Allow others to copy, distribute, display and perform only verbatim copies of your work, not derivative works based upon it.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="share_alike" id="share_alike" />
                    <div className="space-y-1">
                      <Label htmlFor="share_alike">Share Alike</Label>
                      <p className="text-sm text-gray-500">
                        Allow others to distribute derivative works only under a license identical to the license that governs your work.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </div>
      )}

      {permissionDefinitions.map((permission) => (
        <div key={permission.name} className="space-y-2 flex">
          <div className="flex items-center space-x-2">
            <Controller
              name={permission.name}
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label>{permission.label}</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-6">
            {watchPermissions[permission.name] ? permission.checkedHint : permission.uncheckedHint}
          </p>
        </div>
      ))}
    </div>
  )
}
