import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Coins, Loader2, MapPin, Package, ShoppingBag, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'

const fmt = (n) => (n != null ? `${n.toLocaleString('ko-KR')}원` : '--')

export default function Order() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [balance, setBalance] = useState(null)
  const [shipping, setShipping] = useState({
    recipient_name: '',
    recipient_phone: '',
    postal_code: '',
    address1: '',
    address2: '',
    shipping_memo: '',
    quantity: 1,
  })
  const [loading, setLoading] = useState(false)
  const [charging, setCharging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProject(id).then(({ project }) => setProject(project)).catch(() => navigate('/'))
    api.getBalance().then(({ balance }) => setBalance(balance)).catch(() => {})
  }, [id, navigate])

  useEffect(() => {
    api.getEstimate(id, shipping.quantity).then(setEstimate).catch(() => {})
  }, [id, shipping.quantity])

  const handleCharge = async () => {
    setCharging(true)
    try {
      await api.chargeCredits(100000)
      const { balance } = await api.getBalance()
      setBalance(balance)
    } catch (err) {
      setError(err.message)
    } finally {
      setCharging(false)
    }
  }

  const handleOrder = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.createOrder(id, { ...shipping, quantity: String(shipping.quantity) })
      navigate(`/projects/${id}/complete`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!project) {
    return <div className="text-center py-32 text-slate-400 font-bold text-lg animate-pulse">주문 페이지를 불러오는 중입니다...</div>
  }

  const totalPrice = estimate?.totalPrice
  const insufficient = balance != null && totalPrice != null && balance < totalPrice

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-16 mt-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-800 drop-shadow-sm">마지막 단계, 배송 정보</h1>
        <p className="text-slate-500 text-lg font-bold">완성한 책을 어디로 보내드릴까요?</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 w-full mt-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel bg-white/80 p-8 flex flex-col justify-between border-t-4 border-t-primary-400 shadow-xl relative overflow-hidden h-full border-slate-200/50"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <ShoppingBag className="w-48 h-48 text-slate-900" />
          </div>
          <div className="z-10">
            <p className="text-slate-700 font-extrabold mb-6 flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary-500" />
              결제 금액 상세
            </p>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between text-lg items-center">
                <span className="text-slate-600 font-bold">예상 책 페이지 수</span>
                <span className="font-extrabold text-xl text-slate-800">
                  {(project?.page_count ?? estimate?.pageCount) != null
                    ? `${project.page_count ?? estimate.pageCount}p`
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between text-lg items-center">
                <span className="text-slate-600 font-bold">상품 기본 금액</span>
                <span className="font-extrabold text-xl text-slate-800">{fmt(estimate?.productsPrice)}</span>
              </div>
              <div className="flex justify-between text-lg items-center">
                <span className="text-slate-600 font-bold">배송비</span>
                <span className="font-extrabold text-xl text-slate-800">{fmt(estimate?.deliveryFee)}</span>
              </div>
            </div>
            <div className="h-px border-b-2 border-dashed border-slate-200 w-full my-8" />
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-800 font-extrabold text-lg">최종 결제 금액</span>
              <span className="text-4xl font-black text-primary-500 drop-shadow-sm">{fmt(totalPrice)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel bg-white/80 p-8 flex flex-col justify-center text-center gap-6 border border-emerald-100 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.15)] h-full relative overflow-hidden"
        >
          <div className="absolute -bottom-12 -left-12 opacity-5">
            <Coins className="w-64 h-64 text-emerald-600" />
          </div>
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Coins className="w-10 h-10 text-emerald-500 drop-shadow-sm" />
            </div>
            <h3 className="font-extrabold text-slate-600 text-lg">현재 보유 충전금</h3>
          </div>
          <p className={`text-5xl font-black tracking-tight drop-shadow-sm z-10 ${insufficient ? 'text-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent'}`}>
            {fmt(balance)}
          </p>
          <button
            onClick={handleCharge}
            disabled={charging}
            className={`mt-4 z-10 px-8 py-4 rounded-xl font-bold transition-all shadow-md text-sm w-max mx-auto ${charging ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 hover:shadow-emerald-500/30'}`}
          >
            {charging ? '가상 충전 중...' : '테스트 충전금 10만원 충전'}
          </button>
        </motion.div>
      </div>

      {insufficient ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-5 text-red-600 font-bold shadow-md justify-center mt-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          결제할 충전금이 부족합니다. 충전 버튼을 눌러주세요.
        </motion.div>
      ) : null}
      {error ? <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm shadow-md text-center font-bold">오류: {error}</div> : null}

      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleOrder}
        className="glass-panel bg-white/70 p-8 md:p-12 flex flex-col gap-8 w-full shadow-xl border border-slate-200/50"
      >
        <h2 className="font-extrabold text-2xl flex items-center gap-3 border-b border-slate-200 pb-5 mb-2 text-slate-800">
          <Truck className="w-6 h-6 text-primary-500" />
          어디로 보내드릴까요?
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700">받는 분 성함 <span className="text-red-500">*</span></label>
            <input required className="glass-input font-bold text-lg" placeholder="홍길동" value={shipping.recipient_name} onChange={(e) => setShipping({ ...shipping, recipient_name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-slate-700">연락처 <span className="text-red-500">*</span></label>
            <input required className="glass-input font-bold text-lg tracking-wider" placeholder="010-1234-5678" value={shipping.recipient_phone} onChange={(e) => setShipping({ ...shipping, recipient_phone: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="flex flex-col gap-2.5 w-full sm:w-1/3">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-primary-500" />
              우편번호 <span className="text-red-500">*</span>
            </label>
            <input required className="glass-input font-bold text-lg tracking-wider" placeholder="06100" value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} />
          </div>
          <p className="text-sm text-slate-500 mb-4 ml-1 font-bold bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex-1">실제 배송을 위해 정확한 도로명 주소를 입력해주세요.</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-bold text-slate-700">기본 주소 <span className="text-red-500">*</span></label>
          <input required className="glass-input font-bold text-lg" placeholder="서울특별시 강남구 테헤란로 10" value={shipping.address1} onChange={(e) => setShipping({ ...shipping, address1: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-bold text-slate-700">상세 주소 <span className="text-slate-400 font-medium ml-1">(선택)</span></label>
          <input className="glass-input font-bold text-lg placeholder-slate-400" placeholder="101동 101호" value={shipping.address2} onChange={(e) => setShipping({ ...shipping, address2: e.target.value })} />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start mt-4 bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-2.5 flex-[3] w-full">
            <label className="text-sm font-bold text-slate-700">배송 메모 <span className="text-slate-400 font-medium ml-1">(선택)</span></label>
            <input className="glass-input bg-white font-bold text-md placeholder-slate-400" placeholder="문 앞에 안전하게 놓아주세요" value={shipping.shipping_memo} onChange={(e) => setShipping({ ...shipping, shipping_memo: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2.5 flex-1 w-full">
            <label className="text-sm font-bold text-slate-700">주문 수량 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max="10"
              className="glass-input bg-white font-black text-center text-3xl py-3 text-primary-500 shadow-sm border-slate-200"
              value={shipping.quantity}
              onChange={(e) => setShipping({ ...shipping, quantity: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        <button type="submit" disabled={loading || insufficient} className="btn-primary w-full py-6 mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-[0_15px_30px_rgba(244,63,94,0.25)]">
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              주문 처리 중...
            </>
          ) : (
            <span className="text-white">총 {fmt(totalPrice)} 결제하기</span>
          )}
        </button>
      </motion.form>
    </div>
  )
}
