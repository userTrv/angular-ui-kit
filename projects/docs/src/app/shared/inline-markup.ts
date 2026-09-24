import { Pipe, PipeTransform } from '@angular/core';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Tiny, safe subset of Markdown for doc strings: `code`, **bold** and [links](#/path). */
@Pipe({ name: 'inlineMarkup' })
export class InlineMarkupPipe implements PipeTransform {
  transform(text: string | undefined): string {
    if (!text) return '';
    return escape(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((#[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  }
}
