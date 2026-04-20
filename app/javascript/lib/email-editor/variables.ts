export type EmailVariableCategory = "recipient" | "sender" | "system"

export interface EmailVariableDefinition {
  key: string
  label: string
  description: string
  category: EmailVariableCategory
  aliases?: string[]
}

export interface EmailVariableRecipientSource {
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  country?: string | null
}

export interface EmailVariableSenderSource {
  display_name?: string | null
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  email?: string | null
}

export type EmailVariableMap = Record<string, string>

const defaultRecipient = {
  name: "Camila Rojas",
  first_name: "Camila",
  last_name: "Rojas",
  email: "camila@example.com",
  country: "Chile",
}

export const emailVariableDefinitions: EmailVariableDefinition[] = [
  {
    key: "name",
    label: "Nombre del destinatario",
    description: "Nombre completo del usuario o contacto que recibirá el correo.",
    category: "recipient",
    aliases: ["recipient_name", "full_name"],
  },
  {
    key: "first_name",
    label: "Nombre",
    description: "Primer nombre del destinatario.",
    category: "recipient",
    aliases: ["recipient_first_name"],
  },
  {
    key: "last_name",
    label: "Apellido",
    description: "Apellido del destinatario.",
    category: "recipient",
    aliases: ["recipient_last_name"],
  },
  {
    key: "email",
    label: "Email del destinatario",
    description: "Correo del usuario o contacto.",
    category: "recipient",
    aliases: ["recipient_email"],
  },
  {
    key: "country",
    label: "País del destinatario",
    description: "País asociado al contacto cuando exista.",
    category: "recipient",
    aliases: ["recipient_country"],
  },
  {
    key: "sender_name",
    label: "Nombre del remitente",
    description: "Nombre visible de la cuenta que envía el correo.",
    category: "sender",
    aliases: ["sender_display_name", "account_name"],
  },
  {
    key: "sender_first_name",
    label: "Nombre del remitente",
    description: "Primer nombre del remitente, si existe.",
    category: "sender",
  },
  {
    key: "sender_last_name",
    label: "Apellido del remitente",
    description: "Apellido del remitente, si existe.",
    category: "sender",
  },
  {
    key: "sender_username",
    label: "Username del remitente",
    description: "Username de la cuenta que envía.",
    category: "sender",
  },
  {
    key: "sender_email",
    label: "Email del remitente",
    description: "Correo de la cuenta que envía.",
    category: "sender",
  },
  {
    key: "app_name",
    label: "Nombre de la app",
    description: "Nombre de la aplicación configurada en el entorno.",
    category: "system",
  },
]

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function titleizePart(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : ""
}

function deriveRecipientFromEmail(email?: string | null) {
  if (!email) return defaultRecipient

  const localPart = email.split("@")[0] || ""
  const parts = localPart
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const firstName = titleizePart(parts[0] || "Invitado")
  const lastName = parts.length > 1 ? parts.slice(1).map(titleizePart).join(" ") : ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()

  return {
    name: fullName || defaultRecipient.name,
    first_name: firstName || defaultRecipient.first_name,
    last_name: lastName,
    email,
    country: defaultRecipient.country,
  }
}

function aliasEntries() {
  return emailVariableDefinitions.flatMap((definition) => [
    [definition.key, definition.key],
    ...(definition.aliases || []).map((alias) => [alias, definition.key]),
  ])
}

const emailVariableAliases = new Map<string, string>(aliasEntries())

export function buildEmailVariableMap({
  sender,
  recipient,
  recipientEmail,
  appName,
}: {
  sender?: EmailVariableSenderSource | null
  recipient?: EmailVariableRecipientSource | null
  recipientEmail?: string | null
  appName?: string | null
} = {}): EmailVariableMap {
  const recipientDefaults = deriveRecipientFromEmail(recipient?.email || recipientEmail)
  const recipientName = recipient?.name || [recipient?.first_name, recipient?.last_name].filter(Boolean).join(" ").trim() || recipientDefaults.name
  const senderName = sender?.display_name || sender?.full_name || sender?.username || "Rauversion"

  return {
    name: recipientName || "",
    first_name: recipient?.first_name || recipientDefaults.first_name || "",
    last_name: recipient?.last_name || recipientDefaults.last_name || "",
    email: recipient?.email || recipientEmail || recipientDefaults.email || "",
    country: recipient?.country || recipientDefaults.country || "",
    sender_name: senderName || "",
    sender_first_name: sender?.first_name || "",
    sender_last_name: sender?.last_name || "",
    sender_username: sender?.username || "",
    sender_email: sender?.email || "",
    app_name: appName || "Rauversion",
  }
}

export function resolveEmailTemplate(
  value: string,
  variables?: EmailVariableMap,
  options: {
    escapeHtmlValues?: boolean
  } = {}
) {
  if (!value || !variables) return value

  return value.replace(/{{\s*([\w.]+)\s*}}/g, (match, rawKey: string) => {
    const normalizedKey = emailVariableAliases.get(rawKey)
    if (!normalizedKey) return match

    const resolved = variables[normalizedKey] ?? ""
    return options.escapeHtmlValues ? escapeHtml(resolved) : resolved
  })
}

export function getEmailVariableExamples(variables: EmailVariableMap) {
  return emailVariableDefinitions.map((definition) => ({
    ...definition,
    exampleValue: variables[definition.key] ?? "",
  }))
}
