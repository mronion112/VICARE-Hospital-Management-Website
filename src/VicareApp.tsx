import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"

type Page = "login" | "overview" | "rooms" | "room" | "patients" | "alerts" | "history" | "settings" | "patient"
type State = "stable" | "attention" | "blocked"
type Point = [number, number]
type Monitor = {
  lcas: { subject: string; video: string; duration: number; frames: number; heartRate: number; respirationRate: number; heartbeat: Point[]; respiration: Point[] }
  imvia: { subject: string; video: string; duration: number; bvp: Point[] }
}
type Data = { generatedFrom: string; beds: Record<string, Monitor> }
type Patient = { bed: string; name: string; code: string; age: number; gender: string; height: number; weight: number; temperature: number; medicalHistory: boolean; diagnosis: string; admitted: string; state: State; note: string }

const PATIENTS: Patient[] = [
  { bed: "01", name: "Phạm Văn An", code: "BN-2608-0341", age: 65, gender: "Nam", height: 165, weight: 68, temperature: 36.8, medicalHistory: true, diagnosis: "Theo dõi sau phẫu thuật", admitted: "26/08/2026", state: "stable", note: "Tín hiệu rõ, bệnh nhân nằm đúng vùng quan sát." },
  { bed: "02", name: "Nguyễn Thị Bình", code: "BN-2608-0342", age: 58, gender: "Nữ", height: 158, weight: 56, temperature: 37.1, medicalHistory: false, diagnosis: "Viêm phổi", admitted: "26/08/2026", state: "stable", note: "Hai camera đang truyền dữ liệu ổn định." },
  { bed: "03", name: "Trần Minh Châu", code: "BN-2608-0343", age: 71, gender: "Nam", height: 170, weight: 74, temperature: 36.6, medicalHistory: true, diagnosis: "Suy hô hấp nhẹ", admitted: "27/08/2026", state: "stable", note: "Đang theo dõi nhịp thở liên tục." },
  { bed: "04", name: "Lê Thu Dung", code: "BN-2608-0344", age: 49, gender: "Nữ", height: 160, weight: 61, temperature: 37.0, medicalHistory: true, diagnosis: "Theo dõi tim mạch", admitted: "27/08/2026", state: "blocked", note: "Vùng mặt và ngực đang bị vật thể che khuất." },
  { bed: "05", name: "Hoàng Văn Em", code: "BN-2608-0345", age: 76, gender: "Nam", height: 168, weight: 79, temperature: 38.2, medicalHistory: true, diagnosis: "Tăng huyết áp", admitted: "28/08/2026", state: "attention", note: "Nhịp tim ground-truth cao hơn ngưỡng theo dõi." },
]

const PATHS: Record<string, string> = {
  home: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  room: "M6 2h12v20H6zM9 6h1M14 6h1M9 11h1M14 11h1M9 22v-4h6v4",
  people: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M14 21h-4",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20M12 6v6l4 2",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6M19 12h3M2 12h3M12 2v3M12 19v3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  search: "M21 21l-4.4-4.4M11 19a8 8 0 100-16 8 8 0 000 16",
  heart: "M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z",
  pulse: "M2 12h4l2-6 4 12 3-9 2 3h5",
  camera: "M1 5h15v14H1zM16 10l7-4v12l-7-4",
  eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12M12 15a3 3 0 100-6 3 3 0 000 6",
  eyeoff: "M3 3l18 18M10.5 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a16 16 0 01-2.2 2.9M6.5 6.5C3.6 8.3 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8M10 10a3 3 0 004 4",
  alert: "M12 3L2 20h20L12 3M12 9v4M12 17h.01",
  check: "M20 6L9 17l-5-5",
  file: "M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h6",
  logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
}
function Icon({ name, size = 20 }: { name: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name]} /></svg> }
const asset = (path?: string) => path ? `${import.meta.env.BASE_URL}${path}` : ""

function useData() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { let live = true; fetch(asset("data/monitoring.json")).then(r => r.json()).then(d => live && setData(d)).catch(console.error); return () => { live = false } }, [])
  return data
}
function Logo({ light = false }: { light?: boolean }) { return <div className={`vc-logo ${light ? "light" : ""}`}><img src={asset("logo-vicare.png")} /><div><strong>VICARE</strong><span>Patient Monitoring</span></div></div> }
function Badge({ state, compact = false }: { state: State; compact?: boolean }) {
  const c = state === "stable" ? ["Ổn định", "check"] : state === "attention" ? ["Cần chú ý", "alert"] : ["Không thể quan sát", "eyeoff"]
  return <span className={`vc-badge ${state} ${compact ? "compact" : ""}`}><Icon name={c[1]} size={13} />{c[0]}</span>
}
function Observe({ ok }: { ok: boolean }) { return <span className={`observe ${ok ? "ok" : "no"}`}><Icon name={ok ? "eye" : "eyeoff"} size={14} />{ok ? "Quan sát được" : "Không thể quan sát"}</span> }

function Login({ enter }: { enter: () => void }) {
  const submit = (e: FormEvent) => { e.preventDefault(); enter() }
  return <main className="vc-login"><section className="login-blue"><Logo light /><div className="login-message"><span>NỀN TẢNG GIÁM SÁT Y KHOA</span><h1>Chăm sóc chủ động.<br />Theo dõi không tiếp xúc.</h1><p>Camera nhiệt và hồng ngoại giúp đội ngũ y tế theo dõi tín hiệu sinh tồn theo thời gian thực.</p><div><b><Icon name="camera" /> Hai nguồn camera</b><b><Icon name="pulse" /> Ground-truth đồng bộ</b><b><Icon name="eye" /> Nhận biết che khuất</b></div></div><i className="orbit a" /><i className="orbit b" /><aside><em>LIVE</em><strong>72</strong><small>BPM</small><span /></aside></section>
    <section className="login-white"><form onSubmit={submit}><div className="login-mobile-logo"><Logo /></div><span>CỔNG THÔNG TIN BÁC SĨ</span><h2>Chào mừng trở lại</h2><p>Đăng nhập để tiếp tục theo dõi bệnh nhân.</p><label>Email hoặc mã nhân viên<input defaultValue="bs.minh@vicare.vn" /></label><label>Mật khẩu<input type="password" defaultValue="12345678" /></label><div className="login-options"><label><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div><button className="vc-primary">Đăng nhập <b>→</b></button><small>Cần hỗ trợ? Liên hệ quản trị hệ thống ViCare.</small></form></section></main>
}

const NAV: [Page, string, string][] = [["overview", "Tổng quan", "home"], ["rooms", "Phòng bệnh", "room"], ["patients", "Bệnh nhân", "people"], ["alerts", "Cảnh báo", "bell"], ["history", "Lịch sử", "clock"], ["settings", "Cài đặt", "settings"]]
function Shell({ page, go, logout, patient, children }: { page: Page; go: (p: Page) => void; logout: () => void; patient: Patient; children: ReactNode }) {
  const active = page === "room" || page === "patient" ? "rooms" : page
  const title: Partial<Record<Page, string>> = { overview: "Tổng quan", rooms: "Phòng bệnh", room: "Phòng 101", patients: "Bệnh nhân", alerts: "Cảnh báo", history: "Lịch sử", settings: "Cài đặt", patient: patient.name }
  return <div className="vc-shell"><aside className="vc-side"><button onClick={() => go("overview")}><Logo /></button><nav><p>KHÔNG GIAN LÀM VIỆC</p>{NAV.map(([p, label, icon]) => <button className={active === p ? "active" : ""} onClick={() => go(p)} key={p}><Icon name={icon} /><span>{label}</span>{p === "alerts" && <b>2</b>}</button>)}</nav><div className="doctor"><i>NM<em /></i><span><strong>BS. Nguyễn Minh</strong><small>Khoa Hồi sức</small></span><button onClick={logout}><Icon name="logout" size={18} /></button></div></aside>
    <section className="vc-body"><header><div className="crumb"><button onClick={() => go("overview")}>ViCare</button><b>›</b>{(page === "room" || page === "patient") && <><button onClick={() => go("rooms")}>Phòng bệnh</button><b>›</b></>} {page === "patient" && <><button onClick={() => go("room")}>Phòng 101</button><b>›</b></>}<strong>{title[page]}</strong></div><div className="head-tools"><label><Icon name="search" size={17} /><input placeholder="Tìm bệnh nhân..." /></label><button><Icon name="bell" size={19} /><i /></button><span>Thứ Bảy<strong>29.08.2026</strong></span></div></header><main>{children}</main></section></div>
}
function Heading({ top, title, desc, action }: { top: string; title: string; desc: string; action?: ReactNode }) { return <div className="vc-heading"><div><span>{top}</span><h1>{title}</h1><p>{desc}</p></div>{action}</div> }
function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) { return <article className={`vc-metric ${tone}`}><i><Icon name={icon} /></i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article> }

function Overview({ go, select, data }: { go: (p: Page) => void; select: (b: string) => void; data: Data | null }) {
  return <div className="vc-page"><Heading top="TRUNG TÂM ĐIỀU HÀNH" title="Chào buổi chiều, Bác sĩ Minh" desc="Tổng hợp tình trạng giám sát tại Khoa Hồi sức hôm nay." action={<button className="vc-outline" onClick={() => go("room")}><Icon name="camera" size={17} /> Mở camera Phòng 101</button>} />
    <div className="metric-grid"><Metric icon="people" label="Bệnh nhân" value="05" note="5 giường đang sử dụng" tone="blue" /><Metric icon="pulse" label="Đang giám sát" value="04" note="80% có tín hiệu tốt" tone="green" /><Metric icon="alert" label="Cần chú ý" value="01" note="Giường 05 · nhịp tim cao" tone="red" /><Metric icon="eyeoff" label="Không thể quan sát" value="01" note="Giường 04 · bị che khuất" tone="amber" /></div>
    <div className="overview-grid"><section className="vc-panel"><div className="panel-title"><div><h2>Tình trạng Phòng 101</h2><p>Dữ liệu trực tiếp từ L_CAS và IMVIA-FIR</p></div><button onClick={() => go("room")}>Xem phòng →</button></div><div className="list-header"><span>BỆNH NHÂN</span><span>GROUND-TRUTH</span><span>QUAN SÁT</span><span>TRẠNG THÁI</span></div>{PATIENTS.map(p => { const m = data?.beds[p.bed]; return <button className="patient-line" key={p.bed} onClick={() => select(p.bed)}><span className="person"><i>{p.bed}</i><b>{p.name}<small>{p.code}</small></b></span><span><b>{m ? `${Math.round(m.lcas.heartRate)} BPM` : "Đang tải..."}</b><small>{m ? `${m.lcas.respirationRate}/phút · ${p.temperature}°C` : "L_CAS Thermal"}</small></span><Observe ok={p.state !== "blocked"} /><Badge state={p.state} compact /></button> })}</section>
      <section className="vc-panel notices"><div className="panel-title"><div><h2>Thông báo gần đây</h2><p>Cập nhật tự động</p></div><em><i /> LIVE</em></div><Notice type="red" icon="heart" title="Nhịp tim cần chú ý" text="Giường 05 · giá trị L_CAS cao" time="14:02 · Vừa xong" /><Notice type="amber" icon="eyeoff" title="Không thể quan sát" text="Giường 04 · vùng quan sát bị che" time="13:58 · 4 phút trước" /><Notice type="green" icon="check" title="Camera đã kết nối" text="5 L_CAS · 5 IMVIA-FIR" time="13:45 · 17 phút trước" /><button onClick={() => go("alerts")}>Xem tất cả cảnh báo →</button></section></div>
  </div>
}
function Notice({ type, icon, title, text, time }: { type: string; icon: string; title: string; text: string; time: string }) { return <div className={`notice ${type}`}><i><Icon name={icon} size={16} /></i><span><strong>{title}</strong><p>{text}</p><small>{time}</small></span></div> }

function Rooms({ go }: { go: (p: Page) => void }) { return <div className="vc-page"><Heading top="KHOA HỒI SỨC" title="Phòng bệnh" desc="Quản lý giường bệnh và trạng thái kết nối theo từng phòng." /><div className="rooms-grid"><button className="room-card online" onClick={() => go("room")}><div><Icon name="room" size={48} /><span><i /> ĐANG GIÁM SÁT</span></div><section><span><h2>Phòng 101</h2><p>Hồi sức tích cực</p></span><strong>5<small>/ 5 giường</small></strong></section><progress value="5" max="5" /><small>4 quan sát được · 1 bị che khuất</small><footer>10 camera đã kết nối <b>Mở phòng →</b></footer></button>{["102", "103"].map(n => <article className="room-card offline" key={n}><div><Icon name="room" size={48} /><span>CHƯA KẾT NỐI</span></div><section><span><h2>Phòng {n}</h2><p>Chăm sóc tích cực</p></span><strong>{n === "102" ? 4 : 3}<small> giường</small></strong></section><progress value="0" max="5" /><small>Chưa có nguồn camera</small><footer>Thiết lập dữ liệu để sử dụng</footer></article>)}</div></div> }

const BED_AREAS = [
  { bed: "01", left: 4, top: 56, width: 37, height: 39 },
  { bed: "02", left: 21, top: 39, width: 24, height: 22 },
  { bed: "03", left: 55, top: 31, width: 20, height: 22 },
  { bed: "04", left: 57, top: 43, width: 26, height: 21 },
  { bed: "05", left: 61, top: 60, width: 38, height: 35 },
]

function Room({ data, select }: { data: Data | null; select: (b: string) => void }) {
  return <div className="vc-page room-page">
    <Heading top="PHÒNG 101 · HỒI SỨC TÍCH CỰC" title="Sơ đồ giám sát Phòng 101" desc="Nhấn trực tiếp vào giường có bệnh nhân để mở camera và ground-truth." action={<span className="connected"><i /> Camera toàn cảnh đang hoạt động</span>} />
    <div className="room-strip"><span><Icon name="people" /><b>05<small>Bệnh nhân</small></b></span><span><Icon name="eye" /><b>04<small>Quan sát được</small></b></span><span><Icon name="eyeoff" /><b>01<small>Không thể quan sát</small></b></span><span><Icon name="alert" /><b>01<small>Cần chú ý</small></b></span></div>
    <section className="hospital-overview">
      <header><div><span><i /> CAMERA TOÀN CẢNH · PHÒNG 101</span><h2>Chọn vị trí bệnh nhân</h2></div><p><Icon name="camera" size={15} /> 5 giường có người · 1 giường trống</p></header>
      <div className="hospital-map">
        <img src={asset("hospital-room.png")} alt="Ảnh toàn cảnh các giường tại Phòng 101" />
        <div className="map-vignette" />
        {BED_AREAS.map(area => {
          const patient = PATIENTS.find(item => item.bed === area.bed)!
          const monitor = data?.beds[area.bed]
          return <button
            key={area.bed}
            className={`bed-hotspot ${patient.state}`}
            style={{ left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%` }}
            onClick={() => select(area.bed)}
            aria-label={`Mở camera Giường ${area.bed}, bệnh nhân ${patient.name}`}
          >
            <span className="hotspot-outline" />
            <span className="bed-marker"><b>{area.bed}</b><i className={patient.state} /></span>
            <span className="bed-callout"><strong>Giường {area.bed} · {patient.name}</strong><small><em><Icon name="heart" size={12} /> {monitor ? Math.round(monitor.lcas.heartRate) : "--"} BPM</em><em><Icon name={patient.state === "blocked" ? "eyeoff" : "eye"} size={12} /> {patient.state === "blocked" ? "Không thể quan sát" : "Quan sát được"}</em></small><b>Mở camera →</b></span>
          </button>
        })}
        <div className="empty-bed" aria-label="Giường trống" style={{ left: "29%", top: "32%", width: "17%", height: "17%" }}><span>GIƯỜNG TRỐNG</span></div>
        <div className="map-live"><i /> LIVE · 14:02:45</div>
      </div>
      <footer><span><i className="stable" /> Ổn định</span><span><i className="attention" /> Cần chú ý</span><span><i className="blocked" /> Không thể quan sát</span><small>Di chuột hoặc chạm vào vùng giường để xem thông tin</small></footer>
    </section>
    <section className="room-bed-access"><div><strong>Truy cập nhanh theo giường</strong><small>Dùng khi xem trên màn hình nhỏ</small></div>{PATIENTS.map(patient => <button key={patient.bed} onClick={() => select(patient.bed)}><b>{patient.bed}</b><span>{patient.name}<small>{patient.code}</small></span><i className={patient.state} /> <em>→</em></button>)}</section>
  </div>
}

function Patients({ select }: { select: (b: string) => void }) {
  const [q, setQ] = useState(""); const list = PATIENTS.filter(p => `${p.name}${p.code}${p.bed}`.toLowerCase().includes(q.toLowerCase()))
  return <div className="vc-page"><Heading top="HỒ SƠ ĐIỀU TRỊ" title="Danh sách bệnh nhân" desc="Thông tin bệnh nhân đang điều trị tại Phòng 101." action={<label className="page-search"><Icon name="search" size={17} /><input placeholder="Tên, mã BN, giường..." value={q} onChange={e => setQ(e.target.value)} /></label>} /><section className="vc-panel patient-table"><div><span>BỆNH NHÂN</span><span>VỊ TRÍ</span><span>CHẨN ĐOÁN</span><span>NHÂN KHẨU HỌC</span><span>NGÀY NHẬP</span><span>TRẠNG THÁI</span><span /></div>{list.map(p => <button key={p.bed} onClick={() => select(p.bed)}><span className="person"><i>{p.name.split(" ").slice(-2).map(x => x[0]).join("")}</i><b>{p.name}<small>{p.code} · {p.gender}, {p.age} tuổi</small></b></span><span><b>Giường {p.bed}</b><small>Phòng 101</small></span><span>{p.diagnosis}</span><span><b>{p.height} cm · {p.weight} kg</b><small>Tiền sử bệnh: {p.medicalHistory ? "Yes" : "No"}</small></span><span>{p.admitted}</span><Badge state={p.state} compact /><span>→</span></button>)}</section></div>
}

function Alerts({ select }: { select: (b: string) => void }) { return <div className="vc-page"><Heading top="AN TOÀN NGƯỜI BỆNH" title="Cảnh báo & sự kiện" desc="Bất thường được phát hiện tự động từ video và ground-truth." /><div className="alerts"><AlertRow state="attention" icon="heart" title="Nhịp tim cao hơn ngưỡng theo dõi" text="Giường 05 · Hoàng Văn Em · L_CAS ghi nhận khoảng 101 BPM." time="14:02" onClick={() => select("05")} /><AlertRow state="blocked" icon="eyeoff" title="Không thể quan sát bệnh nhân" text="Giường 04 · Lê Thu Dung · Vùng quan sát đang bị che khuất." time="13:58" onClick={() => select("04")} /></div></div> }
function AlertRow({ state, icon, title, text, time, onClick }: { state: State; icon: string; title: string; text: string; time: string; onClick: () => void }) { return <article className={`alert-line ${state}`}><i><Icon name={icon} /></i><span><small>HỆ THỐNG TỰ ĐỘNG</small><h3>{title}</h3><p>{text}</p></span><time>{time}<small>29/08/2026</small></time><Badge state={state} compact /><button onClick={onClick}>Xem chi tiết →</button></article> }

function History() { const rows = [["14:02", "Cảnh báo nhịp tim", "Giường 05 · Ground-truth vượt ngưỡng", "alert"], ["13:58", "Thay đổi trạng thái quan sát", "Giường 04 · Không thể quan sát", "eyeoff"], ["13:45", "Hoàn tất kết nối camera", "Phòng 101 · 10/10 nguồn hoạt động", "camera"], ["11:20", "Cập nhật hồ sơ", "Giường 03 · Hồ sơ đã đồng bộ", "file"], ["08:00", "Bắt đầu ca trực", "BS. Nguyễn Minh · Khoa Hồi sức", "check"]]; return <div className="vc-page narrow"><Heading top="NHẬT KÝ HỆ THỐNG" title="Lịch sử hoạt động" desc="Dòng thời gian sự kiện Phòng 101 trong ngày 29/08/2026." /><section className="vc-panel history">{rows.map(r => <div key={r[0] + r[1]}><time>{r[0]}</time><i><Icon name={r[3]} size={17} /></i><span><strong>{r[1]}</strong><p>{r[2]}</p></span><small>29/08/2026</small></div>)}</section></div> }
function Settings() { return <div className="vc-page narrow"><Heading top="CẤU HÌNH" title="Cài đặt giám sát" desc="Thiết lập ngưỡng cảnh báo và tuỳ chọn hiển thị." /><div className="settings-grid"><section className="vc-panel settings-card"><h2><Icon name="pulse" /> Ngưỡng chỉ số</h2><p>Áp dụng cho Phòng 101</p><label>Nhịp tim thấp (BPM)<input type="number" defaultValue="50" /></label><label>Nhịp tim cao (BPM)<input type="number" defaultValue="100" /></label><label>Nhịp thở thấp (/phút)<input type="number" defaultValue="10" /></label><button className="vc-primary">Lưu thay đổi</button></section><section className="vc-panel settings-card"><h2><Icon name="bell" /> Thông báo</h2><p>Cách hệ thống gửi cảnh báo</p>{[["Chỉ số bất thường", true], ["Trạng thái quan sát", true], ["Mất kết nối camera", true], ["Âm thanh cảnh báo", false]].map(([x, y]) => <label className="switch" key={String(x)}><span>{String(x)}<small>Hiển thị trong trung tâm cảnh báo</small></span><input type="checkbox" defaultChecked={Boolean(y)} /><i /></label>)}</section></div></div> }

function Video({ title, sub, src, ok, update, peer }: { title: string; sub: string; src?: string; ok: boolean; update: (n: number) => void; peer?: React.MutableRefObject<HTMLVideoElement | null> }) { return <article className="video-card"><header><span><i /> <b>{title}</b><small>{sub}</small></span><Observe ok={ok} /></header><div>{src ? <video ref={el => { if (peer) peer.current = el }} key={src} src={asset(src)} controls autoPlay muted loop playsInline onPlay={e => { peer?.current?.play().catch(() => {}) }} onTimeUpdate={e => { const t = e.currentTarget.currentTime; update(t); if (peer?.current && Math.abs(peer.current.currentTime - t) > 0.04) peer.current.currentTime = t }} /> : <p>Đang tải video...</p>}<aside><span><i /> LIVE DATASET</span><small>PHÒNG 101</small></aside></div></article> }
function Chart({ points, time, color, unit }: { points: Point[]; time: number; color: string; unit: string }) {
  const shown = useMemo(() => { if (!points.length) return []; const a = Math.max(0, time - 10), b = Math.max(30, time + 20), s = points.filter(p => p[0] >= a && p[0] <= b); return s.length > 1 ? s : points.slice(0, 120) }, [points, time])
  if (!shown.length) return <div className="chart-loading">Đang tải ground-truth...</div>
  const vals = shown.map(p => p[1]); let min = Math.min(...vals), max = Math.max(...vals); if (min === max) { min--; max++ } const t0 = shown[0][0], t1 = shown[shown.length - 1][0] || t0 + 1
  const d = shown.map(([t, v], i) => `${i ? "L" : "M"}${((t - t0) / (t1 - t0) * 640).toFixed(1)},${(104 - (v - min) / (max - min) * 86).toFixed(1)}`).join(" ")
  const now = shown.reduce((a, b) => Math.abs(b[0] - time) < Math.abs(a[0] - time) ? b : a)
  return <div className="signal"><strong>{+now[1].toFixed(1)}<small>{unit}</small></strong><svg viewBox="0 0 640 112" preserveAspectRatio="none"><path d={d} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg><footer><span>{Math.round(t0)}s</span><span>Đồng bộ tại {time.toFixed(1)}s</span><span>{Math.round(t1)}s</span></footer></div>
}
function Ground({ title, source, value, unit, icon, points, time, color }: { title: string; source: string; value: string; unit: string; icon: string; points: Point[]; time: number; color: string }) { return <article className="ground"><header><i style={{ color }}><Icon name={icon} /></i><span><h3>{title}</h3><p>{source}</p></span><strong>{value}<small>{unit}</small></strong></header><Chart points={points} time={time} color={color} unit={unit} /></article> }
function Temperature({ value }: { value: number }) { return <article className="ground temperature"><header><i style={{ color: "#d88928" }}><Icon name="camera" /></i><span><h3>Nhiệt độ bề mặt</h3><p>L_CAS Thermal · ước tính</p></span><strong>{value.toFixed(1)}<small>°C</small></strong></header><div className="temperature-note"><span>Đo từ vùng mặt/thân trên video nhiệt</span><small>Nhiệt độ ổn định</small></div></article> }

function PatientPage({ patient, monitor, select }: { patient: Patient; monitor?: Monitor; select: (b: string) => void }) {
  const [time, setTime] = useState(0), ok = patient.state !== "blocked"
  const originalVideo = useRef<HTMLVideoElement | null>(null), thermalVideoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>(".videos video"))
    if (videos.length !== 2) return
    const [a, b] = videos
    const sync = (source: HTMLVideoElement, target: HTMLVideoElement) => () => {
      if (Math.abs(target.currentTime - source.currentTime) > 0.04) target.currentTime = source.currentTime
    }
    const syncA = sync(a, b), syncB = sync(b, a)
    a.addEventListener("timeupdate", syncA); b.addEventListener("timeupdate", syncB)
    b.currentTime = a.currentTime
    return () => { a.removeEventListener("timeupdate", syncA); b.removeEventListener("timeupdate", syncB) }
  }, [monitor?.imvia.video])
  const bvp = monitor?.imvia.bvp.reduce((a, b) => Math.abs(b[0] - time) < Math.abs(a[0] - time) ? b : a, monitor.imvia.bvp[0] || [0, 0])?.[1] || 0
  const thermalVideo = monitor?.imvia.video.replace("media/imvia/", "media/imvia-thermal-fake/")
  return <div className="vc-page monitor-page"><div className="monitor-head"><div><span>GIƯỜNG {patient.bed} · PHÒNG 101</span><section><h1>{patient.name}</h1><Badge state={patient.state} /></section><p>{patient.code} · {patient.gender}, {patient.age} tuổi · {patient.diagnosis}</p></div><nav>{PATIENTS.map(p => <button className={p.bed === patient.bed ? "active" : ""} key={p.bed} onClick={() => select(p.bed)}>{p.bed}<i className={p.state} /></button>)}</nav></div>
    <section className={`observation-state ${ok ? "ok" : "no"}`}><i><Icon name={ok ? "eye" : "eyeoff"} /></i><span><small>TRẠNG THÁI QUAN SÁT</small><strong>{ok ? "Quan sát được" : "Không thể quan sát"}</strong><p>{patient.note}</p></span><em>Hệ thống tự động cập nhật từ video · Không phải nút thao tác</em></section>
    <div className="patient-layout"><section className="patient-main"><div className="videos"><Video title="Camera Hồng Ngoại" sub={`Far-infrared · Subject ${monitor?.imvia.subject || "--"}`} src={monitor?.imvia.video} ok={ok} update={setTime} /><Video title="Camera Nhiệt" sub={`False-color thermal · Subject ${monitor?.imvia.subject || "--"}`} src={thermalVideo} ok={ok} update={setTime} /></div><div className="ground-title"><span><small>GROUND-TRUTH & CHỈ SỐ ƯỚC TÍNH</small><h2>Dữ liệu sinh lý đồng bộ</h2></span><em><Icon name="pulse" size={15} /> Đang chạy theo video</em></div><div className="ground-grid"><Ground title="Nhịp tim" source="L_CAS · heartbeat.csv" value={monitor ? String(Math.round(monitor.lcas.heartRate)) : "--"} unit="BPM" icon="heart" points={monitor?.lcas.heartbeat || []} time={time} color="#e75264" /><Ground title="Nhịp thở" source="L_CAS · respiration.csv" value={monitor ? String(monitor.lcas.respirationRate) : "--"} unit="/phút" icon="pulse" points={monitor?.lcas.respiration || []} time={time} color="#0ca582" /><Ground title="Tín hiệu BVP" source="IMVIA-FIR · BVP.csv · Blood Volume Pulse" value={monitor ? bvp.toFixed(1) : "--"} unit="a.u." icon="pulse" points={monitor?.imvia.bvp || []} time={time} color="#1687d9" /><Temperature value={patient.temperature} /></div></section>
      <aside className="patient-aside"><section className="vc-panel profile"><header><i>{patient.name.split(" ").slice(-2).map(x => x[0]).join("")}</i><span><h2>{patient.name}</h2><p>{patient.code}</p></span></header><label>Vị trí<b>Giường {patient.bed} · Phòng 101</b></label><label>Chẩn đoán<b>{patient.diagnosis}</b></label><label>Ngày nhập viện<b>{patient.admitted}</b></label><div><label>Tuổi<b>{patient.age}</b></label><label>Giới tính<b>{patient.gender}</b></label></div><div><label>Chiều cao<b>{patient.height} cm</b></label><label>Cân nặng<b>{patient.weight} kg</b></label></div><label>Nhiệt độ bề mặt<b>{patient.temperature.toFixed(1)} °C</b></label><label>Tiền sử bệnh (Yes/No)<b className={`medical-history ${patient.medicalHistory ? "yes" : "no"}`}>{patient.medicalHistory ? "Yes" : "No"}</b></label></section><section className="vc-panel sources"><h2>Thiết bị & dữ liệu</h2><p>Tình trạng nguồn giám sát</p>{[["L_CAS Thermal", `${monitor?.lcas.frames || "--"} frames`, "camera"], ["L_CAS Ground-truth", "Heartbeat + Respiration", "pulse"], ["IMVIA-FIR Video", "H.264 · MP4", "camera"], ["IMVIA Ground-truth", "BVP signal", "pulse"]].map(x => <div key={x[0]}><i><Icon name={x[2]} size={16} /></i><span><b>{x[0]}</b><small>{x[1]}</small></span><em /></div>)}</section><section className="clinical"><Icon name="file" /><span><small>GHI CHÚ THEO DÕI</small><p>{patient.note}</p></span></section></aside></div>
  </div>
}

export default function VicareApp() {
  const previewPage = new URLSearchParams(window.location.search).get("page") as Page | null
  const initialPage = previewPage && ["overview", "rooms", "room", "patients", "alerts", "history", "settings", "patient"].includes(previewPage) ? previewPage : "login"
  const previewBed = new URLSearchParams(window.location.search).get("bed")
  const [page, setPage] = useState<Page>(initialPage), [bed, setBed] = useState(PATIENTS.some(p => p.bed === previewBed) ? previewBed! : "01"), data = useData()
  const patient = PATIENTS.find(p => p.bed === bed) || PATIENTS[0]
  const select = (b: string) => { setBed(b); setPage("patient"); window.scrollTo({ top: 0, behavior: "smooth" }) }
  if (page === "login") return <Login enter={() => setPage("overview")} />
  return <Shell page={page} go={setPage} logout={() => setPage("login")} patient={patient}>{page === "overview" && <Overview go={setPage} select={select} data={data} />}{page === "rooms" && <Rooms go={setPage} />}{page === "room" && <Room data={data} select={select} />}{page === "patients" && <Patients select={select} />}{page === "alerts" && <Alerts select={select} />}{page === "history" && <History />}{page === "settings" && <Settings />}{page === "patient" && <PatientPage patient={patient} monitor={data?.beds[bed]} select={select} />}</Shell>
}
