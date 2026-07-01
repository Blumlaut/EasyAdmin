# Image Hosting

Screenshots taken by EasyAdmin need an image host to produce shareable URLs (required for Discord webhooks and chat messages). This page covers setting up your own image host using EasyAdmin's recommended service.

## Why Your Own Image Host?

EasyAdmin used to default to a third-party upload service that is no longer available. Running your own image host gives you full control over your data and eliminates dependencies on external services.

## EasyAdmin Image Host

[**Blumlaut/imagehosting**](https://github.com/Blumlaut/imagehosting) is a lightweight Cloudflare Worker built for EasyAdmin screenshots. It accepts only images, auto-deletes everything after 24 hours, and runs entirely on Cloudflare's free tier.

### Features

- **Images only** — JPEG, PNG, GIF, WebP with magic byte validation
- **24-hour expiry** — all images auto-delete, no manual cleanup needed
- **JSON + data URI support** — works directly with EasyAdmin's upload format
- **Rate limiting** — global and per-IP daily caps
- **Optional auth** — bearer token to restrict who can upload
- **Burn-after-reading** — optional mode that deletes on first view
- **Free tier** — runs on Cloudflare's free plan (~266 uploads/day)

### Quick Setup

You'll need a [Cloudflare account](https://dash.cloudflare.com/sign-up) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-update/) installed.

#### 1. Authenticate Wrangler

```bash
wrangler whoami --api-token=<YOUR_CLOUDFLARE_API_TOKEN>
```

Create an API token in the Cloudflare dashboard with **Edit Cloudflare Workers** permissions (Workers, KV, and R2).

#### 2. Create the required resources

```bash
wrangler kv namespace create IMAGE_META
wrangler r2 bucket create image-store
```

#### 3. Update wrangler.toml

Clone the repo and edit `wrangler.toml` with your KV namespace ID from step 2:

```toml
name = "easyadmin-image-host"
main = "worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "IMAGE_META"
id = "<YOUR_KV_NAMESPACE_ID>"

[[r2_buckets]]
binding = "IMAGE_STORE"
bucket_name = "image-store"

[triggers]
crons = ["0 * * * *"]
```

#### 4. Deploy

```bash
wrangler deploy
```

This gives you a `*.workers.dev` URL. Optionally add a custom domain in the Cloudflare dashboard under **Workers & Pages** → your worker → **Triggers**.

#### 5. (Optional) Set a custom origin

If you add a custom domain for the R2 bucket (e.g. `img.example.com`), tell the worker to use it in generated URLs:

```bash
wrangler secret put ORIGIN
# Enter: https://img.example.com
```

#### 6. (Optional) Restrict uploads

```bash
wrangler secret put UPLOAD_SECRET
# Enter a random secret string
```

Then add `Authorization: Bearer <secret>` to requests. EasyAdmin doesn't send auth headers by default — leave this unset or use a reverse proxy.

### Configuring EasyAdmin

Point EasyAdmin at your worker's `/upload` endpoint:

```
set ea_screenshoturl "https://your-worker.your-account.workers.dev/upload"
```

Or with a custom domain:

```
set ea_screenshoturl "https://img.example.com/upload"
```

No other configuration needed — EasyAdmin sends the correct format out of the box.

## Alternative Solutions

Any service that accepts a JSON POST with a base64 data URI and returns a JSON response with a `url` field will work. The response format EasyAdmin expects:

```json
{
  "url": "https://example.com/abc123.jpg"
}
```

EasyAdmin also falls back to regex-based URL extraction for services that return plain text URLs.
