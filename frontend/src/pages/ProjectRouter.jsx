import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function ProjectRouter() {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    api.getProject(id).then(({ project }) => {
      if (project.read_only) {
        navigate(`/projects/${id}/timeline`, { replace: true })
        return
      }
      const s = project.status
      if (s === 'ordered') navigate(`/projects/${id}/complete`, { replace: true })
      else if (s === 'finalized') navigate(`/projects/${id}/order`, { replace: true })
      else if (s === 'preview_ready') navigate(`/projects/${id}/preview`, { replace: true })
      else navigate(`/projects/${id}/interview`, { replace: true })
    }).catch(() => navigate('/', { replace: true }))
  }, [id, navigate])

  return (
    <div className="flex items-center justify-center py-32 text-white/50">
      이동 중...
    </div>
  )
}
