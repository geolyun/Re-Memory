import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ChevronRight, User, Type, Book, Camera, Zap, BookOpen, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'

const DEPTHS = [
  {
    value: 5,
    icon: Zap,
    label: '빠르게 만들기',
    count: '5문항',
    time: '약 20분',
    desc: '핵심 질문만 담은 짧고 간결한 책',
    color: 'amber',
  },
  {
    value: 10,
    icon: BookOpen,
    label: '보통',
    count: '10문항',
    time: '약 40분',
    desc: '삶의 주요 순간을 고루 담은 책',
    color: 'primary',
    recommended: true,
  },
  {
    value: 15,
    icon: Sparkles,
    label: '깊이 있게',
    count: '15문항',
    time: '약 1시간',
    desc: '풍부한 이야기로 채운 완성도 높은 책',
    color: 'violet',
  },
]

const DEPTH_STYLES = {
  amber: {
    active: 'border-amber-300 bg-amber-50/80 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.15)] ring-1 ring-amber-300/50',
    icon: 'text-amber-500',
    badge: 'text-amber-600 bg-amber-100/60',
    count: 'text-amber-600',
  },
  primary: {
    active: 'border-primary-300 bg-primary-50/80 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.15)] ring-1 ring-primary-300/50',
    icon: 'text-primary-500',
    badge: 'text-primary-600 bg-primary-100/60',
    count: 'text-primary-600',
  },
  violet: {
    active: 'border-violet-300 bg-violet-50/80 shadow-[0_10px_25px_-5px_rgba(139,92,246,0.15)] ring-1 ring-violet-300/50',
    icon: 'text-violet-500',
    badge: 'text-violet-600 bg-violet-100/60',
    count: 'text-violet-600',
  },
}

const TEMPLATES = [
  {
    id: 'parents_memoir',
    emoji: '🧓',
    label: '부모님 회고록',
    desc: '어버이날 · 환갑 · 칠순',
    defaultRelationship: '아버지',
  },
  {
    id: 'grandparents_memoir',
    emoji: '👴',
    label: '조부모님 자서전',
    desc: '칠순 · 팔순 · 구순 기념',
    defaultRelationship: '할아버지',
  },
  {
    id: 'retirement',
    emoji: '🎓',
    label: '퇴직 기념 인터뷰북',
    desc: '정년퇴직 · 명예퇴직',
    defaultRelationship: '본인',
  },
  {
    id: 'couple',
    emoji: '💍',
    label: '부부 이야기북',
    desc: '결혼기념일 · 은혼식 · 금혼식',
    defaultRelationship: '배우자',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState('parents_memoir')
  const [formData, setFormData] = useState({
    subject_name: '', relationship_type: '아버지', title: '', subtitle: '',
  })
  const [selectedDepth, setSelectedDepth] = useState(10)
  const [coverFile, setCoverFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTemplateSelect = (tpl) => {
    setSelectedTemplate(tpl.id)
    setFormData(f => ({ ...f, relationship_type: tpl.defaultRelationship }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
    fd.append('template', selectedTemplate)
    fd.append('question_count', String(selectedDepth))
    if (coverFile) fd.append('cover_photo', coverFile)

    try {
      const data = await api.createProject(fd)
      navigate(`/projects/${data.project_id}/interview`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto pb-12 mt-2">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-800 drop-shadow-sm">첫 번째 챕터</h1>
        <p className="text-lg text-slate-500 font-medium">어떤 이야기를 담을지 먼저 선택해주세요.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">인터뷰북 종류</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleTemplateSelect(tpl)}
              className={`glass-panel p-5 text-left flex flex-col gap-2 transition-all duration-200 group ${selectedTemplate === tpl.id
                  ? 'border-primary-300 bg-primary-50/80 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.15)] ring-1 ring-primary-300/50'
                  : 'bg-white/60 hover:bg-white hover:border-slate-300 hover:shadow-md'
                }`}
            >
              <span className="text-3xl lg:text-4xl drop-shadow-sm">{tpl.emoji}</span>
              <span className={`font-bold text-sm lg:text-base mt-2 ${selectedTemplate === tpl.id ? 'text-primary-600' : 'text-slate-700'}`}>
                {tpl.label}
              </span>
              <span className="text-xs font-medium leading-relaxed text-slate-500">{tpl.desc}</span>
              {selectedTemplate === tpl.id && (
                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mt-1 bg-primary-100/50 w-max px-2 py-0.5 rounded-full">✓ 선택됨</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="w-full">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">인터뷰 깊이</p>
        <div className="grid grid-cols-3 gap-3">
          {DEPTHS.map((d) => {
            const styles = DEPTH_STYLES[d.color]
            const Icon = d.icon
            const active = selectedDepth === d.value
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDepth(d.value)}
                className={`glass-panel p-4 text-left flex flex-col gap-2 transition-all duration-200 relative ${
                  active ? styles.active : 'bg-white/60 hover:bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {d.recommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary-500 text-white px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">추천</span>
                )}
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${active ? styles.icon : 'text-slate-400'}`} />
                  <span className={`text-xs font-black ${active ? styles.count : 'text-slate-400'}`}>{d.count}</span>
                </div>
                <span className={`font-bold text-sm mt-1 ${active ? (d.color === 'primary' ? 'text-primary-600' : d.color === 'amber' ? 'text-amber-600' : 'text-violet-600') : 'text-slate-700'}`}>
                  {d.label}
                </span>
                <span className="text-xs text-slate-500 leading-relaxed">{d.desc}</span>
                <span className={`text-[11px] font-semibold mt-1 ${active ? styles.badge : 'text-slate-400'} w-max px-2 py-0.5 rounded-full ${active ? '' : 'bg-slate-100'}`}>
                  {d.time}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 font-semibold text-sm shadow-sm">
          ⚠️ {error}
        </motion.div>
      )}

      <motion.form variants={container} initial="hidden" animate="show" onSubmit={handleSubmit} className="glass-panel bg-white/70 p-8 md:p-12 w-full flex flex-col gap-8 shadow-xl border-slate-200/80">

        <div className="grid md:grid-cols-2 gap-6 relative">
          <motion.div variants={item} className="flex flex-col gap-2.5">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-primary-500" /> 주인공의 이름
            </label>
            <input required name="subject_name" type="text" value={formData.subject_name} onChange={e => setFormData({ ...formData, subject_name: e.target.value })} className="glass-input text-lg font-bold" placeholder="예: 김영수" />
          </motion.div>

          <motion.div variants={item} className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700 ml-1">나와의 관계</label>
            <div className="relative">
              <select name="relationship_type" className="glass-input text-lg font-bold appearance-none w-full bg-white/60" value={formData.relationship_type} onChange={e => setFormData({ ...formData, relationship_type: e.target.value })}>
                {['아버지', '어머니', '할아버지', '할머니', '외할아버지', '외할머니', '배우자', '본인', '기타'].map(v => (
                  <option key={v} value={v} className="bg-white text-slate-800 font-medium">{v}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
            </div>
          </motion.div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1" />

        <motion.div variants={item} className="flex flex-col gap-2.5">
          <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
            <Book className="w-4 h-4 text-primary-500" /> 책의 메인 타이틀
          </label>
          <input required name="title" type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="glass-input text-2xl font-black tracking-tight" placeholder="예: 영수씨의 빛나는 날들" />
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-2.5">
          <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
            <Type className="w-4 h-4 text-primary-500" /> 서브 타이틀 <span className="text-slate-400 font-medium ml-1">(선택)</span>
          </label>
          <input name="subtitle" type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="glass-input text-md font-semibold placeholder-slate-400 italic" placeholder="예: 60년간 걸어온 가장의 길" />
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-3 mt-4">
          <label className="text-sm font-bold text-slate-700">
            표지 사진 <span className="text-slate-400 font-medium ml-1">(책의 첫인상을 결정합니다)</span>
          </label>
          <label className={`flex flex-col items-center justify-center w-full h-56 border-2 ${preview ? 'border-primary-400/50' : 'border-dashed border-slate-300'} rounded-3xl cursor-pointer hover:bg-white/80 hover:border-primary-400/50 transition-all duration-300 overflow-hidden group relative shadow-inner bg-white/50`}>
            {preview ? (
              <>
                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center z-10 gap-2 backdrop-blur-sm">
                  <Camera className="w-8 h-8 text-primary-600 drop-shadow-sm" />
                  <span className="text-primary-700 font-bold tracking-wider">사진 변경하기</span>
                </div>
                <img src={preview} alt="표지 미리보기" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-primary-500 transition-colors">
                <div className="p-5 rounded-full bg-white border border-slate-200 group-hover:scale-110 group-hover:bg-primary-50 group-hover:border-primary-200 transition-all duration-300 shadow-sm">
                  <Upload className="w-10 h-10 group-hover:text-primary-500 transition-colors text-slate-300" />
                </div>
                <span className="font-bold tracking-wide">클릭하여 표지 사진을 올려주세요</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </motion.div>

        <motion.button variants={item} type="submit" disabled={loading} className="btn-primary mt-6 py-5 text-xl w-full disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden text-white">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? '기억의 조각을 엮는 중...' : <>인터뷰의 숲으로 들어가기 <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" /></>}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
      </motion.form>
    </motion.div>
  )
}
