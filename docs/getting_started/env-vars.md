---
title: Environment Variables
layout: post
menu_position: 4
---

# Env vars

### App

```sh
DOMAIN=rauversion.com
HOST=rauversion.com
PLATFORM_EVENTS_FEE=3
EMAIL_ACCOUNT=robot@rauversion.com
RAIL_ENV=prod
DEFAULT_LOCALE=en
RAILS_SERVE_STATIC_FILES=true
DATABASE_URL=
REDIS_URL=
POOL_SIZE=10
PEAKS_PROCESSOR=audiowaveform
```

### Monitoring:

```sh
SCOUT_KEY=
SCOUT_LOG_LEVEL=WARN
SCOUT_MONITOR=true
SECRET_KEY_BASE=
SENTRY_DSN=
```

### AWS S3 Storage
```sh
AWS_ACCESS_KEY_ID=
AWS_S3_BUCKET=cantalao
AWS_S3_REGION=us-east-1
AWS_SECRET_ACCESS_KEY=
```

### Google Analytics & Google Maps

```sh
GA_ID=
GOOGLE_MAPS_KEY=
```

### Geo IP

```sh
IP_INFO_API_KEY=
```

### OPEN AI:

```sh
OPENAI_API_KEY=
```

### Email

```sh
SMTP_DOMAIN=
SMTP_PASSWORD=
SMTP_USERNAME=
```

### Transbank:

```sh
TBK_API_KEY=
TBK_COMMERCE_ID=
TBK_MALL_ID=
```

### Stripe:

```sh
STRIPE_CLIENT_ID=
STRIPE_CLIENT_SECRET=
STRIPE_SIGNING_SECRET=
STRIPE_SIGNING_SECRET_ACC=
PLATFORM_MARKETPLACE_FEE=8
STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE=2.9
STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD=0.30
STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE=2.9
STRIPE_TICKET_PROCESSING_FIXED_FEE_USD=0.30
```

Product Checkout deducts an estimated processing cost from the seller through
Stripe's automatic distribution. `PLATFORM_MARKETPLACE_FEE` controls the separate
Rauversion service commission and defaults to 8%. Fixed processing estimates in
other currencies use `STRIPE_PRODUCT_PROCESSING_FIXED_FEE_<CURRENCY>` in major
units; non-USD currencies default to a percentage-only estimate.
Ticket Checkout also deducts estimated processing costs from organizer proceeds,
using `STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE` and
`STRIPE_TICKET_PROCESSING_FIXED_FEE_<CURRENCY>`. Ticket service commissions still
use the event's `custom_fee` or `PLATFORM_EVENTS_FEE`. Exclusive taxes added later
by Stripe are outside the ticket estimate's base amount.
Organizers can choose whether Stripe taxes are included in prices or added at
checkout in the event's Tickets editor. `STRIPE_TICKET_TAX_BEHAVIOR` is the
fallback for events without an override and defaults to `exclusive`. The event
choice takes precedence and applies to tickets and the service charge. It does
not disable tax collection or change the entity responsible for remitting tax.
See [product Stripe fees](product-stripe-settlement.md) and
[ticket Stripe fees](ticket-stripe-processing-fees.md).

### Auth Credentials

```sh
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
```
