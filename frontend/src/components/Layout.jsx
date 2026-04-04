import { Outlet, Link } from 'react-router-dom'
import { BookOpen, Coins } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative w-full items-center">
      <header className="w-full max-w-4xl px-4 pt-6 z-10">
        <div className="glass-panel bg-white/70 px-6 py-4 flex justify-between items-center rounded-3xl border-slate-200/50 shadow-sm">
          <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-xl shadow-[0_5px_15px_rgba(244,63,94,0.3)]">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent drop-shadow-sm">
              Re:Memory
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/credits" className="btn-secondary py-2 px-4 text-sm bg-white border-white">
              <Coins className="w-4 h-4 text-slate-500" /> 충전금
            </Link>
            <Link to="/projects/new" className="btn-primary py-2 px-4 text-sm font-semibold">
              + 새 인터뷰북
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl p-4 md:p-6 mt-2 z-10 flex flex-col">
        <Outlet />
      </main>

      <footer className="w-full text-center py-8 text-slate-400 text-sm z-10 font-medium">
        <p>기억을 엮다 — 가족의 이야기를 한 권의 책으로</p>
        <p className="mt-1 opacity-70">&copy; 2026 Re:Memory · Powered by Book Print API</p>
      </footer>
    </div>
  )
}
