import { Fragment, useState, useMemo, useCallback, useRef, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CodeSnippet } from '../../../types'
import { tokenizeLine } from '../luaHighlight'
import { KNOWN_PATTERNS, type SnippetHint } from '../snippetHints'

interface CodeSnippetProps {
  snippet: CodeSnippet
  filePath: string
  resource: string
  onClose: () => void
}

export function CodeSnippet({ snippet, filePath, resource, onClose }: CodeSnippetProps) {
  const [hoveredHint, setHoveredHint] = useState<{ x: number; y: number; hint: SnippetHint } | null>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  // Pre-compute tokens and hints for each line
  const enrichedLines = useMemo(() => {
    return snippet.lines.map((line) => {
      const tokens = tokenizeLine(line.content)
      const hints = findHints(line.content)
      return { ...line, tokens, hints }
    })
  }, [snippet])

  const handleHintMouseEnter = useCallback((e: MouseEvent<HTMLSpanElement>, hint: SnippetHint) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setHoveredHint({
      x: rect.left + rect.width / 2,
      y: rect.top,
      hint,
    })
  }, [])

  const handleHintMouseLeave = useCallback(() => {
    setHoveredHint(null)
  }, [])

  return (
    <Fragment>
      <div className="profiler-code-snippet">
        {/* Header */}
        <div className="profiler-code-header">
          <span className="profiler-code-path" title={`${resource}/${filePath}`}>
            {resource}/{filePath}
          </span>
          <span className="profiler-code-range">
            lines {snippet.windowStart}-{snippet.windowEnd}
            <span className="profiler-code-range-target"> (hot: {snippet.targetRange})</span>
          </span>
          <button className="profiler-code-close" onClick={onClose} aria-label="Close snippet">
            &times;
          </button>
        </div>

        {/* Code block */}
        <div className="profiler-code-block" ref={lineRef}>
          {enrichedLines.map((line) => (
            <div
              key={line.number}
              className={`profiler-code-line${line.highlighted ? ' profiler-code-line--hot' : ''}`}
            >
              <span className="profiler-code-line-number">{line.number}</span>
              <span className="profiler-code-line-content">
                {line.tokens.map((token, idx) => {
                  // Check if this token matches any known hint pattern
                  const isHintable = token.className !== 'code-comment'
                  const matchingHint = isHintable
                    ? line.hints.find((h) => h.pattern.test(token.text))
                    : null

                  if (matchingHint) {
                    return (
                      <span
                        key={idx}
                        className={`code-token ${token.className} profiler-code-hint-word`}
                        title={matchingHint.label}
                        onMouseEnter={(e) => handleHintMouseEnter(e, matchingHint)}
                        onMouseLeave={handleHintMouseLeave}
                      >
                        {token.text}
                      </span>
                    )
                  }

                  return (
                    <span key={idx} className={`code-token ${token.className}`}>
                      {token.text}
                    </span>
                  )
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip — portal to .ea-window to escape overflow clipping while keeping style context */}
      {hoveredHint && createPortal(
        <div
          className="profiler-code-tooltip"
          // eslint-disable-next-line nui/no-inline-styles
          style={{
            left: `${hoveredHint.x}px`,
            top: `${hoveredHint.y}px`,
          }}
        >
          <div className="profiler-code-tooltip-label">{hoveredHint.hint.label}</div>
          <div className="profiler-code-tooltip-desc">{hoveredHint.hint.description}</div>
        </div>,
        document.querySelector('.ea-window') ?? document.body,
      )}
    </Fragment>
  )
}

// Find all matching hints for a line of code
function findHints(content: string): SnippetHint[] {
  const matches: SnippetHint[] = []
  for (const hint of KNOWN_PATTERNS) {
    if (hint.pattern.test(content)) {
      matches.push(hint)
    }
  }
  return matches
}
