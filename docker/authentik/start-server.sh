#!/bin/bash
set -e

echo "==> Applying Ghostfolio branding to Authentik..."

# Apply branding (idempotent — safe to run on every boot)
# These use Django's manage.py shell to update the database directly.
python /ak-root/manage.py shell -c "
from authentik.brands.models import Brand
b = Brand.objects.first()
if b:
    b.branding_logo = '/static/dist/assets/icons/ghostfolio-logo.svg'
    b.branding_favicon = '/static/dist/assets/icons/ghostfolio-logo.svg'
    b.branding_title = 'Ghostfolio'
    b.save()
    print('  Brand updated: logo + favicon + title')
else:
    print('  No brand found (first boot — will apply on next restart)')
" 2>/dev/null || echo "  (brand update skipped — DB may not be ready yet)"

python /ak-root/manage.py shell -c "
from authentik.flows.models import Flow
try:
    f = Flow.objects.get(slug='default-authentication-flow')
    f.title = 'Welcome to Ghostfolio!'
    f.save()
    print('  Flow title updated')
except Flow.DoesNotExist:
    print('  Flow not found (first boot — will apply on next restart)')
" 2>/dev/null || echo "  (flow update skipped — DB may not be ready yet)"

echo "==> Starting Authentik server..."
exec /lifecycle/ak server
