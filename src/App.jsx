import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import Students from './pages/Students'
import ConflictGraphPage from './pages/ConflictGraphPage'
import GenerateTimetable from './pages/GenerateTimetable'
import Timetable from './pages/Timetable'
import AlgorithmAnalysis from './pages/AlgorithmAnalysis'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="students" element={<Students />} />
        <Route path="conflict-graph" element={<ConflictGraphPage />} />
        <Route path="generate" element={<GenerateTimetable />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="analysis" element={<AlgorithmAnalysis />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
