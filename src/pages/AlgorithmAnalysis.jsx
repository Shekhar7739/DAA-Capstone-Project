import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Gauge,
  Loader2,
  Network,
  Play,
  Timer,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import { generateRandomGraph } from '../utils/dataGenerator'
import { solveGraphColoring } from '../algorithms/graphColoring'

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 12px 32px -12px rgba(15,23,42,.25)' },
  labelStyle: { fontWeight: 700, color: '#0f172a' },
}

function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-slate-500"><Icon size={16} /><span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
    </div>
  )
}

function ChartPanel({ title, subtitle, data, xKey, lines, xLabel }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4 h-60">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: xLabel, position: 'insideBottomRight', offset: -2, fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              {lines.map((line) => <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">Run a benchmark to generate measured results</div>
        )}
      </div>
    </section>
  )
}

function runExperiment(graph) {
  const result = solveGraphColoring(graph, { nodeLimit: 40000, timeLimitMs: 700 })
  return {
    vertices: graph.vertices.length,
    edges: graph.edgeCount,
    density: graph.density,
    colors: result.colorsUsed,
    attempts: result.attempts,
    backtracks: result.backtracks,
    nodes: result.nodesVisited,
    timeMs: Number(result.executionMs.toFixed(3)),
    success: result.success,
    optimal: result.optimal,
  }
}

export default function AlgorithmAnalysis() {
  const { subjects, conflictGraph, timetable, minimumSlots } = useApp()
  const [size, setSize] = useState(10)
  const [density, setDensity] = useState(0.35)
  const [seed, setSeed] = useState(42)
  const [busy, setBusy] = useState('')
  const [customRun, setCustomRun] = useState(null)
  const [sizeSeries, setSizeSeries] = useState([])
  const [densitySeries, setDensitySeries] = useState([])

  const liveDensity = subjects.length > 1 ? (2 * conflictGraph.edgeCount) / (subjects.length * (subjects.length - 1)) : 0
  const allRuns = useMemo(() => [customRun, ...sizeSeries, ...densitySeries].filter(Boolean), [customRun, sizeSeries, densitySeries])

  const execute = (label, work) => {
    setBusy(label)
    setTimeout(() => {
      work()
      setBusy('')
    }, 30)
  }

  const runCustom = () => execute('custom', () => setCustomRun(runExperiment(generateRandomGraph(size, density, seed))))

  const runSizeBenchmark = () => execute('size', () => {
    const results = [5, 8, 11, 14, 17, 20].map((vertexCount, index) => ({
      size: vertexCount,
      ...runExperiment(generateRandomGraph(vertexCount, 0.3, seed + index * 17)),
    }))
    setSizeSeries(results.map((item) => ({ size: item.size, edges: item.edges, timeMs: item.timeMs, colors: item.colors })))
  })

  const runDensityStudy = () => execute('density', () => {
    const results = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((value, index) => ({
      density: value,
      ...runExperiment(generateRandomGraph(size, value, seed + index * 13)),
    }))
    setDensitySeries(results.map((item) => ({ density: Number(item.density.toFixed(2)), colors: item.colors, edges: item.edges, timeMs: item.timeMs })))
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Algorithm Analysis"
        description="Inspect performance on the real university data and run reproducible experiments on generated test graphs."
        badge={<span className="badge bg-violet-50 text-violet-700">Backtracking + degree ordering</span>}
      />

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">
        <FlaskConical size={16} className="shrink-0" />
        <span><strong>Data provenance:</strong> metrics below are measured with <code>performance.now()</code>. Charts and the simulation table use generated test graphs only — they are clearly separated from live university data.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Network} label="Vertices" value={subjects.length} note="Subjects in live conflict graph" />
        <Metric icon={Activity} label="Edges / conflicts" value={conflictGraph.edgeCount} note="Subject pairs with shared students" />
        <Metric icon={Gauge} label="Colors used" value={timetable?.metrics.colorsUsed ?? minimumSlots} note={timetable ? 'From generated timetable' : 'Minimum computed live'} />
        <Metric icon={Timer} label="Execution time" value={`${(timetable?.metrics.executionMs ?? 0).toFixed(2)} ms`} note={timetable ? 'Measured on last generation' : 'Generate a timetable to measure'} />
      </div>

      <section className="card mt-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Simulation laboratory</h2>
            <p className="mt-0.5 text-xs text-slate-500">Generate graphs programmatically and time the same solver used for real scheduling.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={runSizeBenchmark} disabled={!!busy} className="btn-secondary"><BarChart3 size={16} /> {busy === 'size' ? <Loader2 size={16} className="animate-spin" /> : null} Run size benchmark</button>
            <button type="button" onClick={runDensityStudy} disabled={!!busy} className="btn-secondary"><Gauge size={16} /> {busy === 'density' ? <Loader2 size={16} className="animate-spin" /> : null} Run density study</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-base">Graph size: {size} vertices</label>
            <input type="range" min="4" max="20" value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full accent-brand-600" />
          </div>
          <div>
            <label className="label-base">Edge density: {density.toFixed(2)}</label>
            <input type="range" min="0.05" max="0.9" step="0.05" value={density} onChange={(event) => setDensity(Number(event.target.value))} className="w-full accent-brand-600" />
          </div>
          <div>
            <label className="label-base">Random seed</label>
            <input type="number" min="1" max="99999" className="input-base" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 1)} />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={runCustom} disabled={!!busy} className="btn-primary w-full">
              {busy === 'custom' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run custom graph
            </button>
          </div>
        </div>

        {customRun && (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 lg:grid-cols-8">
            {[
              ['Vertices', customRun.vertices], ['Edges', customRun.edges], ['Density', customRun.density.toFixed(2)],
              ['Colors', customRun.colors], ['Attempts', customRun.attempts], ['Backtracks', customRun.backtracks],
              ['Nodes', customRun.nodes], ['Time', `${customRun.timeMs} ms`],
            ].map(([label, value]) => <div key={label}><p className="text-[11px] text-slate-400">{label}</p><p className="text-sm font-bold text-slate-800">{value}</p></div>)}
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartPanel title="Subjects vs execution time" subtitle="Size benchmark · measured solver time" data={sizeSeries} xKey="size" lines={[{ key: 'timeMs', name: 'Time (ms)', color: '#6366f1' }]} xLabel="Vertices" />
        <ChartPanel title="Conflicts vs execution time" subtitle="Same benchmark runs, plotted against edge count" data={sizeSeries} xKey="edges" lines={[{ key: 'timeMs', name: 'Time (ms)', color: '#0ea5e9' }]} xLabel="Edges" />
      </div>
      <div className="mt-5">
        <ChartPanel title="Graph density vs colors used" subtitle="Density study at the configured graph size" data={densitySeries} xKey="density" lines={[{ key: 'colors', name: 'Colors', color: '#10b981' }, { key: 'edges', name: 'Edges', color: '#f59e0b' }]} xLabel="Density" />
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Simulation results</h2>
          <p className="mt-0.5 text-xs text-slate-500">Generated test graphs · no university data is included here</p>
        </div>
        {allRuns.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">Run an experiment above to record actual algorithm measurements.</p>
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead><tr><th>Graph</th><th>Vertices</th><th>Edges</th><th>Density</th><th>Colors</th><th>Attempts</th><th>Backtracks</th><th>Nodes</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {allRuns.map((run, index) => (
                  <tr key={index}>
                    <td className="font-semibold text-slate-800">Run {index + 1}</td>
                    <td>{run.vertices}</td><td>{run.edges}</td><td>{run.density.toFixed(2)}</td>
                    <td><span className="badge bg-brand-50 text-brand-700">{run.colors}</span></td>
                    <td>{run.attempts}</td><td>{run.backtracks}</td><td>{run.nodes}</td>
                    <td>{run.timeMs} ms</td>
                    <td><span className={`badge ${run.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{run.success ? run.optimal ? 'Optimal' : 'Valid' : 'Limited'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><BookOpen size={18} /></span><h2 className="text-sm font-bold text-slate-900">Graph Coloring explained</h2></div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p><strong className="text-slate-800">Graph coloring</strong> assigns a label (color) to every vertex so that connected vertices never share a label.</p>
            <p><strong className="text-slate-800">Why exam scheduling?</strong> Exams for subjects taken by the same student cannot happen at the same time. Modelling subjects as vertices and shared students as edges turns the problem into finding the fewest colors — the fewest exam slots.</p>
            <ul className="space-y-2">
              {[
                ['Vertex', 'A subject that needs an exam slot.'],
                ['Edge', 'A conflict: at least one student takes both subjects.'],
                ['Color', 'An exam slot (a date + session).'],
                ['Conflict', 'A constraint enforced by the edge.'],
                ['Backtracking', 'Try a colour, recurse; if it fails later, undo it and try the next colour.'],
              ].map(([term, definition]) => (
                <li key={term} className="rounded-lg bg-slate-50 px-3 py-2"><strong className="text-slate-800">{term}:</strong> {definition}</li>
              ))}
            </ul>
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-brand-800">The implementation orders vertices by descending degree, tries k from a clique-based lower bound upward, and stops at the first valid k — proving the minimum when no search limit is hit.</p>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><BrainCircuit size={18} /></span><h2 className="text-sm font-bold text-slate-900">Algorithm complexity</h2></div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>In the worst case the algorithm may try up to <strong className="text-slate-800">k choices for each of n subjects</strong>, so the time complexity is <code className="rounded bg-slate-100 px-1.5 py-0.5">O(kⁿ)</code> — exponential. Adding one subject can multiply the work.</p>
            <p>The recursion stack holds at most n assignments, and the adjacency list stores O(V + E) information, so auxiliary space is <strong className="text-slate-800">O(V + E)</strong> plus the stack.</p>
            <p>Graph coloring is NP-hard, so no known algorithm solves every large instance instantly. Degree ordering, symmetry breaking, clique lower bounds, node limits and time limits keep this implementation practical while preserving correctness.</p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">If a run reports “Limited”, a search bound was reached; the returned coloring is still valid, but minimality is not proven.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
