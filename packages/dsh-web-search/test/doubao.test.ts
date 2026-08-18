import { describe, expect, it } from 'vitest'
import { mapDoubaoResponse } from '../src/doubao.ts'

describe('mapDoubaoResponse', () => {
  it('collects answer text and url_citation annotations from both nesting styles', () => {
    const result = mapDoubaoResponse({
      output: [
        {
          type: 'web_search_call',
          action: {
            query: 'hot news',
            sources: [{ url: 'https://news.example/from-action', title: 'Action' }],
          },
        },
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: 'Here is the briefing.',
              annotations: [
                { type: 'url_citation', url: 'https://news.example/top', title: 'Top' },
                { type: 'url_citation', url_citation: { url: 'https://news.example/nested', title: 'Nested' } },
                { type: 'url_citation', url: 'https://news.example/top', title: 'Duplicate' },
              ],
            },
          ],
        },
      ],
    })
    expect(result.content).toBe('Here is the briefing.')
    expect(result.sources.map((source) => source.url)).toEqual([
      'https://news.example/from-action',
      'https://news.example/top',
      'https://news.example/nested',
    ])
  })
})
