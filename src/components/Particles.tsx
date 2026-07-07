import { useEffect, useRef } from 'react'

export default function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('span')
      const size = 2 + Math.random() * 3
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}vw;
        animation-duration: ${8 + Math.random() * 12}s;
        animation-delay: -${Math.random() * 15}s;
      `
      container.appendChild(p)
    }
  }, [])

  return <div className="particles" ref={containerRef}></div>
}
