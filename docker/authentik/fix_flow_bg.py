import base64
from django.core.files.base import ContentFile
from authentik.flows.models import Flow

f = Flow.objects.get(slug='default-authentication-flow')
print('BEFORE BG:', f.background)
print('LAYOUT:', f.layout)

# Upload a 1x1 transparent PNG as the flow background.
# This gives the flow a unique /media/... URL that won't collide with
# the cached default mountain image at /static/dist/assets/images/flow_background.jpg.
# Our custom.css also sets --ak-flow-background: none and hides .pf-c-background-image,
# but uploading an explicit transparent image is belt-and-suspenders against browser cache.
transparent_png = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
)
f.background.save('ghostfolio_bg.png', ContentFile(transparent_png), save=True)
f.refresh_from_db()
print('AFTER BG:', f.background)
print('AFTER URL:', f.background.url)
