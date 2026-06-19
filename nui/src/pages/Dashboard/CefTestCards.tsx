// ============================================================
// CefTestCards
// Validation UI for CEF/OSR rendering behaviour.
// Each card has a static box so it's obvious when content vanishes.
// ============================================================

export function CefTestCards() {
  return (
    <div className="card">
      <div className="card-header">
        <p className="card-title">CEF Rendering Tests</p>
      </div>
      <div className="cef-tests-grid">
        {/* @keyframes + transform: rotate (spinner) */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + transform: rotate</span>
          <span className="cef-test-expected">⚠ may go invisible in CEF OSR</span>
          <div className="cef-test-box">
            <div className="cef-test-spin" />
          </div>
        </div>

        {/* @keyframes + transform: scale (pulse) */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + transform: scale</span>
          <span className="cef-test-expected">⚠ may go invisible in CEF OSR</span>
          <div className="cef-test-box">
            <div className="cef-test-pulse-scale" />
          </div>
        </div>

        {/* @keyframes + transform: translateY (bounce) */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + transform: translateY</span>
          <span className="cef-test-expected">⚠ may go invisible in CEF OSR</span>
          <div className="cef-test-box">
            <div className="cef-test-bounce" />
          </div>
        </div>

        {/* @keyframes + opacity only */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + opacity only</span>
          <span className="cef-test-expected">✓ should work (no transform)</span>
          <div className="cef-test-box">
            <div className="cef-test-pulse-opacity" />
          </div>
        </div>

        {/* @keyframes + margin (toast-style slide) */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + margin</span>
          <span className="cef-test-expected">✓ should work (no transform)</span>
          <div className="cef-test-box cef-test-slide-box">
            <div className="cef-test-slide-bar" />
          </div>
        </div>

        {/* @keyframes + background-position (shimmer) */}
        <div className="cef-test-card">
          <span className="cef-test-label">@keyframes + background-position</span>
          <span className="cef-test-expected">✓ should work (no transform)</span>
          <div className="cef-test-box">
            <div className="cef-test-shimmer" />
          </div>
        </div>

        {/* transition + transform (hover scale) */}
        <div className="cef-test-card">
          <span className="cef-test-label">transition + transform (hover)</span>
          <span className="cef-test-expected">✓ should work (transition, not keyframes)</span>
          <div className="cef-test-box">
            <div className="cef-test-hover-scale" />
          </div>
        </div>

        {/* box-shadow 32px blur */}
        <div className="cef-test-card">
          <span className="cef-test-label">box-shadow 0 8px 32px</span>
          <span className="cef-test-expected">⚠ large blur may go invisible</span>
          <div className="cef-test-box">
            <div className="cef-test-shadow-box" />
          </div>
        </div>

        {/* box-shadow 16px blur (safe) */}
        <div className="cef-test-card">
          <span className="cef-test-label">box-shadow 0 4px 16px</span>
          <span className="cef-test-expected">✓ should work (safe blur)</span>
          <div className="cef-test-box">
            <div className="cef-test-shadow-safe" />
          </div>
        </div>

        {/* backdrop-filter */}
        <div className="cef-test-card">
          <span className="cef-test-label">backdrop-filter: blur(8px)</span>
          <span className="cef-test-expected">✓ should work (documented as safe)</span>
          <div className="cef-test-box">
            <div className="cef-test-backdrop">
              <span className="text-xs text-primary">blur</span>
            </div>
          </div>
        </div>

        {/* will-change: transform */}
        <div className="cef-test-card">
          <span className="cef-test-label">will-change: transform (static)</span>
          <span className="cef-test-expected">✓ should work (no animation, just GPU layer)</span>
          <div className="cef-test-box">
            <div className="cef-test-will-change" />
          </div>
        </div>
      </div>
    </div>
  )
}
