#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_ID="${PROJECT_ID:-iportfolio-497808}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-ck-matcha}"
RELEASE_TAG="${RELEASE_TAG:-release-check}"

if [[ -z "${CLOUDSDK_PYTHON:-}" && -x /opt/homebrew/bin/python3 ]]; then
  export CLOUDSDK_PYTHON=/opt/homebrew/bin/python3
fi

npm run check
npm test
git diff --check

previous="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.latestReadyRevisionName)' 2>/dev/null || true)"
deployment_flags=(--quiet)
if [[ -n "$previous" ]]; then
  printf '%s %s %s\n' "$SERVICE" "$REGION" "$previous" > .last-good-revision
  deployment_flags+=(--no-traffic)
fi

gcloud run deploy "$SERVICE" --source=. --project="$PROJECT_ID" --region="$REGION" \
  --platform=managed --allow-unauthenticated --port=8080 \
  --cpu=1 --memory=256Mi --concurrency=80 --timeout=60s \
  --min=0 --max=2 --min-instances=0 --max-instances=2 --cpu-throttling \
  --tag="$RELEASE_TAG" "${deployment_flags[@]}"

revision="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.latestReadyRevisionName)')"
tag_url="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='json(status.traffic)' | python3 -c 'import json,sys; print(next((item.get("url", "") for item in json.load(sys.stdin)["status"]["traffic"] if item.get("tag") == sys.argv[1]), ""))' "$RELEASE_TAG")"
if [[ -z "$tag_url" ]]; then
  echo 'Release tag URL was not returned; refusing traffic cutover.' >&2
  exit 1
fi
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors --retry-max-time 45 "$tag_url/api/healthz"
printf '\n'
for file in index.html main.js field.js content.js style.css; do
  actual="$(curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors --retry-max-time 45 "$tag_url/$file" | shasum -a 256 | awk '{print $1}')"
  expected="$(shasum -a 256 "dist/$file" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "Release asset mismatch: $file" >&2
    exit 1
  fi
done

gcloud run services update-traffic "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --to-revisions="$revision=100" --quiet
url="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors --retry-max-time 45 "$url/api/healthz"
printf '\n'
gcloud run services update-traffic "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --remove-tags="$RELEASE_TAG" --quiet
printf 'Deployed %s: %s\n' "$revision" "$url"
