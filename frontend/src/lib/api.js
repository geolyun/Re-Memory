async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || '오류가 발생했습니다.')
  }
  return res.json()
}

function formBody(data) {
  return new URLSearchParams(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
  )
}

export const api = {
  // ── 프로젝트 ──────────────────────────────────────
  getProjects: () =>
    apiFetch('/projects'),

  getProject: (id) =>
    apiFetch(`/projects/${id}`),

  createProject: (formData) =>
    apiFetch('/projects', { method: 'POST', body: formData }),

  deleteProject: (id) =>
    apiFetch(`/projects/${id}`, { method: 'DELETE' }),

  // ── 인터뷰 ────────────────────────────────────────
  saveAnswer: (projectId, qnaId, answer, skipped = false, timePeriod = '') =>
    apiFetch(`/projects/${projectId}/qna/${qnaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({ answer, skipped, time_period: timePeriod }),
    }),

  uploadPhoto: (projectId, qnaId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch(`/projects/${projectId}/qna/${qnaId}/photos`, {
      method: 'POST',
      body: fd,
    })
  },

  deletePhoto: (projectId, photoId) =>
    apiFetch(`/projects/${projectId}/photos/${photoId}`, { method: 'DELETE' }),

  uploadCoverPhoto: (projectId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch(`/projects/${projectId}/cover-photo`, {
      method: 'POST',
      body: fd,
    })
  },

  buildBook: (projectId) =>
    apiFetch(`/projects/${projectId}/build`, { method: 'POST' }),

  // ── 확정 / 주문 ───────────────────────────────────
  finalizeBook: (projectId) =>
    apiFetch(`/projects/${projectId}/finalize`, { method: 'POST' }),

  rebuildBook: (projectId) =>
    apiFetch(`/projects/${projectId}/rebuild`, { method: 'POST' }),

  getEstimate: (projectId, quantity = 1) =>
    apiFetch(`/projects/${projectId}/estimate?quantity=${encodeURIComponent(quantity)}`),

  createOrder: (projectId, data) =>
    apiFetch(`/projects/${projectId}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody(data),
    }),

  cancelOrder: (projectId, reason = '사용자 요청') =>
    apiFetch(`/projects/${projectId}/order/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({ cancel_reason: reason }),
    }),

  getOrderDetail: (projectId) =>
    apiFetch(`/projects/${projectId}/order-detail`),

  // ── 공유 ──────────────────────────────────────────
  createShareToken: (projectId) =>
    apiFetch(`/projects/${projectId}/share`, { method: 'POST' }),

  revokeShareToken: (projectId) =>
    apiFetch(`/projects/${projectId}/share`, { method: 'DELETE' }),

  getSharedProject: (token) =>
    apiFetch(`/share/${token}`),

  saveSharedAnswer: (token, qnaId, answer, timePeriod = '', contributorName = '') =>
    apiFetch(`/share/${token}/qna/${qnaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({ answer, time_period: timePeriod, contributor_name: contributorName }),
    }),

  // ── 크레딧 ────────────────────────────────────────
  getBalance: () =>
    apiFetch('/credits/balance'),

  chargeCredits: (amount) =>
    apiFetch('/credits/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({ amount }),
    }),
}
