/**
 * A designed section's CSS has two parts: what was written for it (by Claude or by
 * hand) and, after a marker, the styles added in the visual builder. Keeping them
 * apart means the builder never rewrites the original styles.
 */
export const BUILDER_MARKER = '/* up-visual-builder */'

export function splitBuilderCss(css: string | null | undefined): { base: string; builder: string } {
  const text = css || ''
  const at = text.indexOf(BUILDER_MARKER)
  if (at === -1) return { base: text, builder: '' }
  return { base: text.slice(0, at).trimEnd(), builder: text.slice(at + BUILDER_MARKER.length).trim() }
}

export function joinBuilderCss(base: string, builder: string): string {
  const b = base.trimEnd()
  const extra = builder.trim()
  if (!extra) return b
  return `${b}${b ? '\n\n' : ''}${BUILDER_MARKER}\n${extra}\n`
}
