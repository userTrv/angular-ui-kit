import { ApplicationConfig } from '@angular/core';
import { provideUiTheme } from '@usertrv/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    // Optional: defaults are theme 'system' and density 'comfortable'.
    provideUiTheme({ theme: 'system', density: 'comfortable', storageKey: 'my-app-theme' }),
  ],
};
