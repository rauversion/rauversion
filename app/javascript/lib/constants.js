export const Category = {
  Genres: [
    "Alternative Rock",
    "Ambient",
    "Classical",
    "Country",
    "Dance & EDM",
    "Dancehall",
    "Deep House",
    "Disco",
    "Drum & Bass",
    "Dubstep",
    "Electronic",
    "Folk & Singer-Songwriter",
    "Hip-hop & Rap",
    "House",
    "Indie",
    "Jazz & Blues",
    "Latin",
    "Metal",
    "Piano",
    "Pop",
    "R&B & Soul",
    "Reggae",
    "Reggaeton",
    "Rock",
    "Soundtrack",
    "Techno",
    "Trance",
    "Trap",
    "Triphop",
    "World",
    "UwUaracha",
    "Latin Tecno",
    "Latin Core",
    "Dark Disco",
    "FootWork",
    "IDM",
    "Downtempo"
  ]
}


export const permissionDefinitions = [
  {
    name: "direct_download",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be available for direct download in the original format it was uploaded.",
    uncheckedHint: "This track will not be available for direct download in the original format it was uploaded."
  },
  {
    name: "display_embed",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track's embedded-player code will be displayed publicly.",
    uncheckedHint: "This track's embedded-player code will only be displayed to you."
  },
  {
    name: "enable_comments",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Enable comments",
    uncheckedHint: "Comments disabled."
  },
  {
    name: "display_comments",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Display comments",
    uncheckedHint: "Don't display public comments."
  },
  {
    name: "display_stats",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "Display public stats",
    uncheckedHint: "Don't display public stats."
  },
  {
    name: "include_in_rss",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be included in your RSS feed if it is public.",
    uncheckedHint: "This track will not be included in your RSS feed."
  },
  {
    name: "offline_listening",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track can be played on devices without an internet connection.",
    uncheckedHint: "Playing this track will not be possible on devices without an internet connection."
  },
  {
    name: "enable_app_playblack",
    wrapperClass: "sm:col-span-2",
    type: "checkbox",
    checkedHint: "This track will be playable outside of Rauversion and its apps.",
    uncheckedHint: "This track will not be playable outside of Rauversion and its apps."
  }
]