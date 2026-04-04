import { useEffect, useState } from 'react'
import { Coins, Plus, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

const fmt = (n) => n != null ? n.toLocaleString('ko-KR') + '원' : '—'

export default function Credits() {
  const [balance, setBalance] = useState(null)
  const [charging, setCharging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.getBalance().then(({ balance }) => setBalance(balance)).catch(() => { })
  }, [])

  const handleCharge = async (amount) => {
    setCharging(true)
    setError('')
    setSuccess('')
    try {
      await api.chargeCredits(amount)
      const { balance } = await api.getBalance()
      setBalance(balance)
      setSuccess(`${fmt(amount)} 충전 완료!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* 헤더 */}
      <div className="glass-panel p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">충전금 관리</h1>
          <p className="text-white/50 text-sm mt-1">Sandbox 테스트용 크레딧</p>
        </div>
        <Coins className="w-8 h-8 text-primary-400" />
      </div>

      {/* 잔액 */}
      <div className="glass-panel p-8 text-center">
        <p className="text-white/50 text-sm mb-2">현재 충전금 잔액</p>
        <p className="text-5xl font-extrabold text-green-400">
          {balance != null ? fmt(balance) : '—'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-green-300 text-sm">
          ✓ {success}
        </div>
      )}

      {/* 충전 옵션 */}
      <div className="glass-panel p-6 flex flex-col gap-4">
        <h2 className="font-bold text-lg mb-1">충전하기 (Sandbox)</h2>
        <p className="text-white/40 text-xs -mt-2">실제 결제 없이 테스트용 금액을 충전합니다.</p>
        <div className="grid grid-cols-3 gap-3">
          {[50000, 100000, 300000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleCharge(amount)}
              disabled={charging}
              className="glass-panel p-4 text-center hover:bg-white/10 transition-colors disabled:opacity-50 flex flex-col items-center gap-2 rounded-xl border border-white/10"
            >
              <Plus className="w-5 h-5 text-primary-400" />
              <span className="font-bold text-sm">{fmt(amount)}</span>
            </button>
          ))}
        </div>
        {charging && (
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> 충전 중...
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="glass-panel p-4 text-black/40 text-xs leading-relaxed">
        * Sandbox 환경에서는 실제 결제가 발생하지 않습니다.<br />
        * 충전금은 책 인쇄 주문 시 자동으로 차감됩니다.
      </div>
    </div>
  )
}
