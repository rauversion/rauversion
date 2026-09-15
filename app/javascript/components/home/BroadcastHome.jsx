import React from "react"
import { ArrowRight, ArrowUpRight, CalendarDays, Disc3, Radio } from "lucide-react"
import { Link } from "react-router-dom"
import I18n from "stores/locales"

function balancedHeadline(value) {
  const words = String(value || I18n.t("tenants.storefront.broadcast.fallback_tagline")).trim().split(/\s+/)
  if (words.length <= 3) return words

  const size = Math.ceil(words.length / 3)
  return [words.slice(0, size), words.slice(size, size * 2), words.slice(size * 2)]
    .filter((line) => line.length)
    .map((line) => line.join(" "))
}

function imageUrl(item) {
  return item?.cover_url?.large || item?.cover_url?.horizontal || item?.avatar_url?.large || null
}

function releaseUrl(release) {
  return release?.urls?.show || `/releases/${release?.slug || release?.id}`
}

function formatDate(value) {
  if (!value) return I18n.t("tenants.storefront.broadcast.date_tba")

  return new Intl.DateTimeFormat(I18n.locale === "es" ? "es-CL" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function Artwork({ item, alt = "" }) {
  const src = imageUrl(item)
  if (src) return <img src={src} alt={alt} />
  return <div className="broadcast-artwork-fallback" aria-hidden="true"><Disc3 /></div>
}

export default function BroadcastHome({ tenant, data }) {
  const releases = data.releases || []
  const events = data.events || []
  const posts = data.posts || []
  const artists = data.artists || []
  const featured = releases[0] || posts[0] || events[0]
  const featuredKind = releases[0] ? "release" : posts[0] ? "article" : "event"
  const featuredUrl = featuredKind === "release"
    ? releaseUrl(featured)
    : featuredKind === "article"
      ? `/articles/${featured?.slug}`
      : `/events/${featured?.slug}`
  const headline = balancedHeadline(tenant.settings.tagline)

  return (
    <main className="broadcast-home">
      <header className="broadcast-masthead">
        <Link to="/" className="broadcast-brand" aria-label={tenant.name}>
          {tenant.logo_url ? <img src={tenant.logo_url} alt="" /> : <Radio aria-hidden="true" />}
          <strong>{tenant.name}</strong>
          <span>/ SIGNAL</span>
        </Link>
        <nav aria-label={I18n.t("tenants.storefront.broadcast.navigation")}>
          <a href="#releases">{I18n.t("tenants.storefront.broadcast.releases")}</a>
          <a href="#events">{I18n.t("tenants.storefront.broadcast.events")}</a>
          <a href="#stories">{I18n.t("tenants.storefront.broadcast.stories")}</a>
          <Link to="/store">{I18n.t("tenants.storefront.broadcast.store")} <ArrowUpRight /></Link>
        </nav>
      </header>

      <section className="broadcast-hero">
        <div className="broadcast-editorial">
          <div className="broadcast-kicker">
            <span>{I18n.t("tenants.storefront.broadcast.network")}</span>
            <b>BRD–001</b>
          </div>
          <h1>
            {headline.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
          </h1>
          <div className="broadcast-summary">
            <p>{I18n.t("tenants.storefront.broadcast.description", { name: tenant.name })}</p>
            <Link to="/tracks">{I18n.t("tenants.storefront.broadcast.explore")} <ArrowRight /></Link>
          </div>
          <dl className="broadcast-metrics">
            <div><dt>{I18n.t("tenants.storefront.broadcast.releases")}</dt><dd>{releases.length}</dd></div>
            <div><dt>{I18n.t("tenants.storefront.broadcast.events")}</dt><dd>{events.length}</dd></div>
            <div><dt>{I18n.t("tenants.storefront.broadcast.artists")}</dt><dd>{artists.length}</dd></div>
          </dl>
        </div>

        <div className="broadcast-feature-shell">
          <Link to={featured ? featuredUrl : "/tracks"} className="broadcast-feature">
            <div className="broadcast-feature-head">
              <span>01 / {I18n.t(`tenants.storefront.broadcast.${featuredKind}`)}</span>
              <b>{I18n.t("tenants.storefront.broadcast.selected")}</b>
            </div>
            <div className="broadcast-feature-art">
              <Artwork item={featured} alt={featured?.title || ""} />
              <span className="broadcast-feature-index">RVR<br />001</span>
            </div>
            <div className="broadcast-feature-copy">
              <span>{I18n.t("tenants.storefront.broadcast.now_presenting")}</span>
              <h2>{featured?.title || I18n.t("tenants.storefront.broadcast.empty_title")}</h2>
              <p>{featured?.subtitle || featured?.excerpt || I18n.t("tenants.storefront.broadcast.empty_description")}</p>
              <strong>{I18n.t("tenants.storefront.broadcast.open")} <ArrowUpRight /></strong>
            </div>
          </Link>
        </div>
      </section>

      <div className="broadcast-ticker" aria-hidden="true">
        <div>
          {Array.from({ length: 4 }, (_, index) => (
            <React.Fragment key={index}>
              <span>{tenant.name}</span><b>●</b><span>{I18n.t("tenants.storefront.broadcast.independent_signal")}</span><b>●</b>
            </React.Fragment>
          ))}
        </div>
      </div>

      {releases.length > 0 && (
        <section className="broadcast-section" id="releases">
          <header><span>02</span><h2>{I18n.t("tenants.storefront.broadcast.latest_releases")}</h2><Link to="/releases">{I18n.t("tenants.storefront.broadcast.view_all")} <ArrowRight /></Link></header>
          <div className="broadcast-release-grid">
            {releases.slice(0, 6).map((release, index) => (
              <Link to={releaseUrl(release)} className="broadcast-release-card" key={release.id}>
                <div><Artwork item={release} alt={release.title} /><span>{String(index + 1).padStart(2, "0")}</span></div>
                <small>{release.user?.display_name || tenant.name}</small>
                <h3>{release.title}</h3>
                <p>{release.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="broadcast-section broadcast-events" id="events">
          <header><span>03</span><h2>{I18n.t("tenants.storefront.broadcast.upcoming_events")}</h2><Link to="/events">{I18n.t("tenants.storefront.broadcast.view_all")} <ArrowRight /></Link></header>
          <div className="broadcast-event-list">
            {events.slice(0, 4).map((event, index) => (
              <Link to={`/events/${event.slug}`} key={event.id}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <time><CalendarDays /> {formatDate(event.event_start)}</time>
                <h3>{event.title}</h3>
                <p>{event.venue || event.city || (event.online ? "Online" : tenant.name)}</p>
                <ArrowUpRight />
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="broadcast-section" id="stories">
          <header><span>04</span><h2>{I18n.t("tenants.storefront.broadcast.latest_stories")}</h2><Link to="/articles">{I18n.t("tenants.storefront.broadcast.view_all")} <ArrowRight /></Link></header>
          <div className="broadcast-story-grid">
            {posts.slice(0, 3).map((post) => (
              <Link to={`/articles/${post.slug}`} key={post.id}>
                <div><Artwork item={post} alt={post.title} /></div>
                <small>{post.category?.name || I18n.t("tenants.storefront.broadcast.story")}</small>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="broadcast-footer">
        <div><Radio /><strong>{tenant.name}</strong></div>
        <p>{I18n.t("tenants.storefront.broadcast.footer")}</p>
        <span>RAUVERSION / {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
