import { useState, useEffect, useCallback } from 'react'
import VicareApp from './VicareApp'

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = 'login' | 'rooms' | 'room101' | 'patient'
type PatientStatus = 'normal' | 'warning' | 'ineligible'

// ─── Waveform Data ────────────────────────────────────────────────────────────

const WN = 480

const RESP_WAVE = Array.from({ length: WN }, (_, i) => {
  const t = i / WN
  return 0.5 + 0.3 * Math.sin(2 * Math.PI * 5 * t) + 0.07 * Math.sin(2 * Math.PI * 11.5 * t + 0.5)
})

const HEART_WAVE = Array.from({ length: WN }, (_, i) => {
  const f = ((i / WN) * 72) % 1
  if (f < 0.03) return 0.55 + (f / 0.03) * 0.37
  if (f < 0.065) return 0.92 - ((f - 0.03) / 0.035) * 0.65
  if (f < 0.1) return 0.27 + ((f - 0.065) / 0.035) * 0.28
  return 0.55 + 0.018 * Math.sin(2 * Math.PI * 7 * (i / WN) + 1.2)
})

const TEMP_WAVE = Array.from({ length: WN }, (_, i) => {
  const t = i / WN
  return 0.5 + 0.045 * Math.sin(2 * Math.PI * 0.45 * t) + 0.018 * Math.cos(2 * Math.PI * 2 * t)
})

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ wave, color, offset, h = 44 }: { wave: number[]; color: string; offset: number; h?: number }) {
  const W = 500
  const visible = 140
  const pts = Array.from({ length: visible }, (_, i) => {
    const y = wave[(offset + i) % wave.length]
    const x = (i / (visible - 1)) * W
    const yc = (1 - y) * h
    return `${x.toFixed(1)},${yc.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="w-full" style={{ height: h }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Ico({ d, cls }: { d: string; cls?: string }) {
  return (
    <svg className={cls ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const IconGrid = () => <Ico d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
const IconBuilding = () => <Ico d="M6 2h12a1 1 0 011 1v18H5V3a1 1 0 011-1zM9 22v-4h6v4M9 6h1M14 6h1M9 11h1M14 11h1" />
const IconUsers = () => <Ico d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
const IconBell = () => <Ico d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
const IconClock = () => <Ico d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" />
const IconSettings = () => <Ico d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
const IconLogOut = () => <Ico d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
const IconSearch = () => <Ico d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
const IconCheck = () => <Ico d="M20 6L9 17l-5-5" />
const IconAlertTri = () => <Ico d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
const IconHeart = () => <Ico d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
const IconThermo = () => <Ico d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
const IconWind = () => <Ico d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
const IconActivity = () => <Ico d="M22 12h-4l-3 9L9 3l-3 9H2" />
const IconShieldOff = () => <Ico d="M19.69 14a6.9 6.9 0 00.31-2V5l-8-3-3.16 1.18M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 005.62-4.38M1 1l22 22" />
const IconChevron = () => <Ico d="M9 18l6-6-6-6" />
const IconWifi = () => <Ico d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
function IconVideo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'md' }: { status: PatientStatus; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = {
    normal: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#2563EB', label: 'BÌNH THƯỜNG' },
    warning: { bg: '#FEF2F2', color: '#B91C1C', dot: '#DC2626', label: 'CẢNH BÁO KHẨN' },
    ineligible: { bg: '#FFFBEB', color: '#B45309', dot: '#D97706', label: 'KHÔNG ĐỦ ĐIỀU KIỆN' },
  }[status]

  const px = size === 'sm' ? 'px-2.5 py-1' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5'
  const textCls = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-[11px]'

  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${px} ${textCls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ page, navigate }: { page: Page; navigate: (p: Page) => void }) {
  const isRoomActive = ['rooms', 'room101', 'patient'].includes(page)

  const items = [
    { label: 'Tổng quan', icon: <IconGrid />, key: 'overview', active: false },
    { label: 'Phòng bệnh', icon: <IconBuilding />, key: 'rooms', active: isRoomActive },
    { label: 'Bệnh nhân', icon: <IconUsers />, key: 'patients', active: false },
    { label: 'Cảnh báo', icon: <IconBell />, key: 'alerts', active: false, badge: '0' },
    { label: 'Lịch sử', icon: <IconClock />, key: 'history', active: false },
    { label: 'Cài đặt', icon: <IconSettings />, key: 'settings', active: false },
  ]

  return (
    <aside className="flex flex-col h-full shrink-0 border-r border-slate-100 bg-white" style={{ width: 240 }}>
      <div className="px-6 pt-6 pb-5 border-b border-slate-100">
        <div style={{ color: '#1565C0', fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Y NHÃN
        </div>
        <div className="text-slate-400 mt-1" style={{ fontSize: 11, letterSpacing: '0.04em' }}>by ViCare</div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => item.key === 'rooms' ? navigate('rooms') : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 ${
              item.active ? 'font-semibold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium'
            }`}
            style={item.active ? { backgroundColor: '#EFF6FF', color: '#1D4ED8' } : {}}
          >
            <span className={`shrink-0 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} style={{ width: 18, height: 18 }}>
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bác sĩ</div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#1565C0' }}>
            NM
          </div>
          <div className="text-[13px] font-semibold text-slate-700 leading-tight">BS. Nguyễn Văn Minh</div>
        </div>
        <button className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-red-500 transition-colors">
          <span style={{ width: 14, height: 14 }}><IconLogOut /></span>
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

// ─── App Header ───────────────────────────────────────────────────────────────

function AppHeader({ page, navigate }: { page: Page; navigate: (p: Page) => void }) {
  const crumbs: { label: string; to?: Page }[] = (() => {
    if (page === 'rooms') return [{ label: 'Phòng bệnh' }]
    if (page === 'room101') return [{ label: 'Phòng bệnh', to: 'rooms' }, { label: 'Phòng 101' }]
    if (page === 'patient') return [{ label: 'Phòng bệnh', to: 'rooms' }, { label: 'Phòng 101', to: 'room101' }, { label: 'Giường 01' }]
    return []
  })()

  return (
    <header className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-8" style={{ height: 64 }}>
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300" style={{ width: 16, height: 16 }}><IconChevron /></span>}
            {c.to ? (
              <button onClick={() => navigate(c.to!)} className="text-slate-400 hover:text-blue-600 transition-colors font-medium">
                {c.label}
              </button>
            ) : (
              <span className="font-semibold text-slate-700">{c.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: 14, height: 14 }}><IconSearch /></span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
            style={{ width: 200 }}
          />
        </div>
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all">
          <span style={{ width: 20, height: 20 }}><IconBell /></span>
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#1565C0' }}>
          NM
        </div>
      </div>
    </header>
  )
}

// ─── App Layout ───────────────────────────────────────────────────────────────

function AppLayout({ page, navigate, children }: { page: Page; navigate: (p: Page) => void; children: React.ReactNode }) {
  return (
    <div className="flex h-full" style={{ backgroundColor: '#F1F5F9' }}>
      <Sidebar page={page} navigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader page={page} navigate={navigate} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [remember, setRemember] = useState(false)

  return (
    <div className="h-full flex" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Illustration panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 shrink-0"
        style={{ width: 480, background: 'linear-gradient(150deg,#1565C0 0%,#0D47A1 55%,#01579B 100%)' }}
      >
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Y NHÃN</div>
          <div className="text-blue-200 mt-1" style={{ fontSize: 12, letterSpacing: '0.04em' }}>by ViCare</div>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <svg viewBox="0 0 360 300" className="w-full max-w-[340px]" fill="none">
            <rect x="20" y="50" width="320" height="210" rx="12" fill="rgba(255,255,255,0.06)" />
            <rect x="50" y="110" width="260" height="110" rx="8" fill="rgba(255,255,255,0.1)" />
            <rect x="50" y="100" width="260" height="30" rx="6" fill="rgba(255,255,255,0.14)" />
            <ellipse cx="180" cy="168" rx="100" ry="26" fill="rgba(255,255,255,0.1)" />
            <circle cx="270" cy="128" r="22" fill="rgba(255,255,255,0.17)" />
            <rect x="280" y="52" width="52" height="38" rx="4" fill="rgba(255,255,255,0.13)" />
            <polyline points="286,82 293,72 300,77 307,64 314,70 321,62 328,69" fill="none" stroke="rgba(134,239,172,0.8)" strokeWidth="2" />
            <rect x="244" y="105" width="52" height="50" rx="3" fill="none" stroke="rgba(96,165,250,0.65)" strokeWidth="1.5" strokeDasharray="5,3" />
            <rect x="248" y="140" width="28" height="16" rx="1.5" fill="none" stroke="rgba(52,211,153,0.6)" strokeWidth="1" strokeDasharray="3,2" />
            <rect x="34" y="232" width="78" height="30" rx="6" fill="rgba(255,255,255,0.1)" />
            <text x="46" y="245" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace">TEMP</text>
            <text x="46" y="256" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">36.8°C</text>
            <rect x="128" y="232" width="78" height="30" rx="6" fill="rgba(255,255,255,0.1)" />
            <text x="140" y="245" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace">RESP</text>
            <text x="140" y="256" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">17/min</text>
            <rect x="222" y="232" width="78" height="30" rx="6" fill="rgba(255,255,255,0.1)" />
            <text x="234" y="245" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace">HR</text>
            <text x="234" y="256" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">72 BPM</text>
          </svg>
        </div>

        <div>
          <div className="text-white font-semibold text-lg leading-snug" style={{ fontFamily: "'DM Sans',sans-serif" }}>
            Giám sát bệnh nhân<br />không tiếp xúc
          </div>
          <p className="text-blue-200 text-sm mt-2 leading-relaxed">
            Theo dõi chỉ số sinh tồn bằng camera nhiệt và hồng ngoại. Không cần gắn cảm biến trực tiếp.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 700, color: '#1565C0', letterSpacing: '-0.02em' }}>Y NHÃN</div>
            <div className="text-slate-400 text-xs mt-0.5">Patient Monitoring System · by ViCare</div>
            <h2 className="text-[26px] font-bold text-slate-800 mt-7" style={{ fontFamily: "'DM Sans',sans-serif" }}>Đăng nhập</h2>
            <p className="text-slate-500 text-sm mt-1">Vui lòng nhập thông tin tài khoản của bạn.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tài khoản</label>
              <input
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="Nhập tài khoản..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none bg-white transition-all"
                style={{ boxShadow: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none bg-white transition-all"
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rem"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-blue-600"
              />
              <label htmlFor="rem" className="text-sm text-slate-600 cursor-pointer select-none">Ghi nhớ đăng nhập</label>
            </div>
            <button
              onClick={onLogin}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.99] mt-2"
              style={{ backgroundColor: '#1565C0' }}
            >
              Đăng nhập
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">© 2026 ViCare. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Rooms Page ───────────────────────────────────────────────────────────────

function RoomsPage({ navigate }: { navigate: (p: Page) => void }) {
  const rooms = [
    { id: '101', beds: 5, used: 5, status: 'Đang giám sát', active: true, patients: ['Phạm Văn A', 'Nguyễn Văn B', 'Trần Thị C', 'Lê Văn D', 'Hoàng Thị E'] },
    { id: '102', beds: 4, used: 4, status: 'Chưa kết nối', active: false, patients: [] },
    { id: '103', beds: 3, used: 3, status: 'Chưa kết nối', active: false, patients: [] },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Phòng bệnh</h1>
        <p className="text-slate-500 text-sm mt-1">Theo dõi tình trạng bệnh nhân theo từng phòng.</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {rooms.map(room => (
          <div
            key={room.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col gap-5 transition-all ${
              room.active ? 'border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5' : 'border-slate-100 opacity-55'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Phòng {room.id}</div>
                <div className="text-sm text-slate-500 mt-0.5">{room.beds} bệnh nhân</div>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={room.active ? { backgroundColor: '#DBEAFE', color: '#1D4ED8' } : { backgroundColor: '#F1F5F9', color: '#94a3b8' }}
              >
                {room.status}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Giường đang dùng</span>
                <span className="font-semibold text-slate-700">{room.used} / {room.beds}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(room.used / room.beds) * 100}%`, backgroundColor: room.active ? '#2563EB' : '#94a3b8' }}
                />
              </div>
            </div>

            {room.active && (
              <div className="space-y-1.5">
                {room.patients.slice(0, 3).map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {name}
                  </div>
                ))}
                {room.patients.length > 3 && (
                  <div className="text-xs text-slate-400">+{room.patients.length - 3} bệnh nhân khác</div>
                )}
              </div>
            )}

            <button
              onClick={() => room.active ? navigate('room101') : undefined}
              disabled={!room.active}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                room.active ? 'text-white hover:opacity-90 active:scale-[0.99]' : 'text-slate-400 bg-slate-100 cursor-not-allowed'
              }`}
              style={room.active ? { backgroundColor: '#1565C0' } : {}}
            >
              {room.active ? 'Mở phòng' : 'Không khả dụng'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Room 101 Page ────────────────────────────────────────────────────────────

const BEDS_DATA = [
  { id: '01', name: 'Phạm Văn A', x: 26, clickable: true },
  { id: '02', name: 'Nguyễn Văn B', x: 196, clickable: false },
  { id: '03', name: 'Trần Thị C', x: 366, clickable: false },
  { id: '04', name: 'Lê Văn D', x: 536, clickable: false },
  { id: '05', name: 'Hoàng Thị E', x: 706, clickable: false },
]

function Room101Page({ navigate }: { navigate: (p: Page) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Phòng 101</h1>
        <p className="text-slate-500 text-sm mt-1">Theo dõi trực tiếp 5 bệnh nhân</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Bệnh nhân', value: '5', color: '#1565C0', bg: '#EFF6FF' },
          { label: 'Đang theo dõi', value: '5', color: '#059669', bg: '#ECFDF5' },
          { label: 'Cảnh báo', value: '0', color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Phòng', value: '101', color: '#7C3AED', bg: '#F5F3FF' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
              style={{ backgroundColor: item.bg, color: item.color }}>
              {item.value}
            </div>
            <div className="text-sm text-slate-500 font-medium">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-semibold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Camera tổng – Phòng 101</div>
            <div className="text-xs text-slate-400 mt-0.5">Nhấn vào giường 01 để xem chi tiết bệnh nhân</div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 live-blink shrink-0" />
            LIVE
          </div>
        </div>

        <div className="relative" style={{ backgroundColor: '#0b1220' }}>
          <div
            className="absolute inset-x-0 top-0 scan-line pointer-events-none z-10"
            style={{ height: 2, background: 'linear-gradient(to right,transparent,rgba(96,165,250,0.55),transparent)' }}
          />
          <svg viewBox="0 0 878 400" className="w-full block">
            <defs>
              <radialGradient id="roomBg" cx="50%" cy="55%" r="65%">
                <stop offset="0%" stopColor="#192840" />
                <stop offset="100%" stopColor="#0b1220" />
              </radialGradient>
            </defs>
            <rect width="878" height="400" fill="url(#roomBg)" />
            <rect x="0" y="330" width="878" height="70" fill="#080e1a" opacity="0.75" />
            <line x1="0" y1="330" x2="878" y2="330" stroke="#1e3a5f" strokeWidth="1" />
            <rect x="0" y="0" width="878" height="10" fill="#0e1924" />

            {BEDS_DATA.map(bed => {
              const W = 152
              const bx = bed.x
              const by = 110
              const bh = 190
              const isHov = hovered === bed.id
              const bColor = isHov ? '#93c5fd' : '#3b82f6'
              const bOp = isHov ? 0.95 : 0.55

              return (
                <g
                  key={bed.id}
                  style={{ cursor: bed.clickable ? 'pointer' : 'default' }}
                  onClick={() => bed.clickable ? navigate('patient') : undefined}
                  onMouseEnter={() => setHovered(bed.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <rect x={bx} y={by} width={W} height={bh} rx="4"
                    fill={isHov ? 'rgba(59,130,246,0.07)' : 'transparent'}
                    stroke={bColor} strokeWidth={isHov ? 1.8 : 1.1}
                    strokeDasharray="8,5" opacity={bOp} />

                  {/* Corner handles */}
                  <rect x={bx} y={by} width={14} height={2.5} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx} y={by} width={2.5} height={14} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx + W - 14} y={by} width={14} height={2.5} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx + W - 2.5} y={by} width={2.5} height={14} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx} y={by + bh - 2.5} width={14} height={2.5} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx} y={by + bh - 14} width={2.5} height={14} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx + W - 14} y={by + bh - 2.5} width={14} height={2.5} fill={bColor} opacity={bOp} rx="1" />
                  <rect x={bx + W - 2.5} y={by + bh - 14} width={2.5} height={14} fill={bColor} opacity={bOp} rx="1" />

                  {/* Bed */}
                  <rect x={bx + 16} y={by + 70} width={W - 32} height={100} rx="5" fill="#19283f" />
                  <rect x={bx + 20} y={by + 65} width={W - 40} height={92} rx="4" fill="#213244" />
                  <rect x={bx + W - 56} y={by + 62} width={38} height={26} rx="7" fill="#2a4060" />
                  <ellipse cx={bx + W / 2 - 8} cy={by + 118} rx={36} ry={17} fill="#304e68" opacity="0.9" />
                  <circle cx={bx + W - 42} cy={by + 78} r={15} fill="#3a5870" opacity="0.95" />
                  <rect x={bx + 22} y={by + 154} width={6} height={16} rx="2" fill="#111e2e" />
                  <rect x={bx + W - 28} y={by + 154} width={6} height={16} rx="2" fill="#111e2e" />

                  {/* Badge */}
                  <rect x={bx + 4} y={by - 46} width={W - 8} height={40} rx="6"
                    fill={isHov ? 'rgba(29,78,216,0.95)' : 'rgba(20,52,96,0.9)'} />
                  <circle cx={bx + 17} cy={by - 26} r={4} fill={isHov ? '#34d399' : '#22c55e'} />
                  <text x={bx + 28} y={by - 33} fill="white" fontSize="9.5" fontWeight="700" fontFamily="'DM Sans',sans-serif">Giường {bed.id}</text>
                  <text x={bx + 28} y={by - 20} fill="#93c5fd" fontSize="8.5" fontFamily="'Inter',sans-serif">{bed.name}</text>
                  <text x={bx + 28} y={by - 10} fill="#6ee7b7" fontSize="8" fontFamily="'Inter',sans-serif">● Ổn định</text>

                  {/* Hover tooltip for clickable bed */}
                  {bed.clickable && isHov && (
                    <g>
                      <rect x={bx + W / 2 - 38} y={by + bh + 10} width={76} height={22} rx="11" fill="rgba(37,99,235,0.95)" />
                      <text x={bx + W / 2} y={by + bh + 25} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="'Inter',sans-serif">Xem chi tiết →</text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Thermal Camera ───────────────────────────────────────────────────────────

function ThermalCamera({ status }: { status: PatientStatus }) {
  const vals = { normal: { temp: '36.8', resp: '17' }, warning: { temp: '40.0', resp: '10' }, ineligible: { temp: '—', resp: '—' } }[status]
  const isAlert = status === 'warning'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <div className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'DM Sans',sans-serif" }}>Camera nhiệt</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Thermal Monitoring · Live</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 live-blink shrink-0" />
          LIVE
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ height: 240, backgroundColor: '#050d1a' }}>
        <div className="absolute inset-0 thermal-glow" style={{ background: 'radial-gradient(ellipse 55% 60% at 70% 52%,rgba(180,83,9,0.3) 0%,rgba(124,58,237,0.18) 42%,transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 50% at 28% 58%,rgba(29,78,216,0.18) 0%,transparent 58%)' }} />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 240" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="thermalScale" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          <rect x="80" y="145" width="520" height="68" rx="6" fill="#0f2040" opacity="0.9" />
          <rect x="90" y="138" width="500" height="76" rx="5" fill="#142840" />
          <rect x="510" y="130" width="78" height="42" rx="10" fill="#6d28d9" opacity="0.38" />
          <ellipse cx="340" cy="175" rx="170" ry="28" fill="#b45309" opacity="0.22" />
          <ellipse cx="340" cy="164" rx="115" ry="20" fill="#d97706" opacity="0.3" />
          <ellipse cx="550" cy="152" rx="30" ry="26" fill="#ef4444" opacity="0.72" />
          <ellipse cx="550" cy="147" rx="17" ry="14" fill="#fbbf24" opacity="0.58" />
          <rect x="518" y="118" width="64" height="62" rx="3" fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="5,3" />
          <text x="584" y="130" fill="#60a5fa" fontSize="7.5" fontFamily="monospace">FACE</text>
          <rect x="530" y="142" width="34" height="22" rx="1.5" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3,2" />
          <text x="566" y="157" fill="#34d399" fontSize="7" fontFamily="monospace">RESP</text>
          <rect x="650" y="28" width="10" height="184" rx="5" fill="url(#thermalScale)" opacity="0.65" />
          <text x="641" y="34" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace" textAnchor="end">40°</text>
          <text x="641" y="218" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace" textAnchor="end">33°</text>
        </svg>

        {status === 'ineligible' ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <div className="text-center">
              <div className="text-amber-400 font-semibold text-sm mb-1">Không đủ điều kiện giám sát</div>
              <div className="text-slate-400 text-xs">Bệnh nhân cần được định vị lại</div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 flex gap-2">
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">TEMP</div>
              <div className="text-sm font-bold font-mono" style={{ color: isAlert ? '#fca5a5' : '#fbbf24' }}>{vals.temp} °C</div>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">RESP</div>
              <div className="text-sm font-bold font-mono" style={{ color: isAlert ? '#fca5a5' : '#34d399' }}>{vals.resp} /min</div>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-600">14:02:45</div>
      </div>
    </div>
  )
}

// ─── NIR Camera ───────────────────────────────────────────────────────────────

function NIRCamera({ status }: { status: PatientStatus }) {
  const hrVal = { normal: '72 BPM', warning: '112 BPM', ineligible: '—' }[status]
  const hrColor = status === 'warning' ? '#fca5a5' : '#34d399'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <div className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'DM Sans',sans-serif" }}>Camera hồng ngoại</div>
          <div className="text-[11px] text-slate-400 mt-0.5">NIR Monitoring · Live</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 live-blink shrink-0" />
          LIVE
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ height: 200, backgroundColor: '#030c10' }}>
        <div className="absolute inset-0 nir-glow" style={{ background: 'radial-gradient(ellipse 48% 52% at 64% 50%,rgba(16,185,129,0.13) 0%,transparent 62%)' }} />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 200" preserveAspectRatio="xMidYMid slice">
          <rect x="100" y="105" width="480" height="78" rx="5" fill="#071420" opacity="0.9" />
          <ellipse cx="340" cy="148" rx="155" ry="24" fill="#0c2032" />
          <ellipse cx="548" cy="125" rx="33" ry="29" fill="#163045" />
          <ellipse cx="548" cy="120" rx="19" ry="16" fill="#1d3d56" opacity="0.9" />
          <ellipse cx="540" cy="116" rx="5" ry="3" fill="#0a1e2e" />
          <ellipse cx="558" cy="116" rx="5" ry="3" fill="#0a1e2e" />
          <rect x="512" y="92" width="74" height="66" rx="3" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="5,3" />
          <text x="588" y="104" fill="#34d399" fontSize="7.5" fontFamily="monospace">rPPG</text>
          <rect x="528" y="100" width="40" height="20" rx="2" fill="none" stroke="#34d399" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.55" />
          <text x="20" y="190" fill="rgba(52,211,153,0.5)" fontSize="7.5" fontFamily="monospace">SQ: GOOD · IMVIA-NIR</text>
        </svg>

        {status === 'ineligible' ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <div className="text-center">
              <div className="text-amber-400 font-semibold text-sm mb-1">Không đủ điều kiện giám sát</div>
              <div className="text-slate-400 text-xs">Cần điều chỉnh vị trí bệnh nhân</div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3">
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">HEART RATE</div>
              <div className="text-sm font-bold font-mono" style={{ color: hrColor }}>{hrVal}</div>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-600">14:02:45</div>
      </div>
    </div>
  )
}

// ─── Vital Waveforms ──────────────────────────────────────────────────────────

function VitalWaveforms({ status, offset }: { status: PatientStatus; offset: number }) {
  const isAlert = status === 'warning'
  const isIneligible = status === 'ineligible'

  const waves = [
    { label: 'Nhiệt độ', value: isIneligible ? '—' : isAlert ? '40.0' : '36.8', unit: '°C', normalColor: '#f59e0b', wave: TEMP_WAVE, icon: <IconThermo /> },
    { label: 'Nhịp thở', value: isIneligible ? '—' : isAlert ? '10' : '17', unit: '/min', normalColor: '#10b981', wave: RESP_WAVE, icon: <IconWind /> },
    { label: 'Nhịp tim', value: isIneligible ? '—' : isAlert ? '112' : '72', unit: 'BPM', normalColor: '#ef4444', wave: HEART_WAVE, icon: <IconHeart /> },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'DM Sans',sans-serif" }}>Tín hiệu sinh tồn trực tiếp</div>
          <div className="text-[11px] text-slate-400 mt-0.5">60 giây gần nhất</div>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg font-mono">14:02:45</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {waves.map(w => {
          const color = isAlert ? '#DC2626' : w.normalColor
          return (
            <div key={w.label} className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span style={{ color, width: 14, height: 14 }}>{w.icon}</span>
                  <span className="text-[11px] font-semibold text-slate-600">{w.label}</span>
                </div>
                <div>
                  <span className="text-sm font-bold" style={{ color }}>{w.value}</span>
                  {w.value !== '—' && <span className="text-[10px] text-slate-400 ml-0.5">{w.unit}</span>}
                </div>
              </div>
              {isIneligible ? (
                <div className="h-11 flex items-center justify-center">
                  <span className="text-[11px] text-slate-400">Không có dữ liệu</span>
                </div>
              ) : (
                <Sparkline wave={w.wave} color={color} offset={offset} h={44} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── System Status ────────────────────────────────────────────────────────────

function SystemStatus() {
  const items = [
    { label: 'Thermal Camera', status: 'Đang hoạt động', ok: true, icon: <IconVideo /> },
    { label: 'NIR Camera', status: 'Đang hoạt động', ok: true, icon: <IconVideo /> },
    { label: 'Patient Tracking', status: 'Bình thường', ok: true, icon: <IconActivity /> },
    { label: 'Signal Quality', status: 'Tốt', ok: true, icon: <IconWifi /> },
  ]

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái hệ thống</div>
      </div>
      <div className="p-3 space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="text-slate-400 shrink-0" style={{ width: 13, height: 13 }}>{item.icon}</span>
              {item.label}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#059669' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard() {
  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden fade-in">
      <div className="px-5 py-4" style={{ backgroundColor: '#FEF2F2' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
              <span style={{ width: 16, height: 16 }}><IconAlertTri /></span>
            </div>
            <div>
              <div className="text-sm font-bold text-red-700">🔔 CẢNH BÁO KHẨN</div>
              <div className="text-[10px] font-mono text-red-400">14:02:45 · Vừa xong</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">KHẨN CẤP</span>
        </div>
        <p className="text-sm mt-3 font-medium text-red-800">Có dấu hiệu bất thường cần kiểm tra bệnh nhân ngay.</p>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bệnh nhân</div>
            <div className="text-sm font-semibold text-slate-800">Phạm Văn A</div>
            <div className="text-xs text-slate-500 mt-0.5">65 tuổi · Nam · 165cm · 68kg</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí</div>
            <div className="text-sm font-semibold text-slate-800">Giường 01</div>
            <div className="text-xs text-slate-500 mt-0.5">Phòng 101</div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chỉ số bất thường</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Nhịp thở', value: '10', unit: '/min' },
            { label: 'Nhiệt độ', value: '40.0', unit: '°C' },
            { label: 'Nhịp tim', value: '112', unit: 'BPM' },
          ].map(v => (
            <div key={v.label} className="rounded-xl p-3 border border-red-200" style={{ backgroundColor: '#FEF2F2' }}>
              <div className="text-[10px] text-red-400 mb-1">{v.label}</div>
              <div className="font-bold text-red-600 text-sm">
                {v.value}<span className="text-xs font-normal ml-0.5">{v.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Patient Dashboard ────────────────────────────────────────────────────────

function PatientDashboard({
  status,
  onToggleWarning,
  onMarkIneligible,
  onMarkNormal,
}: {
  status: PatientStatus
  onToggleWarning: () => void
  onMarkIneligible: () => void
  onMarkNormal: () => void
}) {
  const vitals = {
    normal: { temp: '36.8', resp: '17', hr: '72' },
    warning: { temp: '40.0', resp: '10', hr: '112' },
    ineligible: { temp: '—', resp: '—', hr: '—' },
  }[status]

  const isAlert = status === 'warning'
  const isIneligible = status === 'ineligible'

  const statusBg = status === 'normal' ? '#EFF6FF' : status === 'warning' ? '#FEF2F2' : '#FFFBEB'
  const statusColor = status === 'normal' ? '#1D4ED8' : status === 'warning' ? '#B91C1C' : '#B45309'
  const statusIconBg = status === 'normal' ? '#DBEAFE' : status === 'warning' ? '#FEE2E2' : '#FDE68A'
  const statusLabel = status === 'normal' ? 'BÌNH THƯỜNG' : status === 'warning' ? 'CẢNH BÁO KHẨN' : 'KHÔNG ĐỦ ĐIỀU KIỆN GIÁM SÁT'
  const statusDesc = status === 'normal'
    ? 'Các chỉ số sinh tồn đang trong giới hạn theo dõi.'
    : status === 'warning'
    ? 'Có dấu hiệu bất thường cần kiểm tra ngay.'
    : 'Bệnh nhân không đủ điều kiện để giám sát tự động.'
  const tsColor = status === 'normal' ? '#93C5FD' : status === 'warning' ? '#FCA5A5' : '#FCD34D'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 130px)', overflow: 'hidden' }}>
      {/* Status header */}
      <div className="px-5 py-4 border-b border-slate-100" style={{ backgroundColor: statusBg }}>
        <div className="flex items-start gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: statusIconBg, color: statusColor }}>
            {status === 'normal' && <span style={{ width: 15, height: 15 }}><IconCheck /></span>}
            {status === 'warning' && <span style={{ width: 15, height: 15 }}><IconAlertTri /></span>}
            {status === 'ineligible' && <span style={{ width: 15, height: 15 }}><IconShieldOff /></span>}
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold" style={{ color: statusColor }}>{statusLabel}</div>
            <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: statusColor, opacity: 0.8 }}>{statusDesc}</div>
          </div>
        </div>
        <div className="text-[10px] font-mono" style={{ color: tsColor }}>14:02:45 · Vừa xong</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Patient info */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bệnh nhân</div>
          <div className="font-semibold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Phạm Văn A</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mã BN: BN-2024-0341</div>
          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vị trí</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">Giường 01</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600">Phòng 101</span>
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Nhân khẩu học</div>
          <div className="grid grid-cols-2 gap-2">
            {[{ label: 'Tuổi', value: '65' }, { label: 'Giới', value: 'Nam' }, { label: 'Cao', value: '165 cm' }, { label: 'Nặng', value: '68 kg' }].map(item => (
              <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="text-[10px] text-slate-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold text-slate-700">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vital signs */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Chỉ số sinh tồn</div>
          <div className="space-y-2.5">
            {[
              { label: 'Nhiệt độ', val: vitals.temp, unit: '°C', color: '#f59e0b', alertColor: '#DC2626', wave: TEMP_WAVE, off: 0, icon: <IconThermo />, src: 'Thermal Camera' },
              { label: 'Nhịp thở', val: vitals.resp, unit: '/min', color: '#10b981', alertColor: '#DC2626', wave: RESP_WAVE, off: 60, icon: <IconWind />, src: 'Thermal Camera' },
              { label: 'Nhịp tim', val: vitals.hr, unit: 'BPM', color: '#ef4444', alertColor: '#DC2626', wave: HEART_WAVE, off: 120, icon: <IconHeart />, src: 'NIR Camera' },
            ].map(v => {
              const vc = isAlert ? v.alertColor : v.color
              return (
                <div key={v.label} className="rounded-xl p-3" style={{
                  backgroundColor: isAlert ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${isAlert ? '#FEE2E2' : '#E2E8F0'}`,
                }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: vc, width: 14, height: 14 }}>{v.icon}</span>
                      <span className="text-[11px] font-semibold text-slate-600">{v.label}</span>
                    </div>
                    <div>
                      <span className="text-base font-bold" style={{ color: vc }}>{v.val}</span>
                      {v.val !== '—' && <span className="text-[10px] text-slate-400 ml-0.5">{v.unit}</span>}
                    </div>
                  </div>
                  {v.val !== '—' && <Sparkline wave={v.wave} color={vc} offset={v.off} h={26} />}
                  {v.val === '—' && (
                    <div className="h-7 flex items-center">
                      <span className="text-[11px] text-slate-400">Không có dữ liệu</span>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-400 mt-1">{v.src}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System status */}
        <div className="px-5 py-4">
          <SystemStatus />
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-slate-100 space-y-2 shrink-0">
        {status === 'normal' && (
          <>
            <button
              onClick={onToggleWarning}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1565C0' }}
            >
              <span style={{ width: 15, height: 15 }}><IconCheck /></span>
              ✓ Ổn định
            </button>
            <button
              onClick={onMarkIneligible}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 border flex items-center justify-center gap-2"
              style={{ color: '#B45309', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
            >
              <span style={{ width: 15, height: 15 }}><IconShieldOff /></span>
              Không đủ điều kiện giám sát
            </button>
          </>
        )}

        {status === 'warning' && (
          <>
            <button
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#DC2626' }}
            >
              <span style={{ width: 15, height: 15 }}><IconBell /></span>
              Báo cáo Điều dưỡng
            </button>
            <button
              onClick={onMarkNormal}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center gap-2"
            >
              <span style={{ width: 15, height: 15 }}><IconCheck /></span>
              Đánh dấu bệnh nhân ổn định
            </button>
          </>
        )}

        {status === 'ineligible' && (
          <>
            <div className="text-center text-xs text-amber-700 bg-amber-50 rounded-xl py-2.5 px-3 border border-amber-200">
              Cần định vị lại bệnh nhân để bắt đầu giám sát
            </div>
            <button
              onClick={onMarkNormal}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center gap-2"
            >
              <span style={{ width: 15, height: 15 }}><IconCheck /></span>
              Đánh dấu ổn định
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Patient Monitoring Page ──────────────────────────────────────────────────

function PatientMonitoringPage({
  status,
  onToggleWarning,
  onMarkIneligible,
  onMarkNormal,
}: {
  status: PatientStatus
  onToggleWarning: () => void
  onMarkIneligible: () => void
  onMarkNormal: () => void
}) {
  const [waveOffset, setWaveOffset] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setWaveOffset(o => (o + 1) % WN), 80)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-slate-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>Phạm Văn A</h1>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500">Giường 01 · Phòng 101</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-blink shrink-0" />
              Đang giám sát trực tiếp
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-mono">Thứ Sáu, 29/08/2026</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">14:02:45</div>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Left: cameras + waveforms */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 calc(65% - 10px)' }}>
          {status === 'warning' && <AlertCard />}
          <ThermalCamera status={status} />
          <NIRCamera status={status} />
          <VitalWaveforms status={status} offset={waveOffset} />
        </div>

        {/* Right: patient dashboard */}
        <div style={{ flex: '0 0 35%' }}>
          <div style={{ position: 'sticky', top: 24 }}>
            <PatientDashboard
              status={status}
              onToggleWarning={onToggleWarning}
              onMarkIneligible={onMarkIneligible}
              onMarkNormal={onMarkNormal}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function LegacyApp() {
  const [page, setPage] = useState<Page>('login')
  const [patientStatus, setPatientStatus] = useState<PatientStatus>('normal')

  const navigate = useCallback((p: Page) => setPage(p), [])
  const toggleWarning = useCallback(() => setPatientStatus(s => s === 'normal' ? 'warning' : 'normal'), [])
  const markIneligible = useCallback(() => setPatientStatus('ineligible'), [])
  const markNormal = useCallback(() => setPatientStatus('normal'), [])

  if (page === 'login') return <LoginPage onLogin={() => setPage('rooms')} />

  return (
    <AppLayout page={page} navigate={navigate}>
      {page === 'rooms' && <RoomsPage navigate={navigate} />}
      {page === 'room101' && <Room101Page navigate={navigate} />}
      {page === 'patient' && (
        <PatientMonitoringPage
          status={patientStatus}
          onToggleWarning={toggleWarning}
          onMarkIneligible={markIneligible}
          onMarkNormal={markNormal}
        />
      )}
    </AppLayout>
  )
}

export default VicareApp
