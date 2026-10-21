# Jourme authentication and seller API

## Configuration

Copy `.env.example` to `.env`, then configure MongoDB, a private `JWT_SECRET`
of at least 32 characters, and SMTP credentials. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env` or the generated secret. Email verification and password
reset require a working SMTP account; links return to the configured
`CLIENT_URL`. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
`MAIL_FROM` to the values from your email provider. Port `587` uses STARTTLS;
port `465` uses implicit TLS. The example values are placeholders, not working
credentials. If delivery fails, the API now returns an error instead of
reporting success; inspect the server terminal for the provider's SMTP error.
Restart the API after changing `server/.env`. Start the API from `server/` with
`npm run dev`.

The refresh token is held only in an `HttpOnly` cookie scoped to `/api/users`.
Cookies use `SameSite=Strict` by default and are `Secure` in production. For
cross-site frontend/API deployments, configure HTTPS and
`COOKIE_SAME_SITE=none`; configure `COOKIE_DOMAIN` only when needed.
`CLIENT_URL` must be the exact frontend origin. If deployed behind a reverse
proxy, set `TRUST_PROXY_HOPS` to the number of trusted proxy hops.

## Authentication endpoints

All authentication endpoints are prefixed with `/api/users`.

### `POST /register`

Creates a customer or seller account (never an admin). `role` defaults to
`seller`. Seller accounts must include `storeName`; customer accounts do not.
Send JSON:

```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "at-least-8-characters",
  "role": "seller",
  "storeName": "Ayesha Studio"
}
```

Returns `201` and sends a one-time email verification link, valid for 24 hours.
Registration does not create a session before email verification.

### `POST /verify-email`

Send `{ "token": "<token from verification link>" }`. A successful verification
enables login. Verification tokens are random, stored as hashes, expire, and can
be used only once.

### `POST /resend-verification`

Send `{ "email": "ayesha@example.com" }`. The response is generic to avoid
revealing whether an address has an unverified account.

### `POST /login`

Send `{ "email": "...", "password": "..." }`. Verified customer, seller, and
admin accounts may sign in. The response returns a 10-minute `accessToken` and
user profile. A rotating, opaque refresh token is issued only in the
HttpOnly cookie. Passwords are bcrypt-hashed; invalid credentials return `401`.

### `POST /refresh`

Rotates the refresh cookie and returns a new 10-minute access token. Refresh
sessions expire after 30 days; rotated tokens cannot be reused.

### `POST /logout`

Revokes the refresh-token session family and clears the cookie. Access tokens
expire after 10 minutes; password reset revokes all sessions and invalidates
existing access tokens immediately.

### `POST /forgot-password`

Send `{ "email": "ayesha@example.com" }`. An active account receives a
single-use reset link that expires after 30 minutes. The response is generic
whether the account exists or not.

### `POST /reset-password`

Send `{ "token": "<token from reset email>", "password": "new-password" }`.
This changes the bcrypt-hashed password and revokes all sessions.

### `GET /me`

Returns the current active verified account. Send the short-lived access token
in the request header:

```http
Authorization: Bearer <token>
```

Missing, expired, malformed, or revoked tokens return `401`.

## Roles and permissions

Public registration accepts only `customer` and `seller`. Admin accounts must
be provisioned by an operator; there is no public admin signup or role
escalation. `requireCustomer`, `requireSeller`, and `requireAdmin` guards are
available for role-specific routes. Seller product create/edit/status routes
are seller-only and additionally scope every product mutation to its owner.
The frontend account portal is `/account` for customers, `/seller` for sellers,
and `/admin` for provisioned administrators. Email verification and reset
links return users to the portal for their account role.

Auth endpoints have per-IP rate limits. The built-in rate-limit store is
process-local; deployments with multiple API instances should configure a
shared express-rate-limit store. Existing accounts created before email
verification was introduced must verify their address using
`POST /resend-verification` before they can sign in.

## Customer purchases

### `POST /api/orders`

Requires a valid bearer access token for a customer or seller account. Guest
checkout is not allowed. The authenticated account is recorded on the order,
and inventory is deducted atomically for each selected variant.

## Seller products API

### `POST /api/products`

Creates an active product owned by the authenticated seller. Send the seller
bearer token and a JSON body:

```json
{
  "name": "Essential Cotton Shirt",
  "description": "A comfortable cotton shirt for everyday wear.",
  "category": "Clothing",
  "price": 3490,
  "compareAtPrice": 4290,
  "sku": "JRM-SHR-001",
  "image": "https://example.com/shirt.jpg",
  "variants": [
    {
      "sku": "JRM-SHR-WHT-M",
      "color": "White",
      "size": "M",
      "stock": 12,
      "image": "https://example.com/shirt-white.jpg"
    }
  ]
}
```

Product and variant images are currently supplied as HTTP or HTTPS URLs; image
file uploads are not configured. Stock is calculated from the variant stock
quantities. Product and variant SKUs must be unique.

### `PATCH /api/products/:id`

Updates the product details and complete variant list for a product owned by
the authenticated seller. Send the same JSON body shape as product creation.
Include existing variant `_id` values to preserve those variant identifiers.

### `PATCH /api/products/:id/status`

Activates or deactivates a product owned by the authenticated seller. Send
`{ "isActive": false }` to deactivate or `{ "isActive": true }` to reactivate.
Deactivated products no longer appear in the public product catalog.

### `GET /api/products/mine`

Requires the same seller bearer token. Returns only products owned by the
authenticated seller, with `page` and `limit` query parameters (maximum limit
50). The response includes `pagination` and a `summary` with active and
inactive product counts, total stock units, and active products with 5 or
fewer units in stock.

### `GET /api/orders/seller`

Requires a seller bearer token. Returns paginated orders containing items owned
by that seller, including only that seller's order items and the shipping
details needed for fulfillment. New orders snapshot product ownership at
checkout; orders placed before this ownership tracking was added are not
included.
