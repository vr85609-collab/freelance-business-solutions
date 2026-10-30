# Aqua Arcade reward economics and operating rules

Prepared October 30, 2026. These replace the earlier percentage-coupon draft. Redemption remains disabled pending production identity and checkout testing.

Victor confirmed Citrus Burst, Sleepy Time and Love It Bath Bombs. Current retail prices and recorded unit costs were checked through the connected Shopify store. Actual private costs and the merchant margin worksheet are delivered separately and are not committed to this public repository. Other merchandise is excluded from reward discounts.

| Reward | Points spent | Verified wins | Active days | Qualifying purchase | Earliest example, 3 wins/day |
|---|---:|---:|---:|---|---:|
| $2 coupon | 500 | 20 | 7 | $25 of eligible bath bombs | 8 days |
| $4 coupon | 1,500 | 60 | 21 | $40 of eligible bath bombs | 22 days |
| $6 coupon | 3,000 | 120 | 45 | $50 of eligible bath bombs | 45 days |
| Approved gift with purchase | 4,000 | 150 | 60 | Buy 5 eligible units; add a sixth approved unit free | 60 days |

Examples start at zero, include every streak bonus, assume successful eligible gameplay and no other reward spending. At one verified win/day, minimum-win requirements make these approximately 20 / 60 / 120 / 150 days. Points are spent; historical wins/days remain. No streak is mandatory at redemption and missing a day never removes earned points. No purchases are required to earn points. Gift purchase conditions must be disclosed before earning and claiming, never described as an unconditional free shipment.

## Margin model

The defaults budget **4% + $0.30 per paid order**, **$1.50 packaging/handling per order**, and **$0 shipping subsidy**. These are conservative planning assumptions, not the store’s verified processor or fulfillment rates. Customer shipping charges must cover actual postage; if store rates subsidize postage or offer free shipping, enter the expected merchant-funded cost in ARCADE_SHIPPING_SUBSIDY_USD before activation.

The private merchant worksheet compares each first qualifying basket using live recorded product costs. No actual private unit costs or store contribution figures are included in this repository.

Contribution = paid merchandise minus recorded cost of ALL units, percentage fee, fixed payment fee, packaging allowance and shipping subsidy. It excludes advertising, subscriptions, labor beyond the allowance, returns, chargebacks, damaged inventory, taxes on the business and other overhead. It is NOT guaranteed net profit.

Only eligible items count toward the coupon minimum. Coupons have fixed total savings, never a discount per item, and exclude subscriptions, gift cards and other store products. Codes cannot stack with product/order/shipping discounts. A free-shipping RATE can still be a merchant expense even if discount combinations are disabled.

## Runtime protections

- Client totals never determine rewards. Server-replayed wins, a 20-second minimum, three different reward games/day, one customer code/week and identity binding remain enforced.
- The three approved variant IDs are explicit in policy.js. Gift selection must also be in GIFT_VARIANT_ALLOWLIST. The Admin UI displays scent names.
- Before reserving points, and again before creating a missing Shopify code (including retries), read current prices, unit costs, currency, status and stock. Missing cost, unavailable stock or projected contribution below $5 pauses creation. This model uses the worst eligible cost/price ratio for coupons and the lowest paid-unit contribution plus the chosen gift’s cost for gifts.
- Defaults: 10 codes total per Monday–Sunday week, including gifts; 3 gifts per rolling 30 days; one accepted gift per rewards account; maximum $6 gift retail at issuance. At most $60 of fixed-coupon face value can be newly issued weekly if all ten are the top tier. This is a capacity cap, not an automatic spending or shipping authorization.
- Seven-day expiry, one total use, one specific verified customer, no stacking. Expired issued codes do not refund spent points. Uncertain issuance retains the reserve and reconciles the same random code before retry.
- Gift code: Shopify buy-X-get-Y, five paid eligible units plus one approved free unit, usesPerOrderLimit=1. The merchant still approves each recipient and scent. No automatic order, address collection, email or fulfillment.

## Limits and operating responsibilities

The margin check is at issuance, not continuously at checkout. A later price, cost, shipping-rate or discount change can alter results. Review and deactivate outstanding reward codes in Shopify BEFORE changing eligible prices or shipping policy; do not assume a code’s initial economics stays valid. Stock is not reserved. Reconcile issued codes before refunding claims. Do not enable redemption until actual fees, packaging, postage, eligibility and mixed-cart behavior have been tested in Shopify checkout.

No real discount was created and no shipment was authorized while preparing these rules.

Official implementation references:
- https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/discountCodeBasicCreate
- https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/discountCodeBxgyCreate
- https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant
- https://shopify.dev/docs/apps/build/authentication-authorization/manage-credentials
