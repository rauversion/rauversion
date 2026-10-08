# Stripe processing costs for ticket sales

Ticket Checkout uses destination charges. Stripe distributes captured payments
to the event organizer automatically and collects the application fee for
Rauversion. Our webhook confirms tickets; it does not create a later transfer.

The buyer pays ticket prices plus the existing visible service fee. That service
fee uses the event's `custom_fee` when present, otherwise `PLATFORM_EVENTS_FEE`
(the code default is 10%). The supplied environment example uses 3%; adding
processing cost recovery does not change that configured service percentage.

The application fee now includes both the service fee and an estimated Stripe
processing cost. The processing estimate is calculated on tickets plus the
service fee, so it includes processing costs on Rauversion's service charge.
It is deducted from the organizer's proceeds and creates no buyer line item.

```
processing fee base = ticket subtotal + buyer service fee
application fee = service fee + estimated processing cost
organizer proceeds = payment total - application fee
platform net before other costs = application fee - actual Stripe processing fee
```

The application fee is capped at the base amount to avoid negative organizer
proceeds. An organizer must have a connected Stripe account to create Checkout.
Free ticket purchases continue through the existing free checkout path.

## Example without additional taxes

For a USD 20 ticket with an event service fee of 8%:

| Amount | USD |
| --- | ---: |
| Ticket | 20.00 |
| Buyer service fee | 1.60 |
| Buyer total | 21.60 |
| Estimated processing: 2.9% of 21.60 plus 0.30 | 0.93 |
| Application fee | 2.53 |
| Organizer proceeds | 19.07 |
| Rauversion net, if actual processing is 0.93 | 1.60 |

Previously, Rauversion retained only USD 1.60 before Stripe processing and netted
USD 0.67 in this example. Destination charges still bill Stripe processing fees
to Rauversion; the larger application fee recovers the estimate from the
organizer. This does not make the organizer Stripe's native processing fee payer.

## Configuration and reporting

```
STRIPE_TICKET_PROCESSING_FEE_PERCENTAGE=2.9
STRIPE_TICKET_PROCESSING_FIXED_FEE_USD=0.30
```

These defaults match the product estimate's US domestic card baseline. They are
not verified contract-specific prices or the exact fee for every card or method.
Non-USD currencies default to the percentage only. Configure a fixed fee using
`STRIPE_TICKET_PROCESSING_FIXED_FEE_<CURRENCY>` in that currency's major units;
for CLP, the value is pesos. The fixed fee is estimated once per Checkout, even
when it contains multiple tickets. Stored purchase item prices are used for
pay-what-you-want tickets.

Product and ticket checkouts share the processing estimate calculation while
retaining separate environment settings. Digital music, courses, bookings, and
Transbank continue through their existing payment providers.

Both Checkout and PaymentIntent metadata record:

- `source_type=event`, `event_id`, and `purchase_id`
- `currency`, `ticket_total_amount`, and `service_fee_percentage`
- `processing_fee_payer=seller` and `processing_fee_model=estimated`
- `service_fee_amount`, `estimated_processing_fee_amount`, and `application_fee_amount`
- `processing_fee_base_amount`, in the currency's smallest unit
- `processing_fee_base_model=before_exclusive_tax` when automatic tax can add
  tax later, otherwise `checkout_total`
- `ticket_tax_behavior`, `ticket_tax_code`, `service_fee_tax_code`,
  `automatic_tax_enabled`, and `tax_liability_type`

Each ticket `Purchase` also stores this snapshot locally in its JSONB
`payment_metadata` column when Checkout is created, along with
`connected_account_id` and `amount_unit=minor`. Fee amounts are integers in the
currency's smallest unit: `160` means USD 1.60, while `800` means CLP 800.
Changing event fees or environment settings does not recalculate a past sale.

After a paid webhook, the snapshot additionally stores `payment_intent_id`,
`amount_total`, `amount_subtotal`, `amount_tax`, `amount_discount`, and
`amount_shipping` when Stripe supplies them. A signed webhook can fill missing
fee fields for an older Checkout, but existing fee snapshots take precedence
over later changes to remote metadata. Purchases without fee metadata retain
unknown fees; this change does not backfill historical estimates.

Future fee reports should aggregate once per **paid Purchase**, separately by
currency, rather than once per purchased ticket. `estimated_processing_fee_amount`
is an estimate, not the actual Stripe balance transaction fee. Calculate exact
platform net only with actual processing fees and refunds reconciled; those are
not recorded by this change. Tax-inclusive buyer totals are stored separately
from the original processing base so reports can distinguish them.

## Taxes, payment confirmation, and refunds

The Tickets editor offers **Taxes in the price** with two choices:

- **Included in the price** (`inclusive`): applicable taxes are contained in
  the advertised ticket price and service charge. Stripe itemizes the tax without
  increasing the buyer total.
- **Added at checkout** (`exclusive`): Stripe adds applicable taxes to the ticket
  price and service charge after the customer provides their address.

This is an event-level `ticket_tax_behavior` setting in `event_settings`. Events
without a choice continue to use `STRIPE_TICKET_TAX_BEHAVIOR`, defaulting to
`exclusive`. Event overrides take precedence over the environment. The choice
affects newly created Checkout sessions and is stored in each purchase's fee
snapshot. It changes price presentation, not registrations, product tax codes,
or the liable entity. Transbank and free tickets keep their existing flows.

The editor shows an illustrative example beneath the selection and updates it
when tax pricing or currency changes. Zero-decimal currencies use a 1,000-unit
ticket; other currencies use a 20-unit ticket. It uses the event's actual service
commission and the configured processing estimate. A clearly labeled 19% tax
assumption illustrates the difference between inclusive and exclusive prices;
it is not a tax quote for the event or the buyer. When automatic tax is disabled,
the example shows zero tax instead.

The explanation separates the buyer total, seller payment before setting aside
tax, and the amount left after a hypothetical tax reserve. It explicitly states
that taxes are not currently withheld from seller payments, so the transfer is
not presented as final net profit. Invalid fee settings suppress the numerical
example without preventing access to the editor.

The existing Stripe Tax codes and platform tax liability are preserved. With
exclusive taxes, Stripe calculates the tax after the customer provides their address.
That additional amount is not known when we set the application fee, so its
processing cost is outside this estimate. Inclusive taxes do not increase the
Checkout total. Any difference between estimated and actual processing costs,
including card country, exchange rates, or payment methods, remains with
Rauversion. This estimate does not recover separate Stripe Tax, Connect, payout,
or dispute fees.

In a test-mode Stripe calculation using the existing `txcd_10000000` tax code
(**General - Electronically Supplied Services**) and a Chilean billing address,
the active Chile registration produced `standard_rated` VAT at 19%. For USD 20
plus a USD 1.60 service fee, `exclusive` produced a USD 25.70 total with USD 4.10
tax; `inclusive` preserved the USD 21.60 total and included USD 3.45 tax. This
verifies the pricing behavior using the current classification; it does not
establish that a physical event ticket should use a digital-service tax code.
[Stripe's Chile coverage](https://docs.stripe.com/tax/supported-countries/latin-america-and-caribbean/collect-tax?tax-jurisdiction-latin-america=chile)
supports remote sellers of digital services. Review the ticket classification
separately before relying on these calculations for physical event admissions.

`automatic_tax.liability.type=self` continues to use Rauversion's settings and
registrations. Stripe Tax calculation does not automatically reserve or remit
the tax: the destination transfer still sends the payment minus the application
fee to the organizer, including tax amounts. Inclusive pricing alone therefore
does **not** make the tax organizer-funded in settlement. Withholding tax from
destination charges requires a transfer reversal after payment, as described
in [tax for marketplaces](https://docs.stripe.com/tax/tax-for-marketplaces).

Keep signed `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed` webhooks configured. Tickets are
confirmed only for `paid` or `no_payment_required` sessions. Repeated successful
webhooks acquire a purchase lock and queue ticket processing once. Failed
delayed payments do not grant tickets; pending reservations retain their existing
15-minute expiry policy.

The existing ticket refund endpoint refunds the ticket price from the platform
and currently does not pass `reverse_transfer` or `refund_application_fee`.
That is a separate refund-policy issue: the sale estimate does not make refunds
or disputes organizer-funded. Existing completed payments keep their original
application fees; this change applies to new Checkout sessions.

Automated specs mock Stripe and cover fee amounts, tax configuration, stored
prices, CLP, checkout errors, delayed confirmation, and webhook redelivery.

References: [Destination charges](https://docs.stripe.com/connect/destination-charges),
[Application fees](https://docs.stripe.com/connect/marketplace/tasks/app-fees),
[US card pricing](https://stripe.com/pricing),
[Automatic tax in Checkout](https://docs.stripe.com/tax/checkout/page).
