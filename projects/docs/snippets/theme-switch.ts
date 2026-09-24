import { inject } from '@angular/core';
import { UiThemeService } from '@usertrv/ui';

const theme = inject(UiThemeService);
theme.setTheme('dark');          // 'light' | 'dark' | 'high-contrast' | 'system'
theme.setDensity('compact');     // 'comfortable' | 'compact'
theme.resolvedTheme();           // signal: the theme in effect, 'system' resolved
