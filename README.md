# Exam Scheduler – Intelligent Timetable Generator

A complete React application that generates conflict-free examination timetables by modelling subjects as graph vertices and shared-student overlaps as edges. The scheduler uses a real **Graph Coloring with Backtracking** algorithm to find the minimum number of exam slots, then maps colour classes onto configurable dates and sessions.

## 1. Project overview

| Item | Detail |
| --- | --- |
| Type | Full-stack-style client application (no backend or paid APIs) |
| Stack | React 18, Vite 6, JavaScript, Tailwind CSS 3, React Router 6, Recharts, Lucide React |
| Persistence | Browser LocalStorage (subjects, students/enrolments, timetable, activity log, settings) |
| Algorithm | Exact backtracking k-colouring with degree ordering, clique lower bound and symmetry breaking |
| Sample data | 10 subjects, 20 students, 61 enrolments, 37 conflict edges |

## 2. Implemented features

- **Dashboard** – live statistics, three Recharts visualisations, top conflicts and persistent recent activity.
- **Subjects** – add, edit, delete, search, department/semester filters, sorting and validation.
- **Students** – add, edit, delete, search, filters, multi-subject enrolment picker and validation.
- **Automatic conflict detection** – edges derived from shared enrolments; adjacency list and matrix generated automatically.
- **Conflict graph** – custom interactive SVG graph with force-directed layout, draggable nodes, hover tooltips (node details and shared-student counts), zoom/reset controls, slot/department colours, adjacency list/matrix views.
- **Timetable generation** – configurable start date, days, sessions, duration and capacity; real solver execution with statistics, validation, regeneration, CSV export and print.
- **Timetable view** – calendar grid and table views with department, semester, date and text filters; export/print.
- **Algorithm analysis** – live metrics plus reproducible simulation lab (size benchmark, density study, custom graph) with measured execution times and real charts; terminology and complexity explanations.
- **Settings** – exam defaults, accent colour, interface density, application information, reset-to-sample and clear-all with confirmations.
- **UX** – responsive sidebar/drawer, toasts, empty states, loading states, error messages, keyboard-accessible modals, print stylesheet.

## 3. Algorithm explanation

1. `detectConflicts()` iterates every student's enrolments and records each subject pair as an edge with the number of shared students. It returns vertices, edges, adjacency list, adjacency matrix, degrees and enrolment counts.
2. `calculateMinimumColors()` computes a lower bound from a greedily built clique and an upper bound from a greedy Welsh–Powell colouring.
3. Vertices are ordered by descending degree (ties alphabetically) so highly constrained subjects are coloured first.
4. `graphColoring()` recursively tries existing colours plus one new colour for each vertex. `isSafe()` rejects a colour if an already-coloured neighbour uses it. On failure the assignment is undone (backtrack). Node and time limits guard pathological cases.
5. `solveGraphColoring()` repeats the search for k = lower bound, lower bound + 1, … and stops at the first valid k. If no search hit a limit, that k is proven minimum.
6. `buildSchedule()` converts colour classes to date/session slots. A colour class may be split across several slots to honour the maximum-exams-per-slot setting. The final concrete schedule is validated again against every conflict edge.

Worst-case time complexity is `O(kⁿ)` (exponential — graph colouring is NP-hard). Auxiliary space is `O(V + E)` plus the recursion stack.

## 4. Folder structure

```
src/
├── algorithms/
│   └── graphColoring.js       # buildConflictGraph, isSafe, graphColoring,
│                              # solveGraphColoring, calculateMinimumColors, validateColoring
├── components/
│   ├── common/                # Modal, ConfirmDialog, Field, SearchInput, PageHeader,
│   │                          # EmptyState, ToastContainer
│   ├── dashboard/             # StatCard, DashboardCharts
│   ├── graph/                 # ConflictGraph (custom SVG visualisation)
│   ├── layout/                # AppShell, Sidebar, Header
│   ├── subjects/              # SubjectForm
│   ├── students/              # StudentForm
│   └── timetable/             # TimetableTable, CalendarView
├── context/
│   └── AppContext.jsx         # global state, persistence, CRUD actions, toasts, activity log
├── data/
│   └── sampleData.js          # realistic sample university data and defaults
├── hooks/                     # reserved for future custom hooks
├── pages/                     # Dashboard, Subjects, Students, ConflictGraphPage,
│                              # GenerateTimetable, Timetable, AlgorithmAnalysis, Settings
├── utils/
│   ├── conflictDetection.js   # enrolments -> graph structures
│   ├── constants.js           # colour palettes
│   ├── dataGenerator.js       # seeded random test graphs
│   ├── export.js              # CSV download and print helpers
│   ├── storage.js             # LocalStorage wrapper
│   ├── timetableGenerator.js  # graph -> colouring -> validated schedule
│   └── validation.js          # form and date validation
├── App.jsx                    # router
├── main.jsx                   # entry point
└── index.css                  # Tailwind layers and global styles
scripts/
├── verify.mjs                 # algorithm/timetable assertions (Node)
└── browser-smoke.mjs          # Chrome DevTools Protocol end-to-end smoke test
```

## 5. Installation

```bash
npm install
```

## 6. Running the project

Development server:

```bash
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

Open `http://localhost:5173` (dev) or `http://localhost:4173` (preview).

## 7. Testing results

Commands executed successfully:

- `npm install` – dependencies installed.
- `npm run build` – production build succeeds.
- `npm run verify` – sample data, conflict detection, optimal colouring (6 colours, 37 edges), date validation, timetable generation and three generated graphs all pass.
- `npm run test:browser` (with `npm run preview -- --port 4173` running) – all 8 routes render; subject and student CRUD persist; generated timetable had 11 exams, 6 colours and 0 conflict violations; simulation runs; settings accent changes; CSV export and print work; reset/clear confirmations work; mobile drawer opens; zero console errors and zero JS exceptions.

## 8. Limitations

- LocalStorage is per browser/device; there is no server-side sync or user authentication.
- Exact graph colouring is exponential. Node/time limits keep the UI responsive; a run that hits a limit is marked “Limited” and may not prove minimality.
- Exam dates are consecutive calendar days; holidays and weekends are not modelled.
- The graph view uses a custom SVG implementation rather than a third-party graph library; it supports the interactions required by this project but not advanced features such as edge routing algorithms.
- Simulation sliders are capped at 20 vertices to keep interactive experiments fast.
