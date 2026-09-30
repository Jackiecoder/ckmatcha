# C&K Commerce Group · Matcha Collection

A bilingual company and product website with an original interactive WebGL matcha powder vortex.

## Local preview

Run `npm run dev`, then open `http://127.0.0.1:4173`.

The site is plain HTML, CSS and JavaScript. There are no runtime dependencies or build step. `dist/` contains the complete deployable website; `npm run check` checks JavaScript syntax.

## Editing

- `dist/content.js`: Chinese and English copy, product descriptions and application categories.
- `dist/main.js`: language preference, product filtering, accessible detail dialogs, application tabs and inquiry drafts.
- `dist/field.js`: GPU-rendered particle sculpture, pointer/drag/keyboard input, reduced-motion support and visibility-based animation suspension.
- `dist/style.css`: visual system and responsive layouts.
- `dist/images/`: photography extracted from the supplied English brochure.
- `dist/catalogs/`: original Chinese and English product brochures.

## Product sources

All product descriptions, producer information, contact details and inquiry conditions come from the supplied 12-page `CK_Commerce_Group_Matcha_Collection_CN(1).pdf` and `CK_Commerce_Group_Matcha_Collection(1).pdf`. Descriptive website headings are editorial copy. No additional certifications, prices or product specifications are asserted.

Guitea S, A, B and BK remain separate collections. Guizhou Ruisai Song, Ming / Qing, and Baking & Seasoning remain separately selectable. The BK ingredient-statement note and producer-specific grading distinction are preserved.

## Inquiries

The form prepares an encoded `mailto:` draft to `c.kcommercegroup@gmail.com`. The visitor reviews and sends it in their email application. There is no backend submission, automatic email delivery or form-data storage. Only the language preference is saved locally.

## GCP hosting

Run `bash deploy.sh` to deploy the independent Cloud Run service `ck-matcha` in project `iportfolio-497808`, region `us-central1`, following iPortfolio's source-build and release verification pattern. `PROJECT_ID`, `REGION` and `SERVICE` may be overridden explicitly. This deployment does not require a database or scheduled refresh.

The container uses Cloud Run's `PORT` and listens on `0.0.0.0`. The service is publicly accessible over HTTPS, uses request-based CPU allocation and zero minimum instances, and is capped at two instances with 256 MiB memory each. `/api/healthz` is the health endpoint, matching the iPortfolio convention. PDF downloads stream instead of buffering complete catalogs in server memory.

The script runs HTTP behavior tests and JavaScript syntax checks, validates the tagged revision's health and frontend SHA-256 hashes, then routes 100% of traffic to the new revision and removes the temporary tag. On updates, it retains the prior revision in the ignored `.last-good-revision` file for rollback. First deployments have no prior serving revision.

### Custom domain

Use native Cloud Run domain mappings to connect `ckcommercegroup.com` and `www.ckcommercegroup.com` to the existing `ck-matcha` service. Domain registration and DNS remain at Porkbun; Cloud Run issues and renews the HTTPS certificates. This path does not require Firebase Hosting. Cloud Run domain mappings are a Preview feature with limited regional availability; `us-central1` is supported. See [Google's custom-domain documentation](https://docs.cloud.google.com/run/docs/mapping-custom-domains) for the production limitations and other options.

For initial setup, verify the base domain in Google Search Console using the same Google account as the deployment account. `gcloud domains verify ckcommercegroup.com` opens the verification workflow. Add the supplied `google-site-verification=...` TXT record at Porkbun with a blank Host field, then complete verification. Keep this record after verification; ownership of the base domain also covers `www`.

With the gcloud beta component installed, create each mapping once:

```bash
gcloud beta run domain-mappings create --service=ck-matcha --domain=ckcommercegroup.com --project=iportfolio-497808 --region=us-central1
gcloud beta run domain-mappings create --service=ck-matcha --domain=www.ckcommercegroup.com --project=iportfolio-497808 --region=us-central1
```

Retrieve each mapping's required DNS records and status:

```bash
gcloud beta run domain-mappings describe --domain=ckcommercegroup.com --project=iportfolio-497808 --region=us-central1 --format='json(status.resourceRecords,status.conditions)'
gcloud beta run domain-mappings describe --domain=www.ckcommercegroup.com --project=iportfolio-497808 --region=us-central1 --format='json(status.resourceRecords,status.conditions)'
```

At Porkbun, replace conflicting parking records with every A, AAAA or CNAME record returned by Cloud Run. Leave Host blank for the root domain and use `www` for the subdomain. DNS targets are IP addresses or hostnames, never full `https://` URLs. Preserve unrelated email records. Wait for each mapping's Ready condition and test the public HTTPS pages; certificate provisioning can take up to 24 hours.

Continue to use `bash deploy.sh` for website source updates. The mappings follow the existing service's traffic allocation, so content updates do not require changes to the domain mappings or DNS.

The earlier Sites registration remains in `.openai/hosting.json`; its identity is preserved separately. `.gcloudignore` and `.dockerignore` keep hosting metadata, credentials and local tooling out of the GCP container.
