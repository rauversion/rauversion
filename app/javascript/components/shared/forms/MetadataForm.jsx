import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useThemeStore } from '@/stores/theme'
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"

export default function MetadataForm({ control }) {
  const { isDarkMode } = useThemeStore()

  return (
    <div className="space-y-4">
      <div>
        <Label>Buy Link</Label>
        <Controller
          name="buy_link"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Buy Link Title</Label>
        <Controller
          name="buy_link_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Record Label</Label>
        <Controller
          name="record_label"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>ISRC</Label>
        <Controller
          name="isrc"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Composer</Label>
        <Controller
          name="composer"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Release Title</Label>
        <Controller
          name="release_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Album Title</Label>
        <Controller
          name="album_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Publisher</Label>
        <Controller
          name="publisher"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Artist</Label>
        <Controller
          name="artist"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>Genre</Label>
        <Controller
          name="genre"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>
    </div>
  )
}
