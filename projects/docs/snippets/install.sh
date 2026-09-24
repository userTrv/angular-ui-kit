# Not published to npm yet — build and pack the library locally:
pnpm build:lib
cd dist-lib/ui && npm pack   # -> usertrv-ui-0.1.0.tgz

# In your app:
npm install @angular/cdk ../path/to/usertrv-ui-0.1.0.tgz
