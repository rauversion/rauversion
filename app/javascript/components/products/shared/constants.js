
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

export const STRIPE_CONNECT_COUNTRIES = [
  { "name": "Argentina", "iso": "AR" },
  { "name": "Bolivia", "iso": "BO" },
  { "name": "Chile", "iso": "CL" },
  { "name": "Colombia", "iso": "CO" },
  { "name": "México", "iso": "MX" },
  { "name": "Ecuador", "iso": "EC" },
  { "name": "Costa Rica", "iso": "CR" },
  { "name": "Uruguay", "iso": "UY" },

  { "name": "Albania", "iso": "AL" },
  { "name": "Antigua y Barbuda", "iso": "AG" },
  { "name": "Armenia", "iso": "AM" },
  { "name": "Australia", "iso": "AU" },
  { "name": "Austria", "iso": "AT" },
  { "name": "Bahamas", "iso": "BS" },
  { "name": "Baréin", "iso": "BH" },
  { "name": "Bélgica", "iso": "BE" },
  { "name": "Benín", "iso": "BJ" },
  { "name": "Bosnia y Herzegovina", "iso": "BA" },
  { "name": "Botsuana", "iso": "BW" },
  { "name": "Brunéi", "iso": "BN" },
  { "name": "Bulgaria", "iso": "BG" },
  { "name": "Camboya", "iso": "KH" },
  { "name": "Canadá", "iso": "CA" },
  { "name": "Costa de Marfil", "iso": "CI" },
  { "name": "Chipre", "iso": "CY" },
  { "name": "República Checa", "iso": "CZ" },
  { "name": "Dinamarca", "iso": "DK" },
  { "name": "República Dominicana", "iso": "DO" },
  { "name": "Egipto", "iso": "EG" },
  { "name": "El Salvador", "iso": "SV" },
  { "name": "Estonia", "iso": "EE" },
  { "name": "Etiopía", "iso": "ET" },
  { "name": "Finlandia", "iso": "FI" },
  { "name": "Francia", "iso": "FR" },
  { "name": "Gambia", "iso": "GM" },
  { "name": "Alemania", "iso": "DE" },
  { "name": "Ghana", "iso": "GH" },
  { "name": "Grecia", "iso": "GR" },
  { "name": "Guatemala", "iso": "GT" },
  { "name": "Guayana", "iso": "GY" },
  { "name": "Hong Kong", "iso": "HK" },
  { "name": "Hungría", "iso": "HU" },
  { "name": "Islandia", "iso": "IS" },
  { "name": "Irlanda", "iso": "IE" },
  { "name": "Israel", "iso": "IL" },
  { "name": "Italia", "iso": "IT" },
  { "name": "Jamaica", "iso": "JM" },
  { "name": "Japón", "iso": "JP" },
  { "name": "Jordán", "iso": "JO" },
  { "name": "Kenia", "iso": "KE" },
  { "name": "Kuwait", "iso": "KW" },
  { "name": "Letonia", "iso": "LV" },
  { "name": "Lituania", "iso": "LT" },
  { "name": "Luxemburgo", "iso": "LU" },
  { "name": "RAE de Macao, China", "iso": "MO" },
  { "name": "Madagascar", "iso": "MG" },
  { "name": "Malta", "iso": "MT" },
  { "name": "Mauricio", "iso": "MU" },
  { "name": "Moldavia", "iso": "MD" },
  { "name": "Mónaco", "iso": "MC" },
  { "name": "Mongolia", "iso": "MN" },
  { "name": "Marruecos", "iso": "MA" },
  { "name": "Namibia", "iso": "NA" },
  { "name": "Países Bajos", "iso": "NL" },
  { "name": "Nueva Zelanda", "iso": "NZ" },
  { "name": "Nigeria", "iso": "NG" },
  { "name": "Macedonia del Norte", "iso": "MK" },
  { "name": "Noruega", "iso": "NO" },
  { "name": "Omán", "iso": "OM" },
  { "name": "Pakistán", "iso": "PK" },
  { "name": "Panamá", "iso": "PA" },
  { "name": "Paraguay", "iso": "PY" },
  { "name": "Perú", "iso": "PE" },
  { "name": "Filipinas", "iso": "PH" },
  { "name": "Polonia", "iso": "PL" },
  { "name": "Portugal", "iso": "PT" },
  { "name": "Katar", "iso": "QA" },
  { "name": "Rumania", "iso": "RO" },
  { "name": "Ruanda", "iso": "RW" },
  { "name": "Arabia Saudita", "iso": "SA" },
  { "name": "Senegal", "iso": "SN" },
  { "name": "Serbia", "iso": "RS" },
  { "name": "Singapur", "iso": "SG" },
  { "name": "Eslovaquia", "iso": "SK" },
  { "name": "Eslovenia", "iso": "SI" },
  { "name": "Sudáfrica", "iso": "ZA" },
  { "name": "Corea del Sur", "iso": "KR" },
  { "name": "España", "iso": "ES" },
  { "name": "Sri Lanka", "iso": "LK" },
  { "name": "Santa Lucía", "iso": "LC" },
  { "name": "Suecia", "iso": "SE" },
  { "name": "Suiza", "iso": "CH" },
  { "name": "Taiwán", "iso": "TW" },
  { "name": "Tanzania", "iso": "TZ" },
  { "name": "Tailandia", "iso": "TH" },
  { "name": "Trinidad y Tobago", "iso": "TT" },
  { "name": "Túnez", "iso": "TN" },
  { "name": "Turquía", "iso": "TR" },
  { "name": "Emiratos Árabes Unidos", "iso": "AE" },
  { "name": "Reino Unido", "iso": "GB" },
  { "name": "Estados Unidos", "iso": "US" },
  { "name": "Uzbekistán", "iso": "UZ" },
  { "name": "Vietnam", "iso": "VN" }
]