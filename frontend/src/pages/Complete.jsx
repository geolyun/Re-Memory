import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Home, PackageSearch, Sparkles, Truck, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'

const fmt = (n) => (n != null ? `${n.toLocaleString('ko-KR')}원` : '--')

export default function Complete() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [order, setOrder] = useState(null)
  const [balance, setBalance] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProject(id).then(({ project }) => setProject(project)).catch(() => navigate('/'))
    api.getOrderDetail(id).then(({ order, balance }) => {
      setOrder(order)
      setBalance(balance)
    }).catch(() => {})
  }, [id, navigate])

  const handleCancel = async () => {
    if (!confirm('주문을 취소하시겠습니까? 결제 금액이 복구됩니다.')) return
    setCancelling(true)
    setError('')
    try {
      await api.cancelOrder(id)
      navigate(`/projects/${id}/order`)
    } catch (err) {
      setError(err.message)
      setCancelling(false)
    }
  }

  if (!project) {
    return <div className="text-center py-32 text-slate-400 font-bold text-lg animate-pulse">주문 내역을 불러오는 중...</div>
  }

  const hasTracking = Boolean(order?.trackingNumber)

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pb-16 pt-8 mt-2">
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="relative mx-auto mt-4">
        <div className="absolute inset-0 bg-emerald-100 blur-[40px] rounded-full scale-150 z-0" />
        <CheckCircle className="w-32 h-32 text-emerald-500 relative z-10 drop-shadow-lg" />
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -20, opacity: 1 }} transition={{ delay: 0.5, duration: 1, repeat: Infinity, repeatType: 'reverse' }} className="absolute -top-4 -right-8 text-yellow-400 z-20">
          <Sparkles className="w-10 h-10 drop-shadow-sm" />
        </motion.div>
      </motion.div>

      <div className="text-center mt-4">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-800 drop-shadow-sm">
          주문이 성공적으로
          <br />
          완료되었습니다
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-slate-500 text-lg md:text-xl leading-relaxed font-bold">
          정성껏 제작해서 소중한 책으로
          <br />
          보내드리겠습니다.
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel bg-white/80 p-8 md:p-10 flex flex-col gap-6 w-full shadow-2xl border border-emerald-100 relative overflow-hidden mt-6">
        <div className="absolute -right-12 -top-12 opacity-5">
          <Truck className="w-56 h-56 rotate-12 text-emerald-900" />
        </div>
        <h2 className="font-extrabold text-2xl flex items-center gap-3 border-b border-slate-200 pb-5 relative z-10 text-slate-800">
          <Truck className="w-7 h-7 text-emerald-500" />
          주문 확인
        </h2>

        {order && Object.keys(order).length > 0 ? (
          <div className="flex flex-col gap-4 relative z-10 mt-2">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-600 font-extrabold text-lg">주문 번호</span>
              <span className="font-mono text-slate-800 font-bold tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{order.orderUid || project.order_uid}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-600 font-extrabold text-lg">주문 상태</span>
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </span>
                <span className="font-extrabold text-emerald-600 tracking-wide text-lg">{String(order.status ?? '--')}</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center bg-slate-50 px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-600 font-extrabold">상품 금액</span>
                <span className="font-bold text-slate-800">{fmt(order.productPrice)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-600 font-extrabold">배송비</span>
                <span className="font-bold text-slate-800">{fmt(order.deliveryFee)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 px-6 py-5 rounded-xl border border-emerald-100 shadow-sm mt-1">
              <span className="text-slate-700 font-extrabold text-lg">최종 결제 금액</span>
              <span className="font-black text-3xl text-emerald-600 drop-shadow-sm">{fmt(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-600 font-extrabold text-lg">결제 후 잔액</span>
              <span className="font-bold text-slate-800">{fmt(balance)}</span>
            </div>

            <div className="bg-sky-50 px-6 py-5 rounded-xl border border-sky-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <PackageSearch className="w-5 h-5 text-sky-600" />
                <span className="text-slate-700 font-extrabold text-lg">배송 추적</span>
              </div>
              {hasTracking ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 font-bold">택배사</span>
                    <span className="text-slate-800 font-bold">{order.trackingCarrier || '--'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 font-bold">운송장 번호</span>
                    <span className="font-mono text-slate-800 font-bold">{order.trackingNumber}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 font-bold">아직 운송장 정보가 등록되지 않았습니다. 출고 후 이 화면에서 확인할 수 있습니다.</p>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>

      {error ? <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 font-bold text-center mt-2 shadow-sm">오류: {error}</div> : null}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col md:flex-row gap-5 mt-6">
        <Link to="/" className="btn-primary flex-[1.5] py-5 text-lg shadow-lg">
          <span className="text-white flex items-center justify-center">
            <Home className="w-6 h-6 mr-2 text-white" />
            홈으로 돌아가기
          </span>
        </Link>
        <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-5 rounded-2xl border-2 border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all duration-300 font-bold flex items-center justify-center gap-2 disabled:opacity-30 shadow-sm bg-white group">
          <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {cancelling ? '취소 처리 중...' : '주문 취소'}
        </button>
      </motion.div>
    </div>
  )
}
