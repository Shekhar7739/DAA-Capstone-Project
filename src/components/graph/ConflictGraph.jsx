import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { colorForSlot, DEPARTMENT_COLORS } from '../../utils/constants'

const WIDTH = 900
const HEIGHT = 540

function computeLayout(subjects, graph) {
  const count = subjects.length
  const positions = {}
  const centerX = WIDTH / 2
  const centerY = HEIGHT / 2
  const radius = Math.min(WIDTH, HEIGHT) * 0.36

  subjects.forEach((subject, index) => {
    const angle = (index / Math.max(1, count)) * Math.PI * 2
    positions[subject.id] = {
      x: centerX + Math.cos(angle) * radius + Math.sin(index * 12.9898) * 14,
      y: centerY + Math.sin(angle) * radius + Math.cos(index * 7.233) * 14,
    }
  })

  const edgeList = graph.edges.map((edge) => [edge.a, edge.b])
  for (let iteration = 0; iteration < 260; iteration += 1) {
    const forces = Object.fromEntries(subjects.map((subject) => [subject.id, { x: 0, y: 0 }]))

    for (let i = 0; i < subjects.length; i += 1) {
      for (let j = i + 1; j < subjects.length; j += 1) {
        const a = subjects[i].id
        const b = subjects[j].id
        let dx = positions[b].x - positions[a].x
        let dy = positions[b].y - positions[a].y
        let distance = Math.hypot(dx, dy)
        if (distance < 1) { dx = 0.5; dy = 0.5; distance = 1 }
        const strength = 42000 / (distance * distance)
        const fx = (dx / distance) * strength
        const fy = (dy / distance) * strength
        forces[a].x -= fx; forces[a].y -= fy
        forces[b].x += fx; forces[b].y += fy
      }
    }

    edgeList.forEach(([a, b]) => {
      if (!positions[a] || !positions[b]) return
      const dx = positions[b].x - positions[a].x
      const dy = positions[b].y - positions[a].y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const ideal = 145
      const strength = (distance - ideal) * 0.035
      const fx = (dx / distance) * strength
      const fy = (dy / distance) * strength
      forces[a].x += fx; forces[a].y += fy
      forces[b].x -= fx; forces[b].y -= fy
    })

    subjects.forEach((subject) => {
      const point = positions[subject.id]
      const force = forces[subject.id]
      point.x += force.x * 0.12 + (centerX - point.x) * 0.012
      point.y += force.y * 0.12 + (centerY - point.y) * 0.012
      point.x = Math.max(70, Math.min(WIDTH - 70, point.x))
      point.y = Math.max(55, Math.min(HEIGHT - 55, point.y))
    })
  }
  return positions
}

export default function ConflictGraph({ subjects, graph, assignment = {}, students = [] }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const draggingRef = useRef(null)
  const baseLayout = useMemo(() => computeLayout(subjects, graph), [subjects, graph])
  const [positions, setPositions] = useState(baseLayout)
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { setPositions(baseLayout); setZoom(1); setSelected(null); setHover(null) }, [baseLayout])

  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const degreeMap = graph.degrees || {}

  const nodeColor = (subject) => {
    if (assignment[subject.id] !== undefined) return colorForSlot(assignment[subject.id]).hex
    return DEPARTMENT_COLORS[subject.department] || '#64748b'
  }

  const toSvgPoint = (event) => {
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return
    const point = toSvgPoint(event)
    const scaled = (zoom - 1) / 2
    setPositions((current) => ({
      ...current,
      [draggingRef.current]: {
        x: Math.max(55, Math.min(WIDTH - 55, point.x / zoom - scaled * WIDTH / zoom)),
        y: Math.max(45, Math.min(HEIGHT - 45, point.y / zoom - scaled * HEIGHT / zoom)),
      },
    }))
  }

  const showTooltip = (event, content) => {
    const rect = containerRef.current.getBoundingClientRect()
    setHover({ x: event.clientX - rect.left, y: event.clientY - rect.top, content })
  }

  if (!subjects.length) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center text-center">
        <p className="font-semibold text-slate-700">No subjects to display</p>
        <p className="mt-1 text-sm text-slate-500">Add subjects and student enrolments to build the conflict graph.</p>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => setZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))} title="Zoom out"><Minus size={14} /></button>
        <span className="min-w-[48px] text-center text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => setZoom((value) => Math.min(1.8, Math.round((value + 0.1) * 10) / 10))} title="Zoom in"><Plus size={14} /></button>
        <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => { setPositions(baseLayout); setZoom(1) }} title="Reset layout"><RotateCcw size={14} /> Reset layout</button>
        <span className="ml-auto hidden items-center gap-1 text-xs text-slate-400 sm:flex"><Maximize2 size={13} /> Drag nodes to explore · hover for details</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-[radial-gradient(circle_at_center,#f8fafc_0,#ffffff_70%)]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[420px] w-full touch-none select-none sm:h-[540px]"
          onPointerMove={handlePointerMove}
          onPointerUp={() => { draggingRef.current = null }}
          onPointerLeave={() => { draggingRef.current = null; setHover(null) }}
        >
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#eef2f7" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />
          <g transform={`translate(${(1 - zoom) * WIDTH / 2} ${(1 - zoom) * HEIGHT / 2}) scale(${zoom})`}>
            {graph.edges.map((edge) => {
              const a = positions[edge.a]
              const b = positions[edge.b]
              if (!a || !b) return null
              const midX = (a.x + b.x) / 2
              const midY = (a.y + b.y) / 2
              return (
                <g key={edge.key}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={Math.min(4, 1 + edge.sharedCount * 0.6)} strokeOpacity={0.85} />
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="transparent" strokeWidth={16} className="cursor-help"
                    onMouseMove={(event) => showTooltip(event, {
                      title: `${subjectMap.get(edge.a)?.code} ↔ ${subjectMap.get(edge.b)?.code}`,
                      lines: [`${edge.sharedCount} shared student${edge.sharedCount === 1 ? '' : 's'}`, edge.sharedStudents.slice(0, 3).map((id) => studentMap.get(id)?.name || id).join(', ') + (edge.sharedStudents.length > 3 ? '…' : '')],
                    })}
                    onMouseLeave={() => setHover(null)}
                  />
                  {edge.sharedCount > 1 && (
                    <g transform={`translate(${midX} ${midY})`} pointerEvents="none">
                      <circle r="11" fill="#fff" stroke="#e2e8f0" />
                      <text textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#e11d48">{edge.sharedCount}</text>
                    </g>
                  )}
                </g>
              )
            })}

            {subjects.map((subject) => {
              const point = positions[subject.id]
              if (!point) return null
              const radius = 22 + Math.min(12, (degreeMap[subject.id] || 0) * 1.4)
              const color = nodeColor(subject)
              const isSelected = selected === subject.id
              return (
                <g
                  key={subject.id}
                  transform={`translate(${point.x} ${point.y})`}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(event) => { draggingRef.current = subject.id; event.currentTarget.setPointerCapture(event.pointerId); setSelected(subject.id) }}
                  onMouseMove={(event) => showTooltip(event, {
                    title: subject.name,
                    lines: [`${subject.code} · Sem ${subject.semester}`, `${degreeMap[subject.id] || 0} conflicts · ${graph.enrollmentCount[subject.id] || 0} enrolled`, assignment[subject.id] !== undefined ? `Exam slot ${assignment[subject.id] + 1}` : 'Slot not assigned'],
                  })}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle r={radius + 7} fill={color} opacity={isSelected ? 0.2 : 0.1} />
                  <circle r={radius} fill="#fff" stroke={color} strokeWidth={isSelected ? 4 : 3} />
                  <circle r={radius - 5} fill={color} opacity={0.12} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="800" fill={color} pointerEvents="none">{subject.code.slice(0, 6)}</text>
                  <text y={radius + 17} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569" pointerEvents="none">{subject.name.length > 18 ? `${subject.name.slice(0, 17)}…` : subject.name}</text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {hover && (
        <div
          className="no-print pointer-events-none absolute z-10 w-56 rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-float backdrop-blur"
          style={{ left: Math.min(hover.x + 14, (containerRef.current?.clientWidth || 500) - 240), top: Math.max(8, hover.y - 20) }}
        >
          <p className="font-bold text-slate-900">{hover.content.title}</p>
          {hover.content.lines.map((line, index) => <p key={index} className="mt-1 text-slate-500">{line}</p>)}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Legend:</span>
        {assignment && Object.keys(assignment).length > 0 ? (
          [...new Set(Object.values(assignment))].sort((a, b) => a - b).map((color) => (
            <span key={color} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorForSlot(color).hex }} /> Slot {color + 1}
            </span>
          ))
        ) : Object.entries(DEPARTMENT_COLORS).map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {name}</span>
        ))}
      </div>
    </div>
  )
}
