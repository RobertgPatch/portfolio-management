from authentik.brands.models import Brand
b = Brand.objects.first()
b.branding_logo = '/static/dist/assets/icons/ghostfolio-logo.svg'
b.branding_favicon = '/static/dist/assets/icons/ghostfolio-logo.svg'
b.save()
print('logo:', b.branding_logo)
print('favicon:', b.branding_favicon)
print('title:', b.branding_title)
