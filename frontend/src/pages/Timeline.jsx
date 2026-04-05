import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Clock } from 'lucide-react'
import { api } from '../lib/api'

const PERIOD_ORDER = ['유년기', '청소년기', '청년기', '결혼·가정기', '중장년기', '노년기']

const PERIOD_EMOJI = {
  '유년기': '👶',
  '청소년기': '🎒',
  '청년기': '🌱',
  '결혼·가정기': '💑',
  '중장년기': '🏡',
  '노년기': '🌿',
  '시기 미지정': '📝',
}

const PERIOD_COLOR = {
  '유년기': 'from-yellow-400 to-amber-400',
  '청소년기': 'from-blue-400 to-cyan-400',
  '청년기': 'from-emerald-400 to-teal-400',
  '결혼·가정기': 'from-pink-400 to-rose-400',
  '중장년기': 'from-violet-400 to-purple-400',
  '노년기': 'from-slate-400 to-slate-500',
  '시기 미지정': 'from-slate-300 to-slate-400',
}

const PERIOD_BG = {
  '유년기': 'bg-amber-50 border-amber-100',
  '청소년기': 'bg-blue-50 border-blue-100',
  '청년기': 'bg-emerald-50 border-emerald-100',
  '결혼·가정기': 'bg-pink-50 border-pink-100',
  '중장년기': 'bg-violet-50 border-violet-100',
  '노년기': 'bg-slate-50 border-slate-200',
  '시기 미지정': 'bg-slate-50 border-slate-200',
}

export default function Timeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [groups, setGroups] = useState([])
  const [unanswered, setUnanswered] = useState(0)
  const [activePeriod, setActivePeriod] = useState('')
  const refs = useRef({})

  useEffect(() => {
    api.getProject(id)
      .then(({ project, qnas }) => {
        setProject(project)

        const answered = qnas.filter((q) => q.answer && !q.skipped)
        setUnanswered(qnas.filter((q) => !q.answer && !q.skipped).length)

        const map = {}
        for (const q of answered) {
          const key = q.time_period || '시기 미지정'
          if (!map[key]) map[key] = []
          map[key].push(q)
        }

        const knownPeriods = new Set([...PERIOD_ORDER, '시기 미지정'])
        const sorted = [
          ...PERIOD_ORDER.filter((p) => map[p]).map((p) => ({ period: p, qnas: map[p] })),
          ...Object.keys(map).filter((k) => !knownPeriods.has(k)).map((k) => ({ period: k, qnas: map[k] })),
          ...(map['시기 미지정'] ? [{ period: '시기 미지정', qnas: map['시기 미지정'] }] : []),
        ]

        setGroups(sorted)
        if (sorted.length > 0) setActivePeriod(sorted[0].period)
      })
      .catch(() => navigate('/'))
  }, [id, navigate])

  useEffect(() => {
    const handleScroll = () => {
      let current = activePeriod
      for (const group of groups) {
        const el = refs.current[group.period]
        if (el && el.getBoundingClientRect().top <= 180) current = group.period
      }
      if (current && current !== activePeriod) setActivePeriod(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [groups, activePeriod])

  const scrollToPeriod = (period) => {
    const el = refs.current[period]
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  if (!project) {
    return <div className="text-center py-32 text-slate-400 animate-pulse font-semibold">불러오는 중...</div>
  }

  const totalAnswered = groups.reduce((acc, g) => acc + g.qnas.length, 0)

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8 pb-16">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight text-slate-800">
          {project.subject_name}님의 인생 타임라인
        </h1>
        <p className="text-slate-500 font-medium">
          {totalAnswered}개의 이야기가 시간 순서로 모였습니다.
          {unanswered > 0 ? <span className="ml-2 text-amber-500 font-bold">미작성 {unanswered}문항</span> : null}
        </p>
      </motion.div>

      {groups.length > 0 ? (
        <div className="hidden xl:flex fixed right-12 2xl:right-24 top-1/2 -translate-y-1/2 flex-col gap-2 z-40 bg-white/80 p-5 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-md">
          <p className="text-xs font-black text-slate-400 mb-2 pl-2 tracking-widest uppercase">인생 시기 이동</p>
          {groups.map((g) => (
            <button
              key={g.period}
              onClick={() => scrollToPeriod(g.period)}
              className={`text-left px-5 py-3 rounded-2xl text-sm font-extrabold transition-all duration-300 ${activePeriod === g.period ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100 scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <span className="mr-2 text-lg">{PERIOD_EMOJI[g.period] || PERIOD_EMOJI['시기 미지정']}</span>
              {g.period}
            </button>
          ))}
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div className="xl:hidden sticky top-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-md p-2 flex overflow-x-auto snap-x hide-scrollbar">
          {groups.map((g) => (
            <button
              key={g.period}
              onClick={() => scrollToPeriod(g.period)}
              className={`flex-shrink-0 snap-center px-4 py-2 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap ${activePeriod === g.period ? 'bg-primary-50 text-primary-600 border border-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {g.period}
            </button>
          ))}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="glass-panel bg-white/80 p-12 text-center flex flex-col items-center gap-4">
          <Clock className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500 font-semibold">아직 시기가 지정된 답변이 없습니다.</p>
          <p className="text-sm text-slate-400">인터뷰 작성 시 각 답변에 인생 시기를 선택해주세요.</p>
          <Link to={`/projects/${id}/interview`} className="btn-primary px-6 py-3 text-sm mt-2">
            인터뷰 작성하기
          </Link>
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

          {groups.map((group, gi) => {
            const emoji = PERIOD_EMOJI[group.period] || PERIOD_EMOJI['시기 미지정']
            const color = PERIOD_COLOR[group.period] || PERIOD_COLOR['시기 미지정']
            const bg = PERIOD_BG[group.period] || PERIOD_BG['시기 미지정']

            return (
              <motion.div
                key={group.period}
                ref={(el) => { refs.current[group.period] = el }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: gi * 0.08 }}
                className="flex gap-4 sm:gap-6 mb-12"
              >
                <div className="flex-shrink-0 flex flex-col items-center" style={{ width: '4rem' }}>
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-md z-10`}>
                    {emoji}
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 pt-2">
                  <h3 className="font-extrabold text-lg text-slate-700">{group.period}</h3>
                  {group.qnas.map((q, qi) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.08 + qi * 0.05 }}
                      className={`glass-panel border ${bg} p-5 flex flex-col gap-2 shadow-sm`}
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{q.chapter_title}</p>
                      <p className="text-sm font-bold text-slate-700 leading-snug">{q.question}</p>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mt-1 font-medium">{q.answer}</p>
                      {q.photos && q.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100/50">
                          {q.photos.map((p, pii) => (
                            <div key={p.id || pii} className="rounded-xl overflow-hidden shadow-sm border border-slate-200 group relative bg-white aspect-video md:aspect-square">
                              <img src={p.url} alt="사진" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 justify-center mt-4">
        <Link to={`/projects/${id}/interview`} className="btn-secondary px-6 py-3 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          인터뷰 계속 작성
        </Link>
        <Link to={`/projects/${id}/preview`} className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          책 미리보기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
