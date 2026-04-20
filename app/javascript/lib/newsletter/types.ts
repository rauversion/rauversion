export type NewsletterAudienceSourceType =
  | "contact_list"
  | "followers"
  | "event_attendees"
  | "all_my_event_attendees"

export interface NewsletterContactListRecord {
  id: string
  name: string
  contactsCount: number
  updatedAt: string
  createdAt: string
}

export interface NewsletterContactRecord {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  country: string
  dni: string
  resolvedName: string
  createdAt: string
}

export interface NewsletterAudienceSourceInput {
  id?: string
  sourceType: NewsletterAudienceSourceType
  sourceSettings: {
    contactListId?: string
    eventId?: string
  }
  label?: string
}

export interface NewsletterAudienceRecord {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  sources: NewsletterAudienceSourceInput[]
}

export type NewsletterBroadcastStatus =
  | "draft"
  | "queued"
  | "sending"
  | "completed"
  | "completed_with_errors"
  | "failed"

export interface NewsletterBroadcastRecipientRecord {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  country: string
  username: string
  displayName: string
  eventTitles: string[]
  ticketTitles: string[]
  sourceLabels: string[]
  sourceTypes: NewsletterAudienceSourceType[]
  status: "pending" | "sent" | "failed"
  errorMessage: string
  sentAt: string
  failedAt: string
}

export interface NewsletterBroadcastRecord {
  id: string
  name: string
  status: NewsletterBroadcastStatus
  audienceId: string
  audienceName: string
  emailTemplateId: string
  emailTemplateName: string
  subjectTemplate: string
  totalRecipients: number
  sentRecipients: number
  failedRecipients: number
  pendingRecipients: number
  lastError: string
  startedAt: string
  completedAt: string
  failedAt: string
  updatedAt: string
  createdAt: string
  recipients: NewsletterBroadcastRecipientRecord[]
}

export interface NewsletterSourceTypeOption {
  value: NewsletterAudienceSourceType
  label: string
}

export interface NewsletterEventOption {
  id: string
  title: string
  slug: string
  startsAt: string
}

export interface NewsletterSourceOptions {
  sourceTypes: NewsletterSourceTypeOption[]
  contactLists: NewsletterContactListRecord[]
  events: NewsletterEventOption[]
  followerCount: number
}

export interface NewsletterPreviewRecipient {
  email: string
  name: string
  firstName: string
  lastName: string
  country: string
  username: string
  displayName: string
  eventTitles: string[]
  ticketTitles: string[]
  sourceTypes: NewsletterAudienceSourceType[]
  sourceLabels: string[]
}

export interface NewsletterPreviewSourceSummary {
  key: string
  sourceType: NewsletterAudienceSourceType
  label: string
  rawCount: number
  uniqueCount: number
}

export interface NewsletterAudiencePreview {
  recipients: NewsletterPreviewRecipient[]
  rawRecipientsCount: number
  uniqueRecipientsCount: number
  deduplicatedCount: number
  sourceSummaries: NewsletterPreviewSourceSummary[]
  warnings: string[]
}
