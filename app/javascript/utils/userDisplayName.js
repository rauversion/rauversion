function fullNameFromParts(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
}

export function getUserDisplayName(user) {
  if (!user) return ""

  return (
    user.display_name?.trim() ||
    user.username?.trim() ||
    fullNameFromParts(user) ||
    user.full_name?.trim() ||
    user.name?.trim() ||
    ""
  )
}

export function getUserShortName(user) {
  return user?.username?.trim() || getUserDisplayName(user)
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user)

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
