# Stripe processing costs for product sales

Product cart checkouts use Stripe destination charges: Stripe distributes the
payment to the seller automatically when it is captured. Rauversion does not
create a later transfer, settlement job, or database migration for this flow.

The buyer pays product prices, shipping, and the existing separate service fee.
The product service fee uses `PLATFORM_MARKETPLACE_FEE`, defaulting to 8%.
Ticket checkouts also recover estimated processing costs from the organizer,
using their own service fee and processing estimate settings. See
[ticket Stripe fees](ticket-stripe-processing-fees.md). Digital music retains
its existing fee settings and processing cost responsibility.

The seller receives the payment minus the service fee and an estimated Stripe
processing cost. Both amounts are included in `application_fee_amount` and the
seller's connected account is passed in `transfer_data.destination`:

```
application fee = Rauversion service fee + estimated processing cost
seller proceeds = buyer payment - application fee
```

The processing estimate never creates an additional buyer line item. The
service fee and processing estimate are recorded separately in Checkout and
PaymentIntent metadata for reporting. `shipping_fee_amount` records the shipping
cost and `processing_fee_base_amount` records the total used for the estimate,
including shipping and after any coupon discount.

Shipping is included in the processing estimate. When country-specific shipping
prices differ, the buyer chooses the destination in the cart before Checkout.
The server calculates that country's shipping cost and passes only that shipping
option and country to Stripe, so the fee estimate and charged shipping agree.
When shipping prices are equal, no destination selection is required before
Checkout. The shipping address is still collected by Stripe.

## Configuration

The configured Rauversion Stripe account is in the US. The default processing
estimate uses the [published US domestic card rate](https://stripe.com/pricing):
2.9% plus USD 0.30. This is a baseline estimate, not a verified account-specific
pricing contract or the exact cost of every payment method.

```
PLATFORM_MARKETPLACE_FEE=8
STRIPE_PRODUCT_PROCESSING_FEE_PERCENTAGE=2.9
STRIPE_PRODUCT_PROCESSING_FIXED_FEE_USD=0.30
```

A fixed processing estimate for another currency uses
`STRIPE_PRODUCT_PROCESSING_FIXED_FEE_<CURRENCY>` in that currency's major units.
For CLP, the value is pesos. Without that setting, non-USD checkouts use only
the percentage estimate: USD 0.30 is never interpreted as 0.30 pesos or another
currency. Configure a converted fixed estimate when needed.

For example, with USD 200 of products and the default 8% service fee, the buyer
pays USD 216 before shipping. Estimated processing costs are USD 6.56, so the
seller receives USD 193.44. Rauversion retains USD 22.56 before Stripe debits
its actual processing cost. If the actual fee is USD 6.56, Rauversion nets its
USD 16 service fee.

With USD 10 of products and USD 10 shipping, the buyer pays USD 20.80 including
the 8% service fee. Estimated processing costs are USD 0.90, so the seller
receives USD 19.10 including shipping. Rauversion retains USD 1.70 before Stripe's
actual processing cost; if that is USD 0.90, Rauversion nets USD 0.80.

## Estimate limits and operations

- Stripe still debits processing fees from Rauversion for destination charges.
  The seller covers the configured estimate through reduced proceeds; any
  difference from the actual Stripe charge remains with Rauversion.
- The estimate is fixed at Checkout creation. It includes the product subtotal
  and service fee, accounts for a selected coupon, and includes shipping. Coupon
  discounts do not reduce the shipping charge. Card country, payment method, currency conversion,
  and other Stripe charges can also make the actual cost differ.
- The retained application fee is capped at the estimated discounted charge
  total, so a large coupon cannot create an application fee above that amount.
- The cart must contain one connected Stripe seller and one currency.
- Keep the signed `checkout.session.completed` webhook, plus
  `checkout.session.async_payment_succeeded` and
  `checkout.session.async_payment_failed` for delayed payment methods. These
  events fulfill purchases and do not send money to sellers from our code.
- Existing destination checkouts keep their original fee amounts; webhook
  redelivery does not create another transfer or duplicate purchase items.
- Validate Checkout's automatic distribution in a Stripe sandbox before
  production deployment. Automated specs mock Stripe API responses.
- Refunds follow the existing destination-charge process. Use Stripe's
  `reverse_transfer` and `refund_application_fee` options according to the
  refund policy; these options are separate from who covers processing costs.

Stripe debiting the exact processing cost directly from the seller would
require direct charges and suitable merchant accounts. The current onboarding
creates recipient accounts, which cannot process payments. This implementation
keeps the recipient accounts and the automatic distribution approach.

References: [Destination charges and application fees](https://docs.stripe.com/connect/marketplace/tasks/app-fees),
[Fee responsibility](https://docs.stripe.com/connect/direct-charges-fee-payer-behavior),
[Recipient account capabilities](https://docs.stripe.com/connect/service-agreement-types).
