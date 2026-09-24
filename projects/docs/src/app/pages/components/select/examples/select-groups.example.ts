import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiSelect, UiSelectOption, UiSelectOptionGroup } from '@usertrv/ui/select';

interface Region {
  id: string;
  city: string;
  latency: number;
  full?: boolean;
}

@Component({
  selector: 'docs-select-groups-example',
  imports: [UiSelect, UiSelectOption, UiSelectOptionGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
    .latency {
      margin-inline-start: auto;
      color: var(--ui-color-text-muted);
      font-size: var(--ui-font-size-xs);
    }
  `,
  template: `
    <div class="docs-stack">
      <div>
        <span class="label" id="region-label">Deployment region</span>
        <ui-select aria-labelledby="region-label" placeholder="Choose a region" [(value)]="region">
          @for (group of groups; track group.name) {
            <ui-optgroup [label]="group.name" [disabled]="group.name === 'Asia Pacific (preview)'">
              @for (r of group.regions; track r.id) {
                <ui-option [value]="r.id" [label]="r.city" [disabled]="r.full">
                  {{ r.city }}
                  <span class="latency">{{ r.full ? 'at capacity' : r.latency + ' ms' }}</span>
                </ui-option>
              }
            </ui-optgroup>
          }
        </ui-select>
      </div>
      <p class="docs-muted">Value: {{ region() ?? 'none' }}</p>
    </div>
  `,
})
export class SelectGroupsExample {
  protected readonly region = signal<string | null>('eu-central');
  protected readonly groups: { name: string; regions: Region[] }[] = [
    {
      name: 'Europe',
      regions: [
        { id: 'eu-west', city: 'Dublin', latency: 38 },
        { id: 'eu-central', city: 'Frankfurt', latency: 24 },
        { id: 'eu-north', city: 'Stockholm', latency: 41, full: true },
      ],
    },
    {
      name: 'North America',
      regions: [
        { id: 'us-east', city: 'Virginia', latency: 92 },
        { id: 'us-west', city: 'Oregon', latency: 148 },
      ],
    },
    {
      name: 'Asia Pacific (preview)',
      regions: [
        { id: 'ap-south', city: 'Mumbai', latency: 131 },
        { id: 'ap-northeast', city: 'Tokyo', latency: 212 },
      ],
    },
  ];
}
