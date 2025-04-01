import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useThemeStore } from '@/stores/theme'
import Select from "react-select"
import selectTheme from "@/components/ui/selectTheme"
import I18n from 'stores/locales'

export default function MetadataForm({ control }) {
  const { isDarkMode } = useThemeStore()

  return (
    <div className="space-y-4">
      <div>
        <Label>{I18n.t('shared.forms.metadata.buy_link')}</Label>
        <Controller
          name="buy_link"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.buy_link_title')}</Label>
        <Controller
          name="buy_link_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.record_label')}</Label>
        <Controller
          name="record_label"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.isrc')}</Label>
        <Controller
          name="isrc"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.composer')}</Label>
        <Controller
          name="composer"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.release_title')}</Label>
        <Controller
          name="release_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.album_title')}</Label>
        <Controller
          name="album_title"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.publisher')}</Label>
        <Controller
          name="publisher"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.artist')}</Label>
        <Controller
          name="artist"
          control={control}
          render={({ field }) => (
            <Input {...field} />
          )}
        />
      </div>

      <div>
        <Label>{I18n.t('shared.forms.metadata.genre')}</Label>
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
