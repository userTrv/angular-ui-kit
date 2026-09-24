import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ApiItem } from '../core/api';
import { InlineMarkupPipe } from './inline-markup';

/** API reference for one exported symbol, generated from source by scripts/gen-docs.mjs. */
@Component({
  selector: 'docs-api-table',
  imports: [InlineMarkupPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = item();
    <div class="api">
      <h3 class="api__name">
        <code>{{ a.name }}</code>
        <span class="api__kind">{{ a.kind }}</span>
      </h3>
      @if (a.selector || a.exportAs || (a.entryPoint && a.entryPoint !== pageEntryPoint())) {
        <p class="api__meta">
          @if (a.entryPoint && a.entryPoint !== pageEntryPoint()) {
            <span>From: <code>{{ a.entryPoint }}</code></span>
          }
          @if (a.selector) {
            <span>Selector: <code>{{ a.selector }}</code></span>
          }
          @if (a.exportAs) {
            <span>Exported as: <code>{{ a.exportAs }}</code></span>
          }
        </p>
      }
      @if (a.description) {
        <p class="api__description" [innerHTML]="a.description | inlineMarkup"></p>
      }
      @if (a.signature) {
        <pre class="api__signature"><code>{{ a.signature }}</code></pre>
      }
      @if (a.inputs?.length) {
        <div class="api__scroll" tabindex="0" role="region" [attr.aria-label]="a.name + ' inputs'">
          <table>
            <caption>Inputs</caption>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>
              @for (i of a.inputs; track i.name) {
                <tr>
                  <td>
                    <code class="api__prop">{{ i.twoWay ? '[(' + i.name + ')]' : '[' + i.name + ']' }}</code>
                    @if (i.required) {
                      <span class="api__required">required</span>
                    }
                  </td>
                  <td><code class="api__type">{{ i.type }}</code></td>
                  <td>
                    @if (i.default) {
                      <code>{{ i.default }}</code>
                    } @else {
                      <span aria-label="none">—</span>
                    }
                  </td>
                  <td [innerHTML]="i.description | inlineMarkup"></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @if (a.outputs?.length) {
        <div class="api__scroll" tabindex="0" role="region" [attr.aria-label]="a.name + ' outputs'">
          <table>
            <caption>Outputs</caption>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Payload</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>
              @for (o of a.outputs; track o.name) {
                <tr>
                  <td><code class="api__prop">({{ o.name }})</code></td>
                  <td><code class="api__type">{{ o.type }}</code></td>
                  <td [innerHTML]="o.description | inlineMarkup"></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @if (a.methods?.length || a.properties?.length) {
        <div class="api__scroll" tabindex="0" role="region" [attr.aria-label]="a.name + ' members'">
          <table>
            <caption>Methods and properties</caption>
            <thead>
              <tr><th scope="col">Member</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>
              @for (m of a.properties; track m.name) {
                <tr>
                  <td><code class="api__type">{{ m.name }}: {{ m.type }}</code></td>
                  <td [innerHTML]="m.description | inlineMarkup"></td>
                </tr>
              }
              @for (m of a.methods; track m.name) {
                <tr>
                  <td><code class="api__type">{{ m.signature }}</code></td>
                  <td [innerHTML]="m.description | inlineMarkup"></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './api-table.scss',
})
export class ApiTable {
  readonly item = input.required<ApiItem>();
  /** Entry point of the page; items from another entry point show where they are imported from. */
  readonly pageEntryPoint = input<string>();
}
