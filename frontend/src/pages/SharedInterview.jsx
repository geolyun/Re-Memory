import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Clock, Send, User, Image as ImageIcon } from 'lucide-react'
import { api } from '../lib/api'

const TIME_PERIODS = [
  { value: '', label: '시기 선택 (선택)' },
  { value: '유년기', label: '👶 유년기' },
  { value: '청소년기', label: '🎒 청소년기' },
  { value: '청년기', label: '🌱 청년기' },
  { value: '결혼·가정기', label: '💑 결혼·가정기' },
  { value: '중장년기', label: '🏡 중장년기' },
  { value: '노년기', label: '🌿 노년기' },
]

export default function SharedInterview() {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [qnas, setQnas] = useState([])
  const [idx, setIdx] = useState(0)
  const [contributorName, setContributorName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [answer, setAnswer] = useState('')
  const [timePeriod, setTimePeriod] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const timers = useRef({})
  const answerRef = useRef('')
  const timePeriodRef = useRef('')
  const qnasRef = useRef([])
  const idxRef = useRef(0)
  const contributorNameRef = useRef('')

  useEffect(() => {
    api.getSharedProject(token)
      .then(({ project, qnas }) => {
        setProject(project)
        setQnas(qnas)
      })
      .catch(() => setNotFound(true))
  }, [token])

  useEffect(() => {
    if (qnas[idx]) {
      setAnswer(qnas[idx].answer || '')
      setTimePeriod(qnas[idx].time_period || '')
    }
  }, [idx, qnas])

  // refs를 최신 상태와 동기화
  useEffect(() => { answerRef.current = answer }, [answer])
  useEffect(() => { timePeriodRef.current = timePeriod }, [timePeriod])
  useEffect(() => { qnasRef.current = qnas }, [qnas])
  useEffect(() => { idxRef.current = idx }, [idx])
  useEffect(() => { contributorNameRef.current = contributorName }, [contributorName])

  // unmount 또는 페이지 이탈 시 대기 중인 저장 flush
  useEffect(() => {
    const flush = () => {
      const cur = qnasRef.current[idxRef.current]
      if (!cur || !answerRef.current.trim()) return
      clearTimeout(timers.current[cur.id])
      api.saveSharedAnswerBeacon(token, cur.id, answerRef.current, timePeriodRef.current, contributorNameRef.current)
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [token])

  const scheduleAutoSave = useCallback((qnaId, ans, period, name) => {
    clearTimeout(timers.current[qnaId])
    timers.current[qnaId] = setTimeout(async () => {
      try {
        await api.saveSharedAnswer(token, qnaId, ans, period, name)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (e) {
        setError(`자동 저장 실패: ${e.message}`)
      }
    }, 1500)
  }, [token])

  const handleAnswerChange = (e) => {
    const val = e.target.value
    setAnswer(val)
    setSaved(false)
    if (qnas[idx]) {
      scheduleAutoSave(qnas[idx].id, val, timePeriod, contributorName)
      setQnas(prev => prev.map((q, i) => i === idx ? { ...q, answer: val } : q))
    }
  }

  const handleTimePeriodChange = (e) => {
    const val = e.target.value
    setTimePeriod(val)
    setSaved(false)
    if (qnas[idx]) {
      scheduleAutoSave(qnas[idx].id, answer, val, contributorName)
      setQnas(prev => prev.map((q, i) => i === idx ? { ...q, time_period: val } : q))
    }
  }

  const handleSave = async () => {
    if (!answer.trim() || !qnas[idx]) return
    clearTimeout(timers.current[qnas[idx].id])
    setSaving(true)
    setError('')
    try {
      await api.saveSharedAnswer(token, qnas[idx].id, answer, timePeriod, contributorName)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (notFound) return (
    <div className="max-w-lg mx-auto text-center py-32 flex flex-col items-center gap-4">
      <p className="text-6xl">🔒</p>
      <h2 className="text-2xl font-extrabold text-slate-700">유효하지 않은 링크입니다</h2>
      <p className="text-slate-500">공유 링크가 만료되었거나 잘못된 주소입니다.</p>
    </div>
  )

  if (!project) return (
    <div className="text-center py-32 text-slate-400 animate-pulse font-semibold">불러오는 중...</div>
  )

  // 이름 입력 화면
  if (!nameConfirmed) return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-8 py-16 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-5xl mb-4">📖</p>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
          {project.subject_name}의 회고록
        </h1>
        <p className="text-slate-500 font-medium">
          <strong className="text-primary-600">{project.title}</strong> 에 이야기를 함께 남겨주세요.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel bg-white/80 p-8 w-full flex flex-col gap-5 shadow-xl"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" /> 참여자 이름 (답변에 표시됩니다)
          </label>
          <input
            className="glass-input text-lg font-bold"
            placeholder="예: 큰딸 수진"
            value={contributorName}
            onChange={e => setContributorName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setNameConfirmed(true)}
          />
        </div>
        <button
          onClick={() => setNameConfirmed(true)}
          className="btn-primary py-4 text-lg"
        >
          이야기 남기러 가기 →
        </button>
      </motion.div>
    </div>
  )

  const cur = qnas[idx]
  const progress = ((idx + 1) / qnas.length) * 100
  const hasAnswer = cur?.answer && cur.answer.trim()

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-16">
      {/* 헤더 */}
      <div className="glass-panel bg-white/80 p-5 sticky top-4 z-30 shadow-sm border-slate-200/50">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.title}</p>
            <p className="text-sm font-semibold text-slate-600">{cur?.chapter_title}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full transition-all ${saved ? 'bg-green-100 text-green-600' : 'opacity-0'}`}>
              <Check className="w-3 h-3" /> 저장됨
            </span>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
              {idx + 1} / {qnas.length}
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-violet-400 h-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-right font-medium">
          참여자: <span className="text-indigo-600 font-bold">{contributorName}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={cur?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-5"
        >
          {/* 질문 */}
          <div className="glass-panel bg-white/80 p-8 text-center min-h-[160px] flex items-center justify-center border-l-4 border-l-indigo-500 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-transparent" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 z-10 leading-snug break-keep">
              {cur?.question}
            </h2>
          </div>

          {cur?.hint && (
            <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
              <span className="text-indigo-500 mt-0.5">💡</span>
              <p className="text-slate-600 text-sm leading-relaxed">{cur.hint}</p>
            </div>
          )}

          {/* 시기 선택 */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-1"
            >
              {TIME_PERIODS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* 등록된 사진 표시 */}
          {cur?.photos && cur.photos.length > 0 && (
            <div className="flex flex-col gap-2 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <ImageIcon className="w-4 h-4" /> 함께 등록된 사진 ({cur.photos.length}장)
              </span>
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x select-none">
                {cur.photos.map((p, pi) => (
                  <div key={p.id || pi} className="relative w-40 h-28 flex-shrink-0 snap-start rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    <img src={p.url} className="w-full h-full object-cover pointer-events-none" alt={`첨부사진 ${pi + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기존 답변 표시 */}
          {hasAnswer && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">이미 작성된 답변</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{cur.answer}</p>
            </div>
          )}

          {/* 답변 입력 */}
          <div className="glass-panel bg-white/90 p-2 focus-within:ring-2 ring-indigo-400/50 transition-all rounded-3xl shadow-sm">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 text-lg p-6 min-h-[280px] text-slate-800 placeholder-slate-300 resize-y leading-[1.8] font-medium"
              placeholder={cur?.placeholder || `${project.subject_name}의 이야기를 들려주세요...`}
              value={answer}
              onChange={handleAnswerChange}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !answer.trim()}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${saved ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
          >
            {saved ? <><Check className="w-5 h-5" /> 저장 완료!</> : saving ? '저장 중...' : <><Send className="w-5 h-5" /> 이 답변 저장하기</>}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* 네비게이션 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIdx(i => i - 1)}
          disabled={idx === 0}
          className="btn-secondary flex-1 py-4 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" /> 이전
        </button>
        {idx < qnas.length - 1 ? (
          <button onClick={() => setIdx(i => i + 1)} className="btn-primary flex-[2] py-4">
            다음 질문 <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex-[2] glass-panel bg-white/80 py-4 text-center text-slate-500 font-bold rounded-2xl shadow-sm">
            🎉 모든 질문을 확인했습니다!
          </div>
        )}
      </div>
    </div>
  )
}
