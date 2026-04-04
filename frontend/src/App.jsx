import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import ProjectCreate from './pages/ProjectCreate'
import ProjectRouter from './pages/ProjectRouter'
import Interview from './pages/Interview'
import Preview from './pages/Preview'
import Order from './pages/Order'
import Complete from './pages/Complete'
import Credits from './pages/Credits'
import Timeline from './pages/Timeline'
import SharedInterview from './pages/SharedInterview'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:id" element={<ProjectRouter />} />
        <Route path="projects/:id/interview" element={<Interview />} />
        <Route path="projects/:id/timeline" element={<Timeline />} />
        <Route path="projects/:id/preview" element={<Preview />} />
        <Route path="projects/:id/order" element={<Order />} />
        <Route path="projects/:id/complete" element={<Complete />} />
        <Route path="credits" element={<Credits />} />
        <Route path="share/:token" element={<SharedInterview />} />
      </Route>
    </Routes>
  )
}
