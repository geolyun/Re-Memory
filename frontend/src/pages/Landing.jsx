import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Clock, ChevronRight, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'

const STATUS = {
  writing: { label: '작성중', color: 'bg-slate-100 text-slate-600 border border-slate-200' },
  building: { label: '빌드중', color: 'bg-primary-50 text-primary-600 border border-primary-200' },
  preview_ready: { label: '미리보기', color: 'bg-amber-50 text-amber-600 border border-amber-200' },
  finalized: { label: '확정됨', color: 'bg-blue-50 text-blue-600 border border-blue-200' },
  ordered: { label: '주문완료', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getEmoji(rel) {
  if (['아버지', '어머니'].includes(rel)) return '🧓'
  if (['할아버지', '할머니', '외할아버지', '외할머니'].includes(rel)) return '👴'
  if (['배우자'].includes(rel)) return '💍'
  if (['본인'].includes(rel)) return '🎓'
  return '📖'
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function Landing() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e, projectId) => {
    e.stopPropagation()
    if (!confirm('이 인터뷰북을 삭제하시겠습니까?\n삭제 후 되돌릴 수 없습니다.')) return
    setDeleting(projectId)
    try {
      await api.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (err) {
      alert(`삭제 실패: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-10 w-full items-center pb-12 mt-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full relative rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-orange-50 z-0" />
        <div className="absolute inset-0 bg-[url('/stardust.png')] opacity-40 z-0 mix-blend-multiply" />
        <div className="glass-panel relative z-10 p-12 md:p-24 text-center flex flex-col items-center gap-8 w-full border border-white/80 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.15)] bg-white/40 backdrop-blur-3xl">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-800 drop-shadow-sm">
              가족의 기억을 <br /> 한 권의 책으로
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-lg md:text-xl text-slate-600 max-w-2xl font-medium leading-relaxed">
            사랑하는 사람들의 인생 이야기를 모아 세상에 단 하나뿐인 회고록을 만들어보세요.
          </motion.p>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <Link to="/projects/new" className="btn-primary w-full md:w-auto mt-6 group text-lg px-10 py-5 items-center font-bold">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 text-white" />
              <span className="text-white">시작하기</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full mt-2">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-extrabold flex items-center gap-3 text-slate-800">
            <BookOpen className="w-6 h-6 text-primary-500" /> 나의 인터뷰북
          </h2>
        </div>

        {loading ? (
          <div className="glass-panel bg-white/60 p-16 text-center text-slate-400 animate-pulse font-semibold">
            기억을 불러오는 중...
          </div>
        ) : projects.length === 0 ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel bg-white/60 p-16 text-center flex flex-col items-center border-slate-100">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-primary-100">
              <BookOpen className="w-10 h-10 text-primary-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">아직 만든 인터뷰북이 없습니다.</p>
            <p className="text-slate-500 mt-2 font-medium">첫 번째 회고록을 시작해 새로운 기억을 기록해보세요.</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6">
            {projects.map(p => {
              const s = STATUS[p.status] ?? STATUS.writing
              return (
                <motion.button
                  variants={item}
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="glass-panel p-6 flex gap-5 items-start text-left hover:border-primary-200 hover:bg-white transition-all duration-300 w-full group relative overflow-hidden bg-white/70"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-50/50 to-primary-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="w-16 h-24 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.08)] border border-slate-200 group-hover:scale-105 transition-transform duration-500 z-10" style={{ minHeight: 96 }}>
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt="표지" className="w-full h-full object-cover" />
                      : <span className="text-4xl saturate-50 opacity-60 group-hover:saturate-100 group-hover:opacity-100 transition-all duration-500 drop-shadow-sm">{getEmoji(p.relationship_type)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col h-full justify-between z-10">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5 mt-0.5">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-800 truncate group-hover:text-primary-600 transition-colors drop-shadow-sm">{p.title}</span>
                          {p.is_demo && (
                            <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-bold tracking-wider border border-sky-200 bg-sky-50 text-sky-600">DEMO</span>
                          )}
                        </div>
                        <span className={`flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-slate-600 text-sm font-semibold">{p.subject_name} <span className="text-slate-400">({p.relationship_type})</span></p>
                      {p.subtitle && <p className="text-slate-500 text-xs mt-1.5 truncate italic">"{p.subtitle}"</p>}
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <p className="text-slate-400 text-xs flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> 업데이트: {fmtDate(p.updated_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (p.is_demo) return
                            if (p.status === 'ordered') {
                              alert('주문을 먼저 취소해주세요.')
                              return
                            }
                            handleDelete(e, p.id)
                          }}
                          disabled={deleting === p.id || p.is_demo}
                          className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 opacity-0 group-hover:opacity-100 ${p.status === 'ordered' || p.is_demo ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-400 hover:bg-red-50'}`}
                          title={p.status === 'ordered' ? '주문을 먼저 취소해주세요' : '프로젝트 삭제'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
