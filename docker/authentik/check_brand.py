from authentik.brands.models import Brand
b = Brand.objects.first()
print('LOGO:' + str(b.branding_logo))
print('FAVI:' + str(b.branding_favicon))
print('TITL:' + str(b.branding_title))
