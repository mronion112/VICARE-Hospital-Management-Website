import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"

type Page = "login" | "overview" | "rooms" | "room" | "patients" | "alerts" | "more" | "history" | "settings" | "patient"
type State = "stable" | "attention" | "blocked"
type Point = [number, number]
type Monitor = {
  lcas: { subject: string; video: string; duration: number; frames: number; heartRate: number; respirationRate: number; heartbeat: Point[]; respiration: Point[] }
  imvia: { subject: string; video: string; duration: number; bvp: Point[] }
}
type Data = { generatedFrom: string; beds: Record<string, Monitor> }
type Patient = { bed: string; name: string; code: string; age: number; gender: string; height: number; weight: number; temperature: number; spo2: number; heartRate: number; respirationRate: number; medicalHistory: boolean; diagnosis: string; admitted: string; state: State; observationIssue?: "occluded" | "quality" }
const mockTrend = (value: number, amplitude: number): Point[] => Array.from({ length: 61 }, (_, i) => [i * 0.5, +(value + Math.sin(i * 0.38) * amplitude).toFixed(1)] as Point)

const PATIENTS: Patient[] = [
  { bed: "01", name: "Phạm Văn An", code: "BN-2608-0341", age: 65, gender: "Nam", height: 165, weight: 68, temperature: 36.8, spo2: 99, heartRate: 78, respirationRate: 18, medicalHistory: true, diagnosis: "Theo dõi sau phẫu thuật", admitted: "26/08/2026", state: "stable" },
  { bed: "02", name: "Nguyễn Thị Bình", code: "BN-2608-0342", age: 58, gender: "Nữ", height: 158, weight: 56, temperature: 36.8, spo2: 98, heartRate: 82, respirationRate: 20, medicalHistory: false, diagnosis: "Viêm phổi", admitted: "26/08/2026", state: "blocked", observationIssue: "quality" },
  { bed: "03", name: "Trần Minh Châu", code: "BN-2608-0343", age: 71, gender: "Nam", height: 170, weight: 74, temperature: 36.6, spo2: 98, heartRate: 88, respirationRate: 31, medicalHistory: true, diagnosis: "Suy hô hấp nhẹ", admitted: "27/08/2026", state: "attention" },
  { bed: "04", name: "Lê Thu Dung", code: "BN-2608-0344", age: 49, gender: "Nữ", height: 160, weight: 61, temperature: 37.0, spo2: 97, heartRate: 76, respirationRate: 18, medicalHistory: true, diagnosis: "Theo dõi tim mạch", admitted: "27/08/2026", state: "blocked", observationIssue: "occluded" },
  { bed: "05", name: "Hoàng Văn Em", code: "BN-2608-0345", age: 76, gender: "Nam", height: 168, weight: 79, temperature: 38.2, spo2: 97, heartRate: 102, respirationRate: 20, medicalHistory: true, diagnosis: "Tăng huyết áp", admitted: "28/08/2026", state: "attention" },
]

type AlertItem = { id: string; group: "vital" | "action"; bed?: string; icon: string; title: string; text: string; time: string; state: State; value?: string }
const ALERT_ITEMS: AlertItem[] = [
  { id: "heart-05", group: "vital", bed: "05", icon: "heart", title: "Nhịp tim cao hơn ngưỡng", text: "Hoàng Văn Em · Nhịp tim hiện tại 102 BPM (ngưỡng cảnh báo 100 BPM).", time: "14:02", state: "attention", value: "102 BPM" },
  { id: "temp-high-05", group: "vital", bed: "05", icon: "alert", title: "Nhiệt độ cao bất thường", text: "Hoàng Văn Em · Nhiệt độ bề mặt 38,2°C.", time: "14:01", state: "attention", value: "38,2°C" },
  { id: "spo2-03", group: "vital", bed: "03", icon: "pulse", title: "SpO₂ giảm · đã hồi phục", text: "Trần Minh Châu · Từng giảm xuống 93%, hiện tại 98%.", time: "13:56", state: "attention", value: "93% → 98%" },
  { id: "resp-03", group: "vital", bed: "03", icon: "pulse", title: "Nhịp thở tăng mạnh", text: "Trần Minh Châu · 31 lần/phút, cao hơn ngưỡng theo dõi.", time: "13:52", state: "attention", value: "31 lần/phút" },
  { id: "temp-low-02", group: "vital", bed: "02", icon: "alert", title: "Nhiệt độ thấp bất thường · đã hồi phục", text: "Nguyễn Thị Bình · Từng ghi nhận 35,4°C; hiện tại 36,8°C.", time: "13:40", state: "attention", value: "35,4°C → 36,8°C" },
  { id: "fall-05", group: "action", bed: "05", icon: "alert", title: "Phát hiện té ngã", text: "Hoàng Văn Em · Có video demo sự kiện để xem lại.", time: "14:04", state: "attention" },
  { id: "blocked-04", group: "action", bed: "04", icon: "eyeoff", title: "Không thể quan sát · bị che khuất", text: "Lê Thu Dung · Vùng mặt và thân trên bị vật thể che.", time: "13:58", state: "blocked" },
  { id: "quality-02", group: "action", bed: "02", icon: "camera", title: "Không thể quan sát · chất lượng camera thấp", text: "Nguyễn Thị Bình · Hình ảnh chưa đáp ứng điều kiện quan sát.", time: "13:48", state: "blocked" },
  { id: "empty-06", group: "action", icon: "people", title: "Không thể quan sát · không có bệnh nhân", text: "Giường 06 · Vị trí đang trống, không có bệnh nhân.", time: "13:32", state: "blocked" },
]

const PATHS: Record<string, string> = {
  home: "M3 10.8L12 3l9 7.8M5.5 9v11h13V9M9.5 20v-6h5v6",
  room: "M3 19V5m18 14v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7m0-4h18m-14-4h.01M11 11h.01",
  people: "M20 21v-2a8 8 0 00-16 0v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M14 21h-4",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20M12 6v6l4 2",
  history: "M3 12a9 9 0 109-9 9 9 0 00-9 9M3 5v5h5M12 7v5l3 2",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6M19 12h3M2 12h3M12 2v3M12 19v3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  search: "M21 21l-4.4-4.4M11 19a8 8 0 100-16 8 8 0 000 16",
  heart: "M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z",
  pulse: "M2 12h4l2-6 4 12 3-9 2 3h5",
  drop: "M12 2.5S6 9.2 6 14a6 6 0 0012 0c0-4.8-6-11.5-6-11.5zM9.5 15.5a2.5 2.5 0 002.5 2.5",
  camera: "M1 5h15v14H1zM16 10l7-4v12l-7-4",
  eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12M12 15a3 3 0 100-6 3 3 0 000 6",
  eyeoff: "M3 3l18 18M10.5 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a16 16 0 01-2.2 2.9M6.5 6.5C3.6 8.3 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8M10 10a3 3 0 004 4",
  alert: "M12 3L2 20h20L12 3M12 9v4M12 17h.01",
  check: "M20 6L9 17l-5-5",
  file: "M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h6",
  logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
  back: "M19 12H5M12 19l-7-7 7-7",
}
function Icon({ name, size = 20 }: { name: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name]} /></svg> }
const asset = (path?: string) => path ? `${import.meta.env.BASE_URL}${path}` : ""

function useData() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { let live = true; fetch(asset("data/monitoring.json")).then(r => r.json()).then(d => live && setData(d)).catch(console.error); return () => { live = false } }, [])
  return data
}
const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
function Logo({ light = false }: { light?: boolean }) { return <div className={`vc-logo ${light ? "light" : ""}`}><img src={asset("logo-vicare.png")} /><div><strong>VICARE</strong><span>Patient Monitoring</span></div></div> }
function Badge({ state, compact = false }: { state: State; compact?: boolean }) {
  const c = state === "stable" ? ["Ổn định", "check"] : state === "attention" ? ["Cần chú ý", "alert"] : ["Không thể quan sát", "eyeoff"]
  return <span className={`vc-badge ${state} ${compact ? "compact" : ""}`}><Icon name={c[1]} size={13} />{c[0]}</span>
}
function Observe({ ok }: { ok: boolean }) { return <span className={`observe ${ok ? "ok" : "no"}`}><Icon name={ok ? "eye" : "eyeoff"} size={14} />{ok ? "Quan sát được" : "Không thể quan sát"}</span> }

function Login({ enter }: { enter: () => void }) {
  const submit = (e: FormEvent) => { e.preventDefault(); enter() }
  return <main className="vc-login"><section className="login-blue"><Logo light /><div className="login-message"><span>NỀN TẢNG GIÁM SÁT Y KHOA</span><h1>Chăm sóc chủ động.<br />Theo dõi không tiếp xúc.</h1></div><i className="orbit a" /><i className="orbit b" /></section>
    <section className="login-white"><form onSubmit={submit}><div className="login-mobile-logo"><Logo /></div><span>CỔNG THÔNG TIN BÁC SĨ</span><h2>Chào mừng trở lại</h2><p>Đăng nhập để tiếp tục theo dõi bệnh nhân.</p><label>Email hoặc mã nhân viên<input defaultValue="bs.minh@vicare.vn" /></label><label>Mật khẩu<input type="password" defaultValue="12345678" /></label><div className="login-options"><label><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div><button className="vc-primary">Đăng nhập <b>→</b></button></form></section></main>
}

const NAV: [Page, string, string][] = [["overview", "Tổng quan", "home"], ["rooms", "Phòng bệnh", "room"], ["patients", "Bệnh nhân", "people"], ["alerts", "Cảnh báo", "alert"], ["more", "Khác", "more"]]
function Shell({ page, go, back, logout, patient, select, children }: { page: Page; go: (p: Page) => void; back: () => void; logout: () => void; patient: Patient; select: (bed: string) => void; children: ReactNode }) {
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  useEffect(() => { setSearchOpen(false); setNotificationsOpen(false) }, [page])
  const matches = query.trim() ? PATIENTS.filter(p => normalizeSearch(`${p.name} ${p.code} ${p.bed}`).includes(normalizeSearch(query.trim()))) : []
  const openAlertTarget = (alert: AlertItem) => { setNotificationsOpen(false); if (alert.bed) select(alert.bed); else go("room") }
  const active = page === "room" || page === "patient" ? "rooms" : page === "history" || page === "settings" ? "more" : page
  const title: Partial<Record<Page, string>> = { overview: "Tổng quan", rooms: "Phòng bệnh", room: "Phòng 101", patients: "Bệnh nhân", alerts: "Cảnh báo", more: "Khác", history: "Lịch sử hoạt động", settings: "Cài đặt giám sát", patient: patient.name }
  return <div className="vc-shell"><aside className="vc-side"><button onClick={() => go("overview")}><Logo /></button><nav><p>KHÔNG GIAN LÀM VIỆC</p>{NAV.map(([p, label, icon]) => <button className={active === p ? "active" : ""} onClick={() => go(p)} key={p}><Icon name={icon} /><span>{label}</span>{p === "alerts" && <b>{ALERT_ITEMS.length}</b>}</button>)}</nav><div className="doctor"><i>NM<em /></i><span><strong>BS. Nguyễn Minh</strong><small>Khoa Hồi sức</small></span><button onClick={logout}><Icon name="logout" size={18} /></button></div></aside>
    <section className="vc-body" onClick={event => { const target = event.target as HTMLElement; if (!target.closest(".header-search")) setSearchOpen(false); if (!target.closest(".notification-wrap")) setNotificationsOpen(false) }}><header><div className="crumb"><button className="crumb-back" onClick={back} title="Quay lại (Alt + ←)" aria-label="Quay lại (Alt + mũi tên trái)"><Icon name="back" size={16} /><span>Quay lại</span></button><i>·</i><button onClick={() => go("overview")}>VICARE</button><b>›</b>{(page === "room" || page === "patient") && <><button onClick={() => go("rooms")}>Phòng bệnh</button><b>›</b></>} {page === "patient" && <><button onClick={() => go("room")}>Phòng 101</button><b>›</b></>}<strong>{title[page]}</strong></div><div className="head-tools"><div className="header-search"><label><Icon name="search" size={17} /><input placeholder="Tìm theo tên hoặc mã BN..." value={query} onChange={e => { setQuery(e.target.value); setSearchOpen(true) }} onFocus={() => setSearchOpen(true)} onKeyDown={e => { if (e.key === "Enter" && matches[0]) { select(matches[0].bed); setQuery(""); setSearchOpen(false) } if (e.key === "Escape") setSearchOpen(false) }} /></label>{searchOpen && query.trim() && <div className="header-popover search-results">{matches.length ? matches.map(p => <button key={p.bed} onClick={() => { select(p.bed); setQuery(""); setSearchOpen(false) }}><i>{p.name.split(" ").slice(-2).map(x => x[0]).join("")}</i><span><strong>{p.name}</strong><small>{p.code} · Giường {p.bed}, Phòng 101</small><small>{p.diagnosis} · SpO₂ {p.spo2}%</small></span><em>Hồ sơ →</em></button>) : <p>Không tìm thấy bệnh nhân phù hợp.</p>}</div>}</div><div className="notification-wrap"><button className="notification-trigger" aria-label="Mở thông báo" onClick={() => setNotificationsOpen(value => !value)}><Icon name="bell" size={19} /><i /><b>{ALERT_ITEMS.length}</b></button>{notificationsOpen && <div className="header-popover notification-popover"><header><strong>Thông báo</strong><small>{ALERT_ITEMS.length} sự kiện cần xem</small></header>{ALERT_ITEMS.map(alert => <button key={alert.id} onClick={() => openAlertTarget(alert)}><i className={alert.state}><Icon name={alert.icon} size={15} /></i><span><strong>{alert.title}</strong><small>{alert.bed ? `Giường ${alert.bed}` : "Phòng 101"} · {alert.time}</small></span><em>→</em></button>)}<footer onClick={() => { setNotificationsOpen(false); go("alerts") }}>Mở trung tâm cảnh báo →</footer></div>}</div><span>Thứ Bảy<strong>29.08.2026</strong></span></div></header><main>{children}</main></section></div>
}
function Heading({ top, title, desc, action }: { top: string; title: string; desc: string; action?: ReactNode }) { return <div className="vc-heading"><div><span>{top}</span><h1>{title}</h1><p>{desc}</p></div>{action}</div> }
function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) { return <article className={`vc-metric ${tone}`}><i><Icon name={icon} /></i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article> }

function Overview({ go, select }: { go: (p: Page) => void; select: (b: string) => void }) {
  const observable = PATIENTS.filter(p => p.state !== "blocked").length
  const attention = PATIENTS.filter(p => p.state === "attention").length
  const unobservable = PATIENTS.filter(p => p.state === "blocked").length
  return <div className="vc-page"><Heading top="TRUNG TÂM ĐIỀU HÀNH" title="Chào buổi chiều, Bác sĩ Minh" desc="Tổng hợp tình trạng giám sát tại Khoa Hồi sức hôm nay." action={<button className="vc-outline" onClick={() => go("room")}><Icon name="camera" size={17} /> Mở camera Phòng 101</button>} />
    <div className="metric-grid"><Metric icon="people" label="Bệnh nhân" value="05" note="5 người tại Phòng 101" tone="blue" /><Metric icon="eye" label="Quan sát được" value={String(observable).padStart(2, "0")} note="Camera đang theo dõi" tone="green" /><Metric icon="alert" label="Cần chú ý" value={String(attention).padStart(2, "0")} note="Sinh hiệu vượt ngưỡng" tone="red" /><Metric icon="eyeoff" label="Mất quan sát" value={String(unobservable).padStart(2, "0")} note="Giường 02 và 04" tone="amber" /></div>
    <div className="overview-grid"><section className="vc-panel"><div className="panel-title"><div><h2>Tình trạng Phòng 101</h2><p>Chỉ số sinh tồn mô phỏng · nhấn bệnh nhân để mở camera và hồ sơ</p></div><button onClick={() => go("room")}>Xem phòng →</button></div><div className="list-header"><span>BỆNH NHÂN</span><span>CHỈ SỐ SINH TỒN</span><span>QUAN SÁT</span><span>TRẠNG THÁI</span></div>{PATIENTS.map(p => <button className="patient-line" key={p.bed} onClick={() => select(p.bed)}><span className="person"><i>{p.bed}</i><b>{p.name}<small>{p.code}</small></b></span><span className="dashboard-vitals"><b>{p.heartRate} BPM <small>· {p.respirationRate}/phút</small></b><small>SpO₂ <strong>{p.spo2}%</strong> · {p.temperature.toFixed(1)}°C</small></span><span className="observe-reason"><Observe ok={p.state !== "blocked"} />{p.observationIssue && <small>{p.observationIssue === "occluded" ? "Bị che khuất" : "Chất lượng camera thấp"}</small>}</span><Badge state={p.state} compact /></button>)}</section>
      <section className="vc-panel notices"><div className="panel-title"><div><h2>Thông báo gần đây</h2><p>{ALERT_ITEMS.length} sự kiện cần xem</p></div><em><i /> LIVE</em></div>{ALERT_ITEMS.slice(0, 4).map(alert => <button className="dashboard-notice" key={alert.id} onClick={() => alert.bed ? select(alert.bed) : go("room")}><i className={alert.state}><Icon name={alert.icon} size={15} /></i><span><strong>{alert.title}</strong><small>{alert.bed ? `Giường ${alert.bed}` : "Phòng 101"} · {alert.time}</small></span><b>→</b></button>)}<button onClick={() => go("alerts")}>Xem tất cả cảnh báo →</button></section></div>
  </div>
}
function Notice({ type, icon, title, text, time }: { type: string; icon: string; title: string; text: string; time: string }) { return <div className={`notice ${type}`}><i><Icon name={icon} size={16} /></i><span><strong>{title}</strong><p>{text}</p><small>{time}</small></span></div> }

function Rooms({ go }: { go: (p: Page) => void }) { return <div className="vc-page"><Heading top="KHOA HỒI SỨC" title="Phòng bệnh" desc="Quản lý giường bệnh và trạng thái kết nối theo từng phòng." /><div className="rooms-grid"><button className="room-card online" onClick={() => go("room")}><div><Icon name="room" size={48} /><span><i /> ĐANG GIÁM SÁT</span></div><section><span><h2>Phòng 101</h2><p>Hồi sức tích cực</p></span><strong>5<small>/ 5 giường</small></strong></section><progress value="5" max="5" /><small>3 quan sát được · 2 không thể quan sát</small><footer>10 camera đã kết nối <b>Mở phòng →</b></footer></button>{["102", "103"].map(n => <article className="room-card offline" key={n}><div><Icon name="room" size={48} /><span>CHƯA KẾT NỐI</span></div><section><span><h2>Phòng {n}</h2><p>Chăm sóc tích cực</p></span><strong>{n === "102" ? 4 : 3}<small> giường</small></strong></section><progress value="0" max="5" /><small>Chưa có nguồn camera</small><footer>Thiết lập dữ liệu để sử dụng</footer></article>)}</div></div> }

const BED_AREAS = [
  { bed: "01", left: 4, top: 56, width: 37, height: 39 },
  { bed: "02", left: 21, top: 39, width: 24, height: 22 },
  { bed: "03", left: 55, top: 31, width: 20, height: 22 },
  { bed: "04", left: 57, top: 43, width: 26, height: 21 },
  { bed: "05", left: 61, top: 60, width: 38, height: 35 },
]

function Room({ select }: { select: (b: string) => void }) {
  return <div className="vc-page room-page">
    <Heading top="PHÒNG 101 · HỒI SỨC TÍCH CỰC" title="Sơ đồ giám sát Phòng 101" desc="Nhấn trực tiếp vào giường có bệnh nhân để mở camera và ground-truth." action={<span className="connected"><i /> Camera toàn cảnh đang hoạt động</span>} />
    <div className="room-strip"><span><Icon name="people" /><b>05<small>Bệnh nhân</small></b></span><span><Icon name="eye" /><b>03<small>Quan sát được</small></b></span><span><Icon name="eyeoff" /><b>02<small>Không thể quan sát</small></b></span><span><Icon name="alert" /><b>02<small>Cần xử lý</small></b></span></div>
    <section className="hospital-overview">
      <header><div><span><i /> CAMERA TOÀN CẢNH · PHÒNG 101</span><h2>Chọn vị trí bệnh nhân</h2></div><p><Icon name="camera" size={15} /> 5 giường có người · 1 giường trống</p></header>
      <div className="hospital-map">
        <img src={asset("hospital-room.png")} alt="Ảnh toàn cảnh các giường tại Phòng 101" />
        <div className="map-vignette" />
        {BED_AREAS.map(area => {
          const patient = PATIENTS.find(item => item.bed === area.bed)!
          return <button
            key={area.bed}
            className={`bed-hotspot ${patient.state}`}
            style={{ left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%` }}
            onClick={() => select(area.bed)}
            aria-label={`Mở camera Giường ${area.bed}, bệnh nhân ${patient.name}`}
          >
            <span className="hotspot-outline" />
            <span className="bed-marker"><b>{area.bed}</b><i className={patient.state} /></span>
            <span className="bed-callout"><strong>Giường {area.bed} · {patient.name}</strong><small><em><Icon name="heart" size={12} /> {patient.heartRate} BPM</em><em><Icon name={patient.state === "blocked" ? "eyeoff" : "eye"} size={12} /> {patient.state === "blocked" ? "Không thể quan sát" : "Quan sát được"}</em></small><b>Mở camera →</b></span>
          </button>
        })}
        <div className="empty-bed" aria-label="Giường 06 trống, không có bệnh nhân" style={{ left: "29%", top: "32%", width: "17%", height: "17%" }}><span>GIƯỜNG 06 TRỐNG<br />KHÔNG CÓ BỆNH NHÂN</span></div>
        <div className="map-live"><i /> LIVE · 14:02:45</div>
      </div>
      <footer><span><i className="stable" /> Ổn định</span><span><i className="attention" /> Cần chú ý</span><span><i className="blocked" /> Không thể quan sát</span><small>Di chuột hoặc chạm vào vùng giường để xem thông tin</small></footer>
    </section>
    <section className="room-bed-access"><div><strong>Truy cập nhanh theo giường</strong><small>Dùng khi xem trên màn hình nhỏ</small></div>{PATIENTS.map(patient => <button key={patient.bed} onClick={() => select(patient.bed)}><b>{patient.bed}</b><span>{patient.name}<small>{patient.code}</small></span><i className={patient.state} /> <em>→</em></button>)}</section>
  </div>
}

function Patients({ select }: { select: (b: string) => void }) {
  const [q, setQ] = useState(""); const list = PATIENTS.filter(p => normalizeSearch(`${p.name} ${p.code} ${p.bed}`).includes(normalizeSearch(q)))
  return <div className="vc-page"><Heading top="HỒ SƠ ĐIỀU TRỊ" title="Danh sách bệnh nhân" desc="Thông tin bệnh nhân đang điều trị tại Phòng 101." action={<label className="page-search"><Icon name="search" size={17} /><input placeholder="Tên, mã BN, giường..." value={q} onChange={e => setQ(e.target.value)} /></label>} /><section className="vc-panel patient-table"><div><span>BỆNH NHÂN</span><span>VỊ TRÍ</span><span>CHẨN ĐOÁN</span><span>NHÂN KHẨU HỌC</span><span>NGÀY NHẬP</span><span>TRẠNG THÁI</span><span /></div>{list.map(p => <button key={p.bed} onClick={() => select(p.bed)}><span className="person"><i>{p.name.split(" ").slice(-2).map(x => x[0]).join("")}</i><b>{p.name}<small>{p.code} · {p.gender}, {p.age} tuổi</small></b></span><span><b>Giường {p.bed}</b><small>Phòng 101</small></span><span>{p.diagnosis}</span><span><b>{p.height} cm · {p.weight} kg</b><small>Tiền sử bệnh: {p.medicalHistory ? "Yes" : "No"}</small></span><span>{p.admitted}</span><Badge state={p.state} compact /><span>→</span></button>)}</section></div>
}

function Alerts({ select, go }: { select: (b: string) => void; go: (p: Page) => void }) {
  const [fallOpen, setFallOpen] = useState(false)
  const vitalAlerts = ALERT_ITEMS.filter(alert => alert.group === "vital")
  const actionAlerts = ALERT_ITEMS.filter(alert => alert.group === "action")
  const openAlert = (alert: AlertItem) => { if (alert.id === "fall-05") setFallOpen(true); else if (alert.bed) select(alert.bed); else go("room") }
  return <div className="vc-page"><Heading top="AN TOÀN NGƯỜI BỆNH" title="Cảnh báo & sự kiện" desc="Chọn từng nhóm để xem chi tiết chỉ số sinh tồn hoặc hành động được phát hiện." />
    <div className="observation-note"><Icon name="eyeoff" size={16} /><span><strong>“Không thể quan sát” có 3 lý do:</strong> Bị che khuất · Chất lượng camera chưa đủ · Không có bệnh nhân.</span></div>
    <div className="alert-groups"><details className="alert-group"><summary><span><i className="vital-group-icon"><Icon name="pulse" /></i><b>Cảnh báo chỉ số sinh tồn<small>Nhịp tim, nhiệt độ, SpO₂ và nhịp thở</small></b></span><em>{vitalAlerts.length} sự kiện</em></summary><div className="alert-group-content">{vitalAlerts.map(alert => <AlertRow key={alert.id} alert={alert} onClick={() => openAlert(alert)} />)}</div></details>
      <details className="alert-group"><summary><span><i className="action-group-icon"><Icon name="eyeoff" /></i><b>Cảnh báo hành động<small>Té ngã và trạng thái quan sát camera</small></b></span><em>{actionAlerts.length} sự kiện</em></summary><div className="alert-group-content">{actionAlerts.map(alert => <AlertRow key={alert.id} alert={alert} onClick={() => openAlert(alert)} />)}</div></details></div>
    {fallOpen && <div className="modal-backdrop" onClick={() => setFallOpen(false)}><section className="fall-modal" role="dialog" aria-modal="true" aria-labelledby="fall-title" onClick={event => event.stopPropagation()}><header><span><small>CẢNH BÁO HÀNH ĐỘNG · GIƯỜNG 05</small><h2 id="fall-title">Video phát hiện té ngã</h2><p>Hoàng Văn Em · Phòng 101 · 14:04</p></span><button aria-label="Đóng video" onClick={() => setFallOpen(false)}>×</button></header><video src={asset("media/fall-demo.mp4")} controls autoPlay playsInline /><footer><button className="vc-primary" onClick={() => { setFallOpen(false); select("05") }}>Mở camera & hồ sơ bệnh nhân →</button></footer></section></div>}
  </div>
}
function AlertRow({ alert, onClick }: { alert: AlertItem; onClick: () => void }) { return <article className={`alert-line ${alert.state}`}><i><Icon name={alert.icon} /></i><span><small>{alert.group === "vital" ? "CHỈ SỐ SINH TỒN" : "CẢNH BÁO HÀNH ĐỘNG"}</small><h3>{alert.title}</h3><p>{alert.text}</p></span><time>{alert.time}<small>29/08/2026</small></time><strong className="alert-value">{alert.value || ""}</strong><Badge state={alert.state} compact /><button onClick={onClick}>{alert.id === "fall-05" ? "Xem video →" : alert.bed ? "Mở camera →" : "Xem phòng →"}</button></article> }

function History() { const rows = [["14:02", "Cảnh báo nhịp tim", "Giường 05 · Ground-truth vượt ngưỡng", "alert"], ["13:58", "Thay đổi trạng thái quan sát", "Giường 04 · Không thể quan sát", "eyeoff"], ["13:45", "Hoàn tất kết nối camera", "Phòng 101 · 10/10 nguồn hoạt động", "camera"], ["11:20", "Cập nhật hồ sơ", "Giường 03 · Hồ sơ đã đồng bộ", "file"], ["08:00", "Bắt đầu ca trực", "BS. Nguyễn Minh · Khoa Hồi sức", "check"]]; return <div className="vc-page narrow"><Heading top="NHẬT KÝ HỆ THỐNG" title="Lịch sử hoạt động" desc="Dòng thời gian sự kiện Phòng 101 trong ngày 29/08/2026." /><section className="vc-panel history">{rows.map(r => <div key={r[0] + r[1]}><time>{r[0]}</time><i><Icon name={r[3]} size={17} /></i><span><strong>{r[1]}</strong><p>{r[2]}</p></span><small>29/08/2026</small></div>)}</section></div> }
function More({ go, logout }: { go: (p: Page) => void; logout: () => void }) { return <div className="vc-page narrow"><Heading top="VICARE MANAGER" title="Khác" desc="Công cụ trực ca và tùy chọn ứng dụng." /><section className="vc-panel more-profile"><i>NM</i><span><strong>BS. Nguyễn Minh</strong><small>Khoa Hồi sức · VICARE</small></span><em>ĐANG TRỰC</em></section><div className="more-actions"><button className="vc-panel more-action" onClick={() => go("history")}><i><Icon name="history" /></i><span><strong>Lịch sử hoạt động</strong><small>Nhật ký cảnh báo và thay đổi hệ thống</small></span><Icon name="chevron" size={18} /></button><button className="vc-panel more-action" onClick={() => go("settings")}><i><Icon name="settings" /></i><span><strong>Cài đặt giám sát</strong><small>Ngưỡng sinh hiệu và tùy chọn thông báo</small></span><Icon name="chevron" size={18} /></button></div><button className="more-logout" onClick={logout}><Icon name="logout" size={17} /> Đăng xuất</button><p className="more-version">VICARE Manager · Phiên bản 1.0.0</p></div> }
function Settings() {
  const [heartLow, setHeartLow] = useState(() => localStorage.getItem("heart_low") || "50")
  const [heartHigh, setHeartHigh] = useState(() => localStorage.getItem("heart_high") || "100")
  const [respLow, setRespLow] = useState(() => localStorage.getItem("resp_low") || "10")
  const [notifyVitals, setNotifyVitals] = useState(() => localStorage.getItem("notify_vitals") !== "false")
  const [notifyObservation, setNotifyObservation] = useState(() => localStorage.getItem("notify_observation") !== "false")
  const [notifyCamera, setNotifyCamera] = useState(() => localStorage.getItem("notify_camera") !== "false")
  const [notifySound, setNotifySound] = useState(() => localStorage.getItem("notify_sound") === "true")
  const [saved, setSaved] = useState(false)
  const save = () => {
    localStorage.setItem("heart_low", heartLow || "50")
    localStorage.setItem("heart_high", heartHigh || "100")
    localStorage.setItem("resp_low", respLow || "10")
    localStorage.setItem("notify_vitals", String(notifyVitals))
    localStorage.setItem("notify_observation", String(notifyObservation))
    localStorage.setItem("notify_camera", String(notifyCamera))
    localStorage.setItem("notify_sound", String(notifySound))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }
  return <div className="vc-page narrow"><Heading top="CẤU HÌNH" title="Cài đặt giám sát" desc="Thiết lập ngưỡng cảnh báo và tùy chọn hiển thị." /><div className="settings-grid"><section className="vc-panel settings-card"><h2><Icon name="pulse" /> Ngưỡng chỉ số</h2><p>Áp dụng cho Phòng 101</p><label>Nhịp tim thấp (BPM)<input type="number" value={heartLow} onChange={event => setHeartLow(event.target.value)} /></label><label>Nhịp tim cao (BPM)<input type="number" value={heartHigh} onChange={event => setHeartHigh(event.target.value)} /></label><label>Nhịp thở thấp (/phút)<input type="number" value={respLow} onChange={event => setRespLow(event.target.value)} /></label><button className="vc-primary" onClick={save}>{saved ? "Đã lưu thay đổi" : "Lưu thay đổi"}</button></section><section className="vc-panel settings-card"><h2><Icon name="bell" /> Thông báo</h2><p>Chọn loại sự kiện hiển thị trong ứng dụng.</p>{[["Chỉ số bất thường", "Sinh hiệu vượt ngưỡng", notifyVitals, setNotifyVitals], ["Trạng thái quan sát", "Bị che khuất hoặc không có bệnh nhân", notifyObservation, setNotifyObservation], ["Mất kết nối camera", "Nguồn video không phản hồi", notifyCamera, setNotifyCamera], ["Âm thanh cảnh báo", "Phát âm báo trên thiết bị", notifySound, setNotifySound]].map(([title, description, checked, setChecked]) => <label className="switch" key={String(title)}><span>{String(title)}<small>{String(description)}</small></span><input type="checkbox" checked={Boolean(checked)} onChange={event => (setChecked as (value: boolean) => void)(event.target.checked)} /><i /></label>)}<button className="vc-primary" onClick={save}>{saved ? "Đã lưu tùy chọn" : "Lưu tùy chọn"}</button></section></div></div>
}

function Video({ title, sub, src, ok, update }: { title: string; sub: string; src?: string; ok: boolean; update: (n: number) => void }) { return <article className="video-card"><header><span><i /> <b>{title}</b><small>{sub}</small></span><Observe ok={ok} /></header><div>{src ? <video key={src} src={asset(src)} controls autoPlay muted loop playsInline onTimeUpdate={e => update(e.currentTarget.currentTime)} /> : <p>Đang tải video...</p>}<aside><span><i /> LIVE DATASET</span><small>PHÒNG 101</small></aside></div></article> }
function Chart({ points, time, color, unit }: { points: Point[]; time: number; color: string; unit: string }) {
  const shown = useMemo(() => { if (!points.length) return []; const a = Math.max(0, time - 10), b = Math.max(30, time + 20), s = points.filter(p => p[0] >= a && p[0] <= b); return s.length > 1 ? s : points.slice(0, 120) }, [points, time])
  if (!shown.length) return <div className="chart-loading">Đang tải ground-truth...</div>
  const vals = shown.map(p => p[1]); let min = Math.min(...vals), max = Math.max(...vals); if (min === max) { min--; max++ } const t0 = shown[0][0], t1 = shown[shown.length - 1][0] || t0 + 1
  const d = shown.map(([t, v], i) => `${i ? "L" : "M"}${((t - t0) / (t1 - t0) * 640).toFixed(1)},${(104 - (v - min) / (max - min) * 86).toFixed(1)}`).join(" ")
  const now = shown.reduce((a, b) => Math.abs(b[0] - time) < Math.abs(a[0] - time) ? b : a)
  return <div className="signal"><strong>{+now[1].toFixed(1)}<small>{unit}</small></strong><svg viewBox="0 0 640 112" preserveAspectRatio="none"><path d={d} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg><footer><span>{Math.round(t0)}s</span><span>Đồng bộ tại {time.toFixed(1)}s</span><span>{Math.round(t1)}s</span></footer></div>
}
function Ground({ title, source, value, unit, icon, points, time, color }: { title: string; source: string; value: string; unit: string; icon: string; points: Point[]; time: number; color: string }) { return <article className="ground"><header><i style={{ color }}><Icon name={icon} /></i><span><h3>{title}</h3><p>{source}</p></span><strong>{value}<small>{unit}</small></strong></header><Chart points={points} time={time} color={color} unit={unit} /></article> }
function Temperature({ value }: { value: number }) { const high = value >= 38; return <article className="ground temperature"><header><i style={{ color: high ? "#d94b5d" : "#d88928" }}><Icon name="camera" /></i><span><h3>Nhiệt độ bề mặt</h3><p>L_CAS Thermal · ước tính</p></span><strong>{value.toFixed(1)}<small>°C</small></strong></header><div className="temperature-note"><span>Đo từ vùng mặt/thân trên video nhiệt</span><small className={high ? "high" : ""}>{high ? "Cao bất thường" : "Trong khoảng theo dõi"}</small></div></article> }
function Oxygen({ value }: { value: number }) { return <article className="ground oxygen"><header><i style={{ color: "#1687d9" }}><Icon name="pulse" /></i><span><h3>SpO₂</h3><p>Chỉ số mô phỏng</p></span><strong>{value}<small>%</small></strong></header><div className="oxygen-note"><span>Độ bão hòa oxy trong máu</span><small>Hiện tại ổn định</small></div></article> }

function PatientPage({ patient, monitor, select, go }: { patient: Patient; monitor?: Monitor; select: (b: string) => void; go: (p: Page) => void }) {
  const [time, setTime] = useState(0), ok = patient.state !== "blocked"
  useEffect(() => { setTime(0) }, [patient.bed])
  const bvp = monitor?.imvia.bvp.reduce((a, b) => Math.abs(b[0] - time) < Math.abs(a[0] - time) ? b : a, monitor.imvia.bvp[0] || [0, 0])?.[1] || 0
  const thermalVideo = monitor?.imvia.video.replace("media/imvia/", "media/imvia-thermal-fake/")
  const patientAlerts = ALERT_ITEMS.filter(alert => alert.bed === patient.bed)
  const vitalCount = patientAlerts.filter(alert => alert.group === "vital").length
  const actionCount = patientAlerts.filter(alert => alert.group === "action").length
  return <div className="vc-page monitor-page"><div className="monitor-head"><div><span>GIƯỜNG {patient.bed} · PHÒNG 101</span><section><h1>{patient.name}</h1><Badge state={patient.state} /></section><p>{patient.code} · {patient.gender}, {patient.age} tuổi · {patient.diagnosis}</p></div><nav>{PATIENTS.map(p => <button className={p.bed === patient.bed ? "active" : ""} key={p.bed} onClick={() => select(p.bed)}>{p.bed}<i className={p.state} /></button>)}</nav></div>
    <section className={`observation-state ${ok ? "ok" : "no"}`}><i><Icon name={ok ? "eye" : "eyeoff"} /></i><span><small>TRẠNG THÁI QUAN SÁT</small><strong>{ok ? "Quan sát được" : "Không thể quan sát"}</strong></span></section>
    <div className="patient-layout"><section className="patient-main"><div className="videos camera-pair"><Video title="Camera hồng ngoại" sub={`Far-infrared · Subject ${monitor?.imvia.subject || "--"}`} src={monitor?.imvia.video} ok={ok} update={setTime} /><Video title="Camera nhiệt" sub={`False-color thermal · Subject ${monitor?.imvia.subject || "--"}`} src={thermalVideo} ok={ok} update={() => {}} /></div><div className="ground-title"><span><small>GROUND-TRUTH & CHỈ SỐ ƯỚC TÍNH</small><h2>Dữ liệu sinh lý đồng bộ</h2></span><em><Icon name="pulse" size={15} /> Đang chạy theo video</em></div><div className="ground-grid"><Ground title="Nhịp tim" source="Dữ liệu mô phỏng" value={String(patient.heartRate)} unit="BPM" icon="heart" points={mockTrend(patient.heartRate, 2)} time={time} color="#e75264" /><Ground title="Nhịp thở" source="Dữ liệu mô phỏng" value={String(patient.respirationRate)} unit="/phút" icon="pulse" points={mockTrend(patient.respirationRate, 1)} time={time} color="#0ca582" /><Ground title="Tín hiệu BVP" source="IMVIA-FIR · BVP.csv · Blood Volume Pulse" value={monitor ? bvp.toFixed(1) : "--"} unit="a.u." icon="pulse" points={monitor?.imvia.bvp || []} time={time} color="#1687d9" /><Temperature value={patient.temperature} /><Oxygen value={patient.spo2} /></div></section>
      <aside className="patient-aside"><section className="vc-panel profile"><header><i>{patient.name.split(" ").slice(-2).map(x => x[0]).join("")}</i><span><h2>{patient.name}</h2><p>{patient.code}</p></span></header><label>Vị trí<b>Giường {patient.bed} · Phòng 101</b></label><label>Chẩn đoán<b>{patient.diagnosis}</b></label><label>Ngày nhập viện<b>{patient.admitted}</b></label><div><label>Tuổi<b>{patient.age}</b></label><label>Giới tính<b>{patient.gender}</b></label></div><div><label>Chiều cao<b>{patient.height} cm</b></label><label>Cân nặng<b>{patient.weight} kg</b></label></div><label>Nhiệt độ bề mặt<b>{patient.temperature.toFixed(1)} °C</b></label><label>SpO₂ hiện tại<b>{patient.spo2}%</b></label><label>Tiền sử bệnh (Yes/No)<b className={`medical-history ${patient.medicalHistory ? "yes" : "no"}`}>{patient.medicalHistory ? "Yes" : "No"}</b></label></section><section className="vc-panel alert-history"><h2>Lịch sử phát hiện bất thường</h2><p>Số sự kiện được ghi nhận cho bệnh nhân</p><div><span><i className="history-vital"><Icon name="pulse" size={14} /></i><b>{vitalCount}<small>Chỉ số sinh tồn</small></b></span><span><i className="history-action"><Icon name="eyeoff" size={14} /></i><b>{actionCount}<small>Hành động / quan sát</small></b></span></div><button onClick={() => go("alerts")}>Xem danh sách cảnh báo →</button></section><section className="vc-panel sources"><h2>Thiết bị & dữ liệu</h2><p>Tình trạng nguồn giám sát</p>{[["Camera nhiệt", "Tiny1-C", "camera"], ["Camera hồng ngoại", "OV9281", "camera"]].map(x => <div key={x[0]}><i><Icon name={x[2]} size={16} /></i><span><b>{x[0]}</b><small>{x[1]}</small></span><em><i />Hoạt động</em></div>)}</section></aside></div>
  </div>
}

export default function VicareApp() {
  const previewPage = new URLSearchParams(window.location.search).get("page") as Page | null
  const initialPage = previewPage && ["overview", "rooms", "room", "patients", "alerts", "more", "history", "settings", "patient"].includes(previewPage) ? previewPage : "login"
  const previewBed = new URLSearchParams(window.location.search).get("bed")
  const initialBed = PATIENTS.some(p => p.bed === previewBed) ? previewBed! : "01"
  const [page, setPage] = useState<Page>(initialPage), [bed, setBed] = useState(initialBed), data = useData()
  const patient = PATIENTS.find(p => p.bed === bed) || PATIENTS[0]
  const navigate = useCallback((nextPage: Page, nextBed = bed) => {
    if (nextPage === page && nextBed === bed) return
    const current = window.history.state && typeof window.history.state === "object" ? window.history.state : {}
    const index = current.vicareApp ? Number(current.vicareIndex || 0) + 1 : 1
    window.history.pushState({ ...current, vicareApp: true, vicarePage: nextPage, vicareBed: nextBed, vicareIndex: index }, "")
    setPage(nextPage)
    setBed(nextBed)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [bed, page])
  const select = useCallback((nextBed: string) => navigate("patient", nextBed), [navigate])
  const back = useCallback(() => {
    const current = window.history.state
    if (current?.vicareApp && current.vicareIndex > 0) { window.history.back(); return }
    if (page !== "overview" && page !== "login") { navigate("overview"); return }
    window.history.back()
  }, [navigate, page])
  const backRef = useRef(back)
  backRef.current = back
  useEffect(() => {
    const current = window.history.state && typeof window.history.state === "object" ? window.history.state : {}
    window.history.replaceState({ ...current, vicareApp: true, vicarePage: initialPage, vicareBed: initialBed, vicareIndex: 0 }, "")
    const restorePage = (event: PopStateEvent) => {
      const previous = event.state
      if (!previous?.vicareApp) return
      setPage(previous.vicarePage as Page)
      setBed(PATIENTS.some(item => item.bed === previous.vicareBed) ? previous.vicareBed : "01")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    const handleBackShortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); backRef.current() }
    }
    window.addEventListener("popstate", restorePage)
    window.addEventListener("keydown", handleBackShortcut)
    return () => { window.removeEventListener("popstate", restorePage); window.removeEventListener("keydown", handleBackShortcut) }
  }, [])
  if (page === "login") return <Login enter={() => navigate("overview")} />
  return <Shell page={page} go={navigate} back={back} logout={() => navigate("login")} patient={patient} select={select}>{page === "overview" && <Overview go={navigate} select={select} />}{page === "rooms" && <Rooms go={navigate} />}{page === "room" && <Room select={select} />}{page === "patients" && <Patients select={select} />}{page === "alerts" && <Alerts select={select} go={navigate} />}{page === "more" && <More go={navigate} logout={() => navigate("login")} />}{page === "history" && <History />}{page === "settings" && <Settings />}{page === "patient" && <PatientPage patient={patient} monitor={data?.beds[bed]} select={select} go={navigate} />}</Shell>
}
