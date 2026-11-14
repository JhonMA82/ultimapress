import { describe, it, expect } from 'vitest'
import { cleanDesignHtml } from '@/utilities/designSafety'
describe('embeds', () => {
  it('keeps youtube, vimeo, maps; drops others', () => {
    const out = cleanDesignHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="//player.vimeo.com/video/1"></iframe><iframe src="https://maps.google.com/maps?q=x&output=embed"></iframe><iframe src="https://evil.com/x"></iframe><iframe src="javascript:alert(1)"></iframe><iframe srcdoc="<script>1</script>"></iframe><script>x</script>')
    expect(out).toContain('/embed/abc')
    expect(out).toContain('https://player.vimeo.com/video/1')
    expect(out).toContain('maps.google.com')
    expect(out).not.toContain('evil')
    expect(out).not.toContain('javascript')
    expect(out).not.toContain('srcdoc')
    expect(out.match(/<iframe/g)?.length).toBe(3)
  })
})
