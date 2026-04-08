from authentik.flows.models import Flow
f = Flow.objects.get(slug='default-authentication-flow')
print('BG:' + str(f.background))
print('LAYOUT:' + str(f.layout))

# Clear the flow background so it doesn't render the mountain image
f.background = ''
f.save()
print('AFTER_BG:' + str(f.background))
