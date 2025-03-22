
import React from 'react'
import { Disc, Music, Coffee, Sticker, 
  Package, Cable, Box, Layers, Wrench, Shirt } from 'lucide-react'

export const PRODUCT_TYPES = [
  {
    type: 'music',
    color: 'purple',
    iconClass: 'music'
  },
  {
    type: 'gear',
    color: 'blue',
    iconClass: 'gear'
  },
  {
    type: 'service',
    color: 'emerald',
    iconClass: 'service'
  },
  {
    type: 'merch',
    color: 'pink',
    iconClass: 'merch'
  },
  /*{
    type: 'accessory',
    color: 'amber',
    iconClass: 'accessory'
  },*/
]

export const GEAR_CATEGORIES = [
  { value: 'instrument', label: 'Instrument' },
  { value: 'audio_gear', label: 'Audio Gear' },
  { value: 'dj_gear', label: 'DJ Gear' }
]

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'sold_out', label: 'Sold out' }
]

export const MUSIC_FORMATS = [
  { value: 'vinyl', label: I18n.t('products.music.formats.vinyl') },
  { value: 'cassette', label: I18n.t('products.music.formats.cassette') },
  { value: 'cd', label: I18n.t('products.music.formats.cd') },
  { value: 'blue_ray', label: I18n.t('products.music.formats.blue_ray') },
  { value: 'digital', label: I18n.t('products.music.formats.digital') },
  { value: 'other', label: I18n.t('products.music.formats.other') }
]

export const FORMAT_ICONS = {
  vinyl: <Disc className="h-4 w-4" />,
  cassette: <Music className="h-4 w-4" />,
  cd: <Disc className="h-4 w-4" />
}

export const FORMAT_LABELS = {
  vinyl: I18n.t('products.music.formats.vinyl'),
  cassette: I18n.t('products.music.formats.cassette'),
  cd: I18n.t('products.music.formats.cd')
}

export const CONDITIONS = {
  new: I18n.t('products.conditions.new'),
  like_new: I18n.t('products.conditions.like_new'),
  excellent: I18n.t('products.conditions.excellent'),
  very_good: I18n.t('products.conditions.very_good'),
  good: I18n.t('products.conditions.good'),
  fair: I18n.t('products.conditions.fair'),
  poor: I18n.t('products.conditions.poor')
}


export const SERVICE_TYPES = [
  /*{ value: 'lessons', label: 'Lessons' },
  { value: 'classes', label: 'Classes' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'production', label: 'Production' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' }*/

  { value: 'coaching', label: 'coaching'} ,
  { value: 'feedback', label: 'feedback'} ,
  { value: 'classes', label: 'classes'} ,
  { value: 'other', label: 'other'} ,
  { value: 'mastering', label: 'mastering'} ,
  { value: 'mixing', label: 'mixing'} ,
  { value: 'production', label: 'production'} ,
  { value: 'recording', label: 'recording'} ,
  { value: 'songwriting', label: 'songwriting'} ,
  { value: 'sound_design', label: 'sound_design'} ,
  { value: 'voice_over', label: 'voice_over'} 
]

export const DELIVERY_METHODS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online', label: 'Online' },
  { value: 'both', label: 'Hybrid' }
]

export const CATEGORY_ICONS = {
  't-shirts': <Shirt className="h-4 w-4" />,
  'hoodies': <Shirt className="h-4 w-4" />,
  'mugs': <Coffee className="h-4 w-4" />,
  'stickers': <Sticker className="h-4 w-4" />,
  'other': <Package className="h-4 w-4" />
}

export const CATEGORY_LABELS = {
  't-shirts': I18n.t('products.merch.categories.t_shirts'),
  'hoodies': I18n.t('products.merch.categories.hoodies'),
  'mugs': I18n.t('products.merch.categories.mugs'),
  'stickers': I18n.t('products.merch.categories.stickers'),
  'other': I18n.t('products.merch.categories.other')
}


export const ACCESSORY_CATEGORIES = [
  { value: 'cables', label: 'Cables' },
  { value: 'cases', label: 'Cases' },
  { value: 'stands', label: 'Stands' },
  { value: 'other', label: 'Other' }
]

export const ACCESORY_ICONS = {
  'accessories': <Wrench className="h-4 w-4" />,
  'cables': <Cable className="h-4 w-4" />,
  'cases': <Box className="h-4 w-4" />,
  'stands': <Layers className="h-4 w-4" />,
  'other': <Package className="h-4 w-4" />
}

export const ACCESSORY_LABELS = {
  'accessories': I18n.t('products.accessory.categories.accessories'),
  'cables': I18n.t('products.accessory.categories.cables'),
  'cases': I18n.t('products.accessory.categories.cases'),
  'stands': I18n.t('products.accessory.categories.stands'),
  'other': I18n.t('products.accessory.categories.other')
}