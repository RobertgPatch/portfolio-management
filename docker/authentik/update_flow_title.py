from authentik.flows.models import Flow
f = Flow.objects.get(slug='default-authentication-flow')
print('Current title: ' + str(f.title))
f.title = 'Welcome to Ghostfolio!'
f.save()
print('Updated title: ' + str(f.title))
