import React from "react"

export default function BroadcastSignal() {
  return (
    <div className="broadcast-signal" aria-hidden="true">
      <span className="broadcast-signal-label">INDEPENDENT FREQUENCIES</span>
      <svg viewBox="0 0 600 440" fill="none">
        <path d="M0 110H600M0 220H600M0 330H600M150 0V440M300 0V440M450 0V440" className="broadcast-signal-grid" />
        <g transform="rotate(-28 300 220)" className="broadcast-signal-orbit">
          <ellipse cx="300" cy="220" rx="232" ry="147" />
          <ellipse cx="300" cy="220" rx="232" ry="93" />
          <ellipse cx="300" cy="220" rx="232" ry="35" />
          <ellipse cx="300" cy="220" rx="146" ry="147" />
          <ellipse cx="300" cy="220" rx="58" ry="147" />
          <path d="M68 220H532M300 73V367" />
        </g>
        <circle cx="300" cy="220" r="80" className="broadcast-signal-core" />
        <path d="M252 220H348M300 172V268" className="broadcast-signal-cross" />
        <circle cx="505" cy="110" r="10" className="broadcast-signal-core" />
      </svg>
      <span className="broadcast-signal-coordinate">TRANSMISSION / 001</span>
    </div>
  )
}
