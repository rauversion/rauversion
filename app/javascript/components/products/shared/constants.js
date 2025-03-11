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

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

export const MUSIC_FORMATS = [
  { value: 'vinyl', label: I18n.t('music.index.format.vinyl') },
  { value: 'cassette', label: I18n.t('music.index.format.cassette') },
  { value: 'cd', label: I18n.t('music.index.format.cd') },
  { value: 'blue_ray', label: I18n.t('music.index.format.blue_ray') },
  { value: 'digital', label: I18n.t('music.index.format.digital') },
  { value: 'other', label: I18n.t('music.index.format.other') }
]


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


export const ACCESSORY_CATEGORIES = [
  { value: 'cables', label: 'Cables' },
  { value: 'cases', label: 'Cases' },
  { value: 'stands', label: 'Stands' },
  { value: 'other', label: 'Other' }
]