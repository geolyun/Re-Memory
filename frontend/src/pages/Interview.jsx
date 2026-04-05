import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Upload, Trash2, Check, BookOpen, Loader2, ImagePlus, Clock, Share2, Copy, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'

const TIME_PERIODS = [
  { value: '', label: '시기 선택 (선택)' },
  { value: '유년기', label: '👶 유년기 (초등학교 이전)' },
  { value: '청소년기', label: '🎒 청소년기 (초·중·고)' },
  { value: '청년기', label: '🌱 청년기 (20대)' },
  { value: '결혼·가정기', label: '💑 결혼·가정기 (30~40대)' },
  { value: '중장년기', label: '🏡 중장년기 (50~60대)' },
  { value: '노년기', label: '🌿 노년기 (70대 이상)' },
]

export default function Interview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [qnas, setQnas] = useState([])
  const [idx, setIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')
  const [shareToken, setShareToken] = useState(null)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [copied, setCopied] = useState(false)
  const timers = useRef({})
  const qnasRef = useRef([])
  const idxRef = useRef(0)

  useEffect(() => {
    api.getProject(id).then(({ project, qnas }) => {
      setProject(project)
      setQnas(qnas)
      if (project.share_token) setShareToken(project.share_token)
    }).catch(() => navigate('/'))
  }, [id, navigate])

  // refs를 최신 상태와 동기화
  useEffect(() => { qnasRef.current = qnas }, [qnas])
  useEffect(() => { idxRef.current = idx }, [idx])

  // unmount 또는 페이지 이탈 시 대기 중인 저장 flush
  useEffect(() => {
    const flush = () => {
      const cur = qnasRef.current[idxRef.current]
      if (!cur) return
      clearTimeout(timers.current[cur.id])
      api.saveAnswerBeacon(id, cur.id, cur.answer, false, cur.time_period)
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [id])

  const cur = qnas[idx]

  const scheduleAutoSave = useCallback((qnaId, answer, timePeriod) => {
    clearTimeout(timers.current[qnaId])
    timers.current[qnaId] = setTimeout(async () => {
      try {
        await api.saveAnswer(id, qnaId, answer, false, timePeriod)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (e) {
        setError(`자동 저장 실패: ${e.message}`)
      }
    }, 800)
  }, [id])

  const handleAnswerChange = (answer) => {
    setQnas(prev => prev.map((q, i) => i === idx ? { ...q, answer } : q))
    scheduleAutoSave(cur.id, answer, cur.time_period)
    setSaved(false)
  }

  const handleTimePeriodChange = async (timePeriod) => {
    setQnas(prev => prev.map((q, i) => i === idx ? { ...q, time_period: timePeriod } : q))
    await api.saveAnswer(id, cur.id, cur.answer, cur.skipped, timePeriod).catch(() => {})
  }

  const moveTo = async (nextIdx) => {
    if (cur) {
      clearTimeout(timers.current[cur.id])
      await api.saveAnswer(id, cur.id, cur.answer, cur.skipped, cur.time_period)
        .catch(e => setError(`저장 실패: ${e.message}`))
    }
    setIdx(nextIdx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShare = async () => {
    if (!shareToken) {
      const { share_token } = await api.createShareToken(id)
      setShareToken(share_token)
    }
    setShowSharePanel(p => !p)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = ''
    try {
      const res = await api.uploadPhoto(id, cur.id, file)
      setQnas(prev => prev.map((q, i) => i === idx ? { ...q, photos: [...q.photos, res.photo] } : q))
    } catch (err) { setError(err.message) }
  }

  const handlePhotoDelete = async (photoId) => {
    try {
      await api.deletePhoto(id, photoId)
      setQnas(prev => prev.map((q, i) => i === idx ? { ...q, photos: q.photos.filter(p => p.id !== photoId) } : q))
    } catch (err) { setError(err.message) }
  }

  const handleBuild = async () => {
    if (cur) await api.saveAnswer(id, cur.id, cur.answer, cur.skipped, cur.time_period).catch(() => { })
    setBuilding(true); setError('')
    try {
      await api.buildBook(id)
      navigate(`/projects/${id}/preview`)
    } catch (err) { setError(err.message); setBuilding(false) }
  }

  if (!project || qnas.length === 0) return (
    <div className="text-center py-32 text-slate-400 animate-pulse text-lg font-semibold">
      인터뷰를 준비하는 중입니다...
    </div>
  )

  const progress = ((idx + 1) / qnas.length) * 100

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pb-20">
      {/* Top Navbar / Progress */}
      <div className="glass-panel bg-white/80 p-6 shadow-sm border-slate-200/50 sticky top-4 z-30">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-1">Chapter {cur.chapter_order}</span>
            <span className="text-slate-700 text-sm font-semibold">{cur.chapter_title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-bold transition-all duration-300 flex items-center gap-1.5 px-3 py-1 rounded-full ${saved ? 'bg-green-500/20 text-green-600' : 'opacity-0'}`}>
              <Check className="w-3 h-3" /> 자동 저장됨
            </span>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
              {idx + 1} <span className="opacity-50">/ {qnas.length}</span>
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
          <motion.div
            className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 h-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm shadow-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={cur.id}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* Question Banner */}
          <div className="glass-panel bg-white/80 p-8 md:p-12 text-center flex items-center justify-center min-h-[180px] border-l-4 border-l-primary-500 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 to-transparent z-0" />
            <div className="absolute -top-10 -right-10 text-primary-200 rotate-12 z-0">
              <span className="text-[180px] font-serif leading-none italic">"</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-snug lg:leading-tight text-slate-800 z-10 break-keep drop-shadow-sm">
              {cur.question}
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Textarea area */}
            <div className="w-full flex flex-col gap-3 flex-[2]">
              {cur.hint && (
                <div className="flex items-start gap-2.5 bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3">
                  <span className="text-primary-500 text-base mt-0.5 flex-shrink-0">💡</span>
                  <div>
                    <p className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">작성 도움말</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{cur.hint}</p>
                  </div>
                </div>
              )}

              {/* 인생 시기 선택 */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={cur.time_period || ''}
                  onChange={e => handleTimePeriodChange(e.target.value)}
                  className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 flex-1"
                >
                  {TIME_PERIODS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="glass-panel bg-white/90 p-2 flex flex-col focus-within:ring-2 ring-primary-400/50 transition-all rounded-3xl shadow-sm border-slate-200/50">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-lg p-6 md:p-8 min-h-[350px] text-slate-800 placeholder-slate-300 resize-y leading-[1.8] font-medium"
                  placeholder={cur.placeholder || `${project.subject_name}의 이야기를 편안하게 들려주세요...`}
                  value={cur.answer}
                  onChange={e => handleAnswerChange(e.target.value)}
                />
              </div>
            </div>

            {/* Photo Sidebar */}
            <div className="flex-1 w-full glass-panel bg-white/80 p-6 flex flex-col gap-4 rounded-3xl sticky top-40 shadow-sm border-slate-200/50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-primary-500" /> 소중한 사진
                </h3>
                <span className="text-xs text-slate-400">{cur.photos.length}/5</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                질문과 관련된 사진이 있다면 올려주세요. 첫 번째 사진이 내용의 대표 이미지로 사용됩니다.
              </p>

              <div className="flex flex-col gap-3 mt-2">
                {cur.photos.map((photo, pi) => (
                  <div key={photo.id} className="relative w-full aspect-video rounded-xl overflow-hidden group shadow-sm border border-slate-200">
                    <img src={photo.url} alt={`첨부 ${pi + 1}`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                    {pi === 0 && (
                      <span className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">대표</span>
                    )}
                    <button
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}

                {cur.photos.length < 5 && (
                  <label className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-400 flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50/50 transition-all duration-300 group">
                    <Upload className="w-6 h-6 text-slate-300 group-hover:text-primary-400 group-hover:-translate-y-1 transition-all duration-300 mb-2" />
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-500">클릭하여 사진 첨부</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 공동 작성 공유 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 bg-white border border-slate-200 hover:border-primary-300 rounded-2xl px-5 py-3 transition-all w-full shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          가족과 함께 작성하기 (공유 링크)
        </button>

        <AnimatePresence>
          {showSharePanel && shareToken && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel bg-white/90 p-6 flex flex-col gap-4 border border-indigo-100 shadow-sm">
                <div>
                  <p className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-500" /> 공동 작성 링크
                  </p>
                  <p className="text-xs text-slate-500">이 링크를 가족에게 공유하면 질문에 답변을 추가할 수 있습니다.</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 font-mono truncate">
                    {`${window.location.origin}/share/${shareToken}`}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                  >
                    {copied ? <><CheckCheck className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 복사</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-4 mt-4">
        <button onClick={() => moveTo(idx - 1)} disabled={idx === 0} className="btn-secondary w-1/3 py-5 disabled:opacity-30">
          <ChevronLeft className="w-5 h-5 mr-1" /> 이전 질문
        </button>
        {idx < qnas.length - 1 ? (
          <button onClick={() => moveTo(idx + 1)} className="btn-primary flex-1 py-5 text-lg">
            이야기 남기기 <ChevronRight className="w-6 h-6 ml-1" />
          </button>
        ) : (
          <button onClick={handleBuild} disabled={building} className="btn-primary flex-1 py-5 text-lg disabled:opacity-50 group">
            {building
              ? <><Loader2 className="w-6 h-6 animate-spin" /> 책으로 엮고 있습니다...</>
              : <><BookOpen className="w-6 h-6 mr-1 group-hover:rotate-12 transition-transform" /> 회고록 미리보기 생성</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
