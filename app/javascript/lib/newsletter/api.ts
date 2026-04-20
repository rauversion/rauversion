import { destroy, get, post, put } from "@rails/request.js"

import type {
  NewsletterAudiencePreview,
  NewsletterAudienceRecord,
  NewsletterBroadcastRecipientRecord,
  NewsletterBroadcastRecord,
  NewsletterAudienceSourceInput,
  NewsletterContactListRecord,
  NewsletterContactRecord,
  NewsletterEventOption,
  NewsletterPreviewRecipient,
  NewsletterPreviewSourceSummary,
  NewsletterSourceOptions,
  NewsletterSourceTypeOption,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : 0
}

function normalizeContactList(value: unknown): NewsletterContactListRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid contact list payload")
  }

  return {
    id: readString(value.id),
    name: readString(value.name),
    contactsCount: readNumber(value.contacts_count ?? value.contactsCount),
    updatedAt: readString(value.updated_at ?? value.updatedAt),
    createdAt: readString(value.created_at ?? value.createdAt),
  }
}

function normalizeContact(value: unknown): NewsletterContactRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid contact payload")
  }

  return {
    id: readString(value.id),
    email: readString(value.email),
    name: readString(value.name),
    firstName: readString(value.first_name ?? value.firstName),
    lastName: readString(value.last_name ?? value.lastName),
    country: readString(value.country),
    dni: readString(value.dni),
    resolvedName: readString(value.resolved_name ?? value.resolvedName),
    createdAt: readString(value.created_at ?? value.createdAt),
  }
}

function normalizeAudienceSource(value: unknown): NewsletterAudienceSourceInput {
  if (!isRecord(value)) {
    throw new Error("Invalid audience source payload")
  }

  const rawSettings = isRecord(value.source_settings ?? value.sourceSettings)
    ? (value.source_settings ?? value.sourceSettings) as Record<string, unknown>
    : {}

  return {
    id: readString(value.id),
    sourceType: readString(value.source_type ?? value.sourceType) as NewsletterAudienceSourceInput["sourceType"],
    sourceSettings: {
      contactListId: readString(rawSettings.contact_list_id ?? rawSettings.contactListId),
      eventId: readString(rawSettings.event_id ?? rawSettings.eventId),
    },
    label: readString(value.label),
  }
}

function normalizeAudience(value: unknown): NewsletterAudienceRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid audience payload")
  }

  const sources = Array.isArray(value.sources) ? value.sources : []

  return {
    id: readString(value.id),
    name: readString(value.name),
    updatedAt: readString(value.updated_at ?? value.updatedAt),
    createdAt: readString(value.created_at ?? value.createdAt),
    sources: sources.map((source) => normalizeAudienceSource(source)),
  }
}

function normalizeBroadcastRecipient(value: unknown): NewsletterBroadcastRecipientRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid broadcast recipient payload")
  }

  return {
    id: readString(value.id),
    email: readString(value.email),
    name: readString(value.name),
    firstName: readString(value.first_name ?? value.firstName),
    lastName: readString(value.last_name ?? value.lastName),
    country: readString(value.country),
    username: readString(value.username),
    displayName: readString(value.display_name ?? value.displayName),
    eventTitles: Array.isArray(value.event_titles ?? value.eventTitles) ? (value.event_titles ?? value.eventTitles).map((item) => String(item)) : [],
    ticketTitles: Array.isArray(value.ticket_titles ?? value.ticketTitles) ? (value.ticket_titles ?? value.ticketTitles).map((item) => String(item)) : [],
    sourceLabels: Array.isArray(value.source_labels ?? value.sourceLabels) ? (value.source_labels ?? value.sourceLabels).map((item) => String(item)) : [],
    sourceTypes: Array.isArray(value.source_types ?? value.sourceTypes) ? (value.source_types ?? value.sourceTypes).map((item) => String(item) as NewsletterBroadcastRecipientRecord["sourceTypes"][number]) : [],
    status: readString(value.status) as NewsletterBroadcastRecipientRecord["status"],
    errorMessage: readString(value.error_message ?? value.errorMessage),
    sentAt: readString(value.sent_at ?? value.sentAt),
    failedAt: readString(value.failed_at ?? value.failedAt),
  }
}

function normalizeBroadcast(value: unknown): NewsletterBroadcastRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid broadcast payload")
  }

  const recipients = Array.isArray(value.recipients) ? value.recipients : []

  return {
    id: readString(value.id),
    name: readString(value.name),
    status: readString(value.status) as NewsletterBroadcastRecord["status"],
    audienceId: readString(value.audience_id ?? value.audienceId),
    audienceName: readString(value.audience_name ?? value.audienceName),
    emailTemplateId: readString(value.email_template_id ?? value.emailTemplateId),
    emailTemplateName: readString(value.email_template_name ?? value.emailTemplateName),
    subjectTemplate: readString(value.subject_template ?? value.subjectTemplate),
    totalRecipients: readNumber(value.total_recipients ?? value.totalRecipients),
    sentRecipients: readNumber(value.sent_recipients ?? value.sentRecipients),
    failedRecipients: readNumber(value.failed_recipients ?? value.failedRecipients),
    pendingRecipients: readNumber(value.pending_recipients ?? value.pendingRecipients),
    lastError: readString(value.last_error ?? value.lastError),
    startedAt: readString(value.started_at ?? value.startedAt),
    completedAt: readString(value.completed_at ?? value.completedAt),
    failedAt: readString(value.failed_at ?? value.failedAt),
    updatedAt: readString(value.updated_at ?? value.updatedAt),
    createdAt: readString(value.created_at ?? value.createdAt),
    recipients: recipients.map((recipient) => normalizeBroadcastRecipient(recipient)),
  }
}

function normalizeSourceTypeOption(value: unknown): NewsletterSourceTypeOption {
  if (!isRecord(value)) {
    throw new Error("Invalid source type option payload")
  }

  return {
    value: readString(value.value) as NewsletterSourceTypeOption["value"],
    label: readString(value.label),
  }
}

function normalizeEventOption(value: unknown): NewsletterEventOption {
  if (!isRecord(value)) {
    throw new Error("Invalid event option payload")
  }

  return {
    id: readString(value.id),
    title: readString(value.title),
    slug: readString(value.slug),
    startsAt: readString(value.starts_at ?? value.startsAt),
  }
}

function normalizePreviewRecipient(value: unknown): NewsletterPreviewRecipient {
  if (!isRecord(value)) {
    throw new Error("Invalid preview recipient payload")
  }

  return {
    email: readString(value.email),
    name: readString(value.name),
    firstName: readString(value.first_name ?? value.firstName),
    lastName: readString(value.last_name ?? value.lastName),
    country: readString(value.country),
    username: readString(value.username),
    displayName: readString(value.display_name ?? value.displayName),
    eventTitles: Array.isArray(value.event_titles ?? value.eventTitles) ? (value.event_titles ?? value.eventTitles).map((item) => String(item)) : [],
    ticketTitles: Array.isArray(value.ticket_titles ?? value.ticketTitles) ? (value.ticket_titles ?? value.ticketTitles).map((item) => String(item)) : [],
    sourceTypes: Array.isArray(value.source_types ?? value.sourceTypes) ? (value.source_types ?? value.sourceTypes).map((item) => String(item) as NewsletterPreviewRecipient["sourceTypes"][number]) : [],
    sourceLabels: Array.isArray(value.source_labels ?? value.sourceLabels) ? (value.source_labels ?? value.sourceLabels).map((item) => String(item)) : [],
  }
}

function normalizePreviewSourceSummary(value: unknown): NewsletterPreviewSourceSummary {
  if (!isRecord(value)) {
    throw new Error("Invalid preview summary payload")
  }

  return {
    key: readString(value.key),
    sourceType: readString(value.source_type ?? value.sourceType) as NewsletterPreviewSourceSummary["sourceType"],
    label: readString(value.label),
    rawCount: readNumber(value.raw_count ?? value.rawCount),
    uniqueCount: readNumber(value.unique_count ?? value.uniqueCount),
  }
}

function normalizePreview(value: unknown): NewsletterAudiencePreview {
  if (!isRecord(value)) {
    throw new Error("Invalid preview payload")
  }

  return {
    recipients: Array.isArray(value.recipients) ? value.recipients.map((recipient) => normalizePreviewRecipient(recipient)) : [],
    rawRecipientsCount: readNumber(value.raw_recipients_count ?? value.rawRecipientsCount),
    uniqueRecipientsCount: readNumber(value.unique_recipients_count ?? value.uniqueRecipientsCount),
    deduplicatedCount: readNumber(value.deduplicated_count ?? value.deduplicatedCount),
    sourceSummaries: Array.isArray(value.source_summaries ?? value.sourceSummaries) ? (value.source_summaries ?? value.sourceSummaries).map((summary) => normalizePreviewSourceSummary(summary)) : [],
    warnings: Array.isArray(value.warnings) ? value.warnings.map((warning) => String(warning)) : [],
  }
}

function serializeAudienceSources(sources: NewsletterAudienceSourceInput[]) {
  return sources.map((source) => ({
    id: source.id,
    source_type: source.sourceType,
    source_settings: {
      contact_list_id: source.sourceSettings.contactListId,
      event_id: source.sourceSettings.eventId,
    },
  }))
}

async function parseErrors(response: Awaited<ReturnType<typeof get>>) {
  const payload = await response.json

  if (isRecord(payload) && Array.isArray(payload.errors)) {
    return payload.errors.map((error) => String(error)).join(", ")
  }

  return "No se pudo completar la operación"
}

export async function fetchNewsletterContactLists(): Promise<NewsletterContactListRecord[]> {
  const response = await get("/newsletter/contact-lists.json", { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  const contactLists = isRecord(payload) && Array.isArray(payload.contact_lists) ? payload.contact_lists : []
  return contactLists.map((contactList) => normalizeContactList(contactList))
}

export async function createNewsletterContactList(name: string): Promise<NewsletterContactListRecord> {
  const response = await post("/newsletter/contact-lists.json", {
    body: JSON.stringify({ contact_list: { name } }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeContactList(isRecord(payload) ? payload.contact_list : null)
}

export async function updateNewsletterContactList(id: string, name: string): Promise<NewsletterContactListRecord> {
  const response = await put(`/newsletter/contact-lists/${id}.json`, {
    body: JSON.stringify({ contact_list: { name } }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeContactList(isRecord(payload) ? payload.contact_list : null)
}

export async function destroyNewsletterContactList(id: string): Promise<void> {
  const response = await destroy(`/newsletter/contact-lists/${id}.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }
}

export async function importNewsletterContacts(id: string, file: File): Promise<{ imported: number; total: number; errors: string[]; contactList: NewsletterContactListRecord }> {
  const body = new FormData()
  body.append("file", file)

  const response = await post(`/newsletter/contact-lists/${id}/import.json`, {
    body,
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json

  return {
    imported: isRecord(payload) ? readNumber(payload.imported) : 0,
    total: isRecord(payload) ? readNumber(payload.total) : 0,
    errors: isRecord(payload) && Array.isArray(payload.errors) ? payload.errors.map((error) => String(error)) : [],
    contactList: normalizeContactList(isRecord(payload) ? payload.contact_list : null),
  }
}

export async function fetchNewsletterContacts(contactListId: string): Promise<NewsletterContactRecord[]> {
  const response = await get(`/newsletter/contact-lists/${contactListId}/contacts.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  const contacts = isRecord(payload) && Array.isArray(payload.contacts) ? payload.contacts : []
  return contacts.map((contact) => normalizeContact(contact))
}

interface SaveNewsletterContactInput {
  email: string
  name: string
  firstName: string
  lastName: string
  country: string
  dni: string
}

export async function createNewsletterContact(contactListId: string, input: SaveNewsletterContactInput): Promise<NewsletterContactRecord> {
  const response = await post(`/newsletter/contact-lists/${contactListId}/contacts.json`, {
    body: JSON.stringify({
      contact: {
        email: input.email,
        name: input.name,
        first_name: input.firstName,
        last_name: input.lastName,
        country: input.country,
        dni: input.dni,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeContact(isRecord(payload) ? payload.contact : null)
}

export async function destroyNewsletterContact(contactListId: string, contactId: string): Promise<void> {
  const response = await destroy(`/newsletter/contact-lists/${contactListId}/contacts/${contactId}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }
}

export async function fetchNewsletterAudiences(): Promise<NewsletterAudienceRecord[]> {
  const response = await get("/newsletter/audiences.json", { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  const audiences = isRecord(payload) && Array.isArray(payload.audiences) ? payload.audiences : []
  return audiences.map((audience) => normalizeAudience(audience))
}

export async function createNewsletterAudience(input: { name: string; sources: NewsletterAudienceSourceInput[] }): Promise<NewsletterAudienceRecord> {
  const response = await post("/newsletter/audiences.json", {
    body: JSON.stringify({
      audience: {
        name: input.name,
        sources: serializeAudienceSources(input.sources),
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeAudience(isRecord(payload) ? payload.audience : null)
}

export async function updateNewsletterAudience(id: string, input: { name: string; sources: NewsletterAudienceSourceInput[] }): Promise<NewsletterAudienceRecord> {
  const response = await put(`/newsletter/audiences/${id}.json`, {
    body: JSON.stringify({
      audience: {
        name: input.name,
        sources: serializeAudienceSources(input.sources),
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeAudience(isRecord(payload) ? payload.audience : null)
}

export async function destroyNewsletterAudience(id: string): Promise<void> {
  const response = await destroy(`/newsletter/audiences/${id}.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }
}

export async function fetchNewsletterSourceOptions(): Promise<NewsletterSourceOptions> {
  const response = await get("/newsletter/audiences/source_options.json", { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json

  return {
    sourceTypes: isRecord(payload) && Array.isArray(payload.source_types) ? payload.source_types.map((option) => normalizeSourceTypeOption(option)) : [],
    contactLists: isRecord(payload) && Array.isArray(payload.contact_lists) ? payload.contact_lists.map((contactList) => normalizeContactList(contactList)) : [],
    events: isRecord(payload) && Array.isArray(payload.events) ? payload.events.map((event) => normalizeEventOption(event)) : [],
    followerCount: isRecord(payload) ? readNumber(payload.follower_count ?? payload.followerCount) : 0,
  }
}

export async function previewNewsletterAudience(sources: NewsletterAudienceSourceInput[]): Promise<NewsletterAudiencePreview> {
  const response = await post("/newsletter/audiences/preview.json", {
    body: JSON.stringify({ sources: serializeAudienceSources(sources) }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizePreview(isRecord(payload) ? payload.preview : null)
}

export async function fetchNewsletterBroadcasts(): Promise<NewsletterBroadcastRecord[]> {
  const response = await get("/newsletter/broadcasts.json", { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  const broadcasts = isRecord(payload) && Array.isArray(payload.broadcasts) ? payload.broadcasts : []
  return broadcasts.map((broadcast) => normalizeBroadcast(broadcast))
}

export async function fetchNewsletterBroadcast(id: string): Promise<NewsletterBroadcastRecord> {
  const response = await get(`/newsletter/broadcasts/${id}.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeBroadcast(isRecord(payload) ? payload.broadcast : null)
}

export async function createNewsletterBroadcast(name: string): Promise<NewsletterBroadcastRecord> {
  const response = await post("/newsletter/broadcasts.json", {
    body: JSON.stringify({ broadcast: { name } }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeBroadcast(isRecord(payload) ? payload.broadcast : null)
}

interface SaveNewsletterBroadcastInput {
  name: string
  audienceId?: string
  emailTemplateId?: string
}

export async function updateNewsletterBroadcast(id: string, input: SaveNewsletterBroadcastInput): Promise<NewsletterBroadcastRecord> {
  const response = await put(`/newsletter/broadcasts/${id}.json`, {
    body: JSON.stringify({
      broadcast: {
        name: input.name,
        audience_id: input.audienceId,
        email_template_id: input.emailTemplateId,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeBroadcast(isRecord(payload) ? payload.broadcast : null)
}

export async function destroyNewsletterBroadcast(id: string): Promise<void> {
  const response = await destroy(`/newsletter/broadcasts/${id}.json`, { responseKind: "json" })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }
}

interface SendNewsletterBroadcastInput extends SaveNewsletterBroadcastInput {
  subjectTemplate: string
  htmlTemplate: string
}

export async function sendNewsletterBroadcast(id: string, input: SendNewsletterBroadcastInput): Promise<NewsletterBroadcastRecord> {
  const response = await post(`/newsletter/broadcasts/${id}/send_now.json`, {
    body: JSON.stringify({
      broadcast: {
        name: input.name,
        audience_id: input.audienceId,
        email_template_id: input.emailTemplateId,
        subject_template: input.subjectTemplate,
        html_template: input.htmlTemplate,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error(await parseErrors(response))
  }

  const payload = await response.json
  return normalizeBroadcast(isRecord(payload) ? payload.broadcast : null)
}
