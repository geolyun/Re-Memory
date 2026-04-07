import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen, Edit2, CheckCircle, Loader2, Clock, Settings2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'

const MIN_PAGES = 20

function getEmoji(rel) {
  if (rel === '아버지') return '👨'
  if (rel === '어머니') return '👩'
  if (['할아버지', '외할아버지'].includes(rel)) return '👴'
  if (['할머니', '외할머니'].includes(rel)) return '👵'
  if (rel === '배우자') return '💍'
  if (rel === '본인') return '🎓'
  return '📖'
}

function ChapterGanjiSettings({ projectId, chapter, ganjiTemplates, onChange }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleUseGanji = async (val) => {
    setSaving(true)
    try {
      await api.updateChapterGanji(projectId, chapter.id, val, chapter.ganji_tpl_uid || '')
      onChange(chapter.id, { use_ganji: val })
    } finally {
      setSaving(false)
    }
  }

  const handleTemplate = async (uid) => {
    setSaving(true)
    try {
      await api.updateChapterGanji(projectId, chapter.id, chapter.use_ganji, uid)
      onChange(chapter.id, { ganji_tpl_uid: uid })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-slate-100 pt-3 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        간지 설정
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        {saving && <span className="text-primary-400 ml-1">저장 중...</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-col sm:flex-row gap-4 items-start">
              {/* 간지 포함 여부 */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={chapter.use_ganji}
                    onChange={e => handleUseGanji(e.target.checked)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${chapter.use_ganji ? 'bg-primary-500' : 'bg-slate-200'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${chapter.use_ganji ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-semibold text-slate-600">간지 페이지 포함</span>
              </label>

              {/* 간지 템플릿 선택 (여러 개일 때만 표시) */}
              {chapter.use_ganji && ganjiTemplates.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">스타일</span>
                  <select
                    value={chapter.ganji_tpl_uid || ganjiTemplates[0].uid}
                    onChange={e => handleTemplate(e.target.value)}
                    className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    {ganjiTemplates.map(t => (
                      <option key={t.uid} value={t.uid}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p className="text-xs mt-3 font-medium">
              {chapter.use_ganji ? (
                <span className="text-slate-400">간지 포함 시 +2p</span>
              ) : (
                <span className="text-amber-600">간지 생략 시 −2p</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              변경사항은 다음 미리보기 생성 시 반영됩니다.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Preview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [chapters, setChapters] = useState([])
  const [qnas, setQnas] = useState([])
  const [ganjiTemplates, setGanjiTemplates] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [ganjiDirty, setGanjiDirty] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.getProject(id),
      api.getGanjiTemplates(),
      api.getEstimate(id).catch(() => null),
    ]).then(([{ project, chapters, qnas }, templates, estimate]) => {
      setProject(project)
      setChapters(chapters)
      setQnas(qnas)
      setGanjiTemplates(templates)
      setEstimate(estimate)
    }).catch(() => navigate('/'))
  }, [id, navigate])

  const handleChapterGanjiChange = useCallback((chapterId, patch) => {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, ...patch } : c))
    setGanjiDirty(true)
  }, [])

  const handleRebuild = async () => {
    setLoading(true); setError('')
    try {
      await api.rebuildBook(id)
      navigate(`/projects/${id}/interview`)
    } catch (err) { setError(err.message); setLoading(false) }
  }

  const handleFinalize = async () => {
    setLoading(true); setError('')
    try {
      await api.finalizeBook(id)
      setConfirmOpen(false)
      navigate(`/projects/${id}/order`)
    } catch (err) { setError(err.message); setLoading(false) }
  }

  const handleRebuildAndFinalize = async () => {
    setLoading(true); setError('')
    try {
      setLoadingStep('미리보기 재생성 중...')
      await api.rebuildBook(id)
      setLoadingStep('책 빌드 중...')
      await api.buildBook(id)
      setLoadingStep('확정 중...')
      await api.finalizeBook(id)
      setConfirmOpen(false)
      navigate(`/projects/${id}/order`)
    } catch (err) {
      setError(err.message)
      setLoadingStep('')
      setLoading(false)
    }
  }

  if (!project) return <div className="text-center py-32 text-slate-400 animate-pulse font-bold text-lg">기억을 엮는 중입니다...</div>

  const grouped = chapters.map(c => ({
    ...c, qnas: qnas.filter(q => q.chapter_title === c.title && q.answer),
  })).filter(c => c.qnas.length > 0)
  const hasAnswers = grouped.length > 0

  const fallbackPages = (() => {
    if (!hasAnswers) return null
    const contentPages =
      grouped.filter(c => c.use_ganji).length * 2 +
      grouped.reduce((sum, c) => sum + c.qnas.length, 0)
    return Math.max(MIN_PAGES, contentPages + 1)
  })()

  const estimatedPages = estimate?.pageCount ?? project.page_count ?? fallbackPages

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pb-12 mt-2">
      <div className="text-center">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-800 drop-shadow-sm">미리보기 준비 완료!</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-slate-500 text-lg font-medium">작성하신 소중한 기억이 다음과 같이 책으로 묶입니다.</motion.p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 shadow-sm font-semibold">⚠️ {error}</div>}

      {hasAnswers && project.page_count != null && estimatedPages != null && project.page_count !== estimatedPages && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-amber-700 text-sm font-semibold flex items-center gap-2">
          ⚠️ 마지막 빌드 이후 내용이 변경되었습니다. 확정 전에 <button onClick={handleRebuild} className="underline underline-offset-2 hover:text-amber-900">미리보기를 다시 생성</button>해주세요. (빌드 당시 {project.page_count}p → 현재 예상 {estimatedPages}p)
        </div>
      )}

      <div className="w-full grid md:grid-cols-[2fr_3fr] gap-12 items-start mt-6">
        {/* Cover 3D Preview */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full flex-col flex gap-5 mt-2 md:sticky md:top-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xl font-bold text-slate-800">표지 디자인 Preview</h3>
          </div>
          <div className="book-cover w-full aspect-[3/4] flex flex-col items-center justify-center p-6 relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/5 to-transparent z-10" />

            <div className="text-[96px] leading-none z-10 mt-6 mb-8 drop-shadow-md select-none">
              {getEmoji(project.relationship_type)}
            </div>

            <div className="text-center z-10 w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-black font-serif text-[#1a1a1a] leading-snug break-keep px-4 underline decoration-2 underline-offset-[10px] decoration-[#d52458]/30">
                {project.title}
              </h2>
              {project.subtitle && <p className="text-[#555] font-bold tracking-wide mt-6 italic">"{project.subtitle}"</p>}

              <div className="mt-14 flex flex-col items-center pt-6 border-t border-black/10 w-2/3">
                <p className="text-[11px] font-bold text-[#b41944] tracking-[0.25em] mb-1">MEMORY BOOK</p>
                <p className="text-[10px] text-[#666] tracking-widest font-extrabold uppercase">FOR {project.subject_name}</p>
              </div>
            </div>
            <div className="absolute top-1 bottom-1 -right-0.5 w-1.5 bg-gradient-to-l from-[#e6e2d3] to-[#fffefb] border-y border-r border-[#d4d1c4] shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-0 rounded-r-md"></div>
          </div>
        </motion.div>

        {/* Content Preview */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full flex flex-col gap-6">
          <h3 className="text-xl font-bold border-b border-slate-200 pb-3 text-slate-800">내지 원고 요약</h3>
          {!hasAnswers && (
            <div className="glass-panel bg-amber-50/60 border border-amber-200 p-8 text-center flex flex-col gap-3">
              <p className="text-2xl">📝</p>
              <p className="font-bold text-slate-700">아직 작성된 답변이 없습니다.</p>
              <p className="text-sm text-slate-500">인터뷰에서 질문에 답변을 작성하면 여기에 표시됩니다.</p>
              <button onClick={handleRebuild} disabled={loading} className="mt-2 btn-secondary py-3 px-6 self-center text-sm">
                인터뷰 작성하러 가기
              </button>
            </div>
          )}
          <div className="flex flex-col gap-8">
            {grouped.map((ch, ci) => (
              <div key={ch.id} className="glass-panel bg-white/70 p-6 md:p-8 flex flex-col gap-6 border-l-4 border-l-primary-400 hover:shadow-lg transition-shadow border-slate-200/50">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                  <span className="text-sm font-bold bg-primary-50 text-primary-600 border border-primary-100 px-3 py-1 rounded-full shadow-sm">{ci + 1}장</span>
                  {ch.title}
                  {!ch.use_ganji && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">간지 없음</span>
                  )}
                </h3>
                <div className="flex flex-col gap-5">
                  {ch.qnas.map((q) => (
                    <div key={q.id} className="flex flex-col md:flex-row gap-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                      {q.photos[0] && (
                        <div className="w-full md:w-32 h-48 md:h-32 rounded-xl overflow-hidden shadow-sm border border-slate-200 flex-shrink-0">
                          <img src={q.photos[0].url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[15px] mb-3 flex items-start gap-2">
                          <span className="text-primary-500 mt-0.5 font-black">Q.</span> <span className="leading-snug break-keep">{q.question}</span>
                        </p>
                        <p className="text-slate-600 text-[15px] leading-relaxed line-clamp-4 italic border-l-2 border-primary-200 pl-4 py-1">"{q.answer}"</p>
                      </div>
                    </div>
                  ))}
                </div>

                <ChapterGanjiSettings
                  projectId={id}
                  chapter={ch}
                  ganjiTemplates={ganjiTemplates}
                  onChange={handleChapterGanjiChange}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link to={`/projects/${id}/timeline`} className="flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 bg-white/75 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> 타임라인 보기
            </Link>
            <button onClick={handleRebuild} disabled={loading} className="flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 bg-white/75 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Edit2 className="w-4 h-4 text-slate-400" /> 일부 수정하기
            </button>
            <button onClick={() => setConfirmOpen(true)} disabled={loading || !hasAnswers} className="btn-primary flex-[1.5] py-4 text-base font-semibold group text-white shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 처리 중...</> : <><CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> 이대로 책자 확정하기</>}
            </button>
          </div>
          <p className="text-center text-slate-500 text-sm mt-2 font-bold tracking-wide">
            {hasAnswers
              ? '⚠️ 확정 이후에는 문구나 사진을 다시는 수정할 수 없습니다.'
              : '답변을 작성한 뒤에만 책 확정을 진행할 수 있습니다.'}
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 md:p-7"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-extrabold text-slate-800">이 책자를 지금 확정하시겠어요?</h3>
                {ganjiDirty ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
                    간지 설정이 변경되었습니다. 변경사항을 책에 반영하려면 미리보기를 재생성해야 합니다.
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-slate-600">
                    확정 후 발행 준비가 시작되면 문구와 사진을 다시 수정할 수 없습니다.
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loading}
                  className="btn-secondary w-full py-3.5 text-sm font-semibold shadow-sm"
                >
                  아니요, 다시 보기
                </button>
                {ganjiDirty && (
                  <button
                    type="button"
                    onClick={handleRebuildAndFinalize}
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {loadingStep}</> : <><CheckCircle className="w-4 h-4" /> 재생성 후 확정하기</>}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={loading}
                  className={`w-full py-3.5 text-sm font-semibold rounded-2xl disabled:opacity-50 ${ganjiDirty ? 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50' : 'btn-primary text-white'}`}
                >
                  {loading && !ganjiDirty ? <><Loader2 className="w-4 h-4 animate-spin" /> 확정 중...</> : ganjiDirty ? '변경 무시하고 확정' : <><CheckCircle className="w-4 h-4" /> 확정하기</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
