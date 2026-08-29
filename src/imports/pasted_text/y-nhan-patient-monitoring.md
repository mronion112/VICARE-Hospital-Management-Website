Hãy thiết kế cho tôi một WEB APPLICATION quản lý và giám sát bệnh nhân tên là:

Y NHÃN
A ViCare Patient Monitoring System

Đây là hệ thống dành cho bác sĩ và điều dưỡng trong bệnh viện, dùng camera để theo dõi bệnh nhân và hiển thị các chỉ số sinh tồn không tiếp xúc.

Tôi muốn tạo một prototype có thể click và chuyển trang được, ưu tiên giao diện Desktop Web 1440px.

==================================================
1. PHONG CÁCH THIẾT KẾ TỔNG THỂ
==================================================

Thiết kế theo phong cách Medical / Hospital Dashboard hiện đại:

- Background chính: trắng hoặc trắng xám rất nhẹ.
- Primary color: xanh nước biển sáng / medical blue.
- Secondary color: xanh cyan rất nhẹ.
- Card: nền trắng, border xám rất nhạt, bo góc 14–18px.
- Shadow rất nhẹ, sạch sẽ và chuyên nghiệp.
- Typography rõ ràng, dễ đọc.
- Có nhiều khoảng trắng.
- Không sử dụng quá nhiều gradient.
- Không làm giao diện quá futuristic hoặc quá tối.
- Không sử dụng dark mode.

Màu sắc trạng thái:

Normal / Ổn định:
- Xanh dương hoặc xanh medical.
- Có icon check hoặc heart/pulse.

Warning / Cảnh báo:
- Đỏ.
- Có icon chuông cảnh báo.
- Chỉ sử dụng màu đỏ cho những thông tin thật sự cần chú ý.

Giao diện phải tạo cảm giác:
Clean
Clinical
Trustworthy
Professional
Easy to monitor

Có thể lấy cảm hứng từ dashboard bệnh viện hiện đại, nhưng không làm giống dashboard admin thông thường.

==================================================
2. GLOBAL LAYOUT
==================================================

Sau khi đăng nhập, toàn bộ hệ thống sử dụng layout:

LEFT SIDEBAR
+
TOP HEADER
+
MAIN CONTENT

Sidebar gồm:

Logo:
Y NHÃN
by ViCare

Menu:

- Tổng quan
- Phòng bệnh
- Bệnh nhân
- Cảnh báo
- Lịch sử
- Cài đặt

Ở dưới cùng Sidebar:

Bác sĩ
BS. Nguyễn Văn Minh

Đăng xuất

Top Header:

- Breadcrumb của trang hiện tại.
- Search.
- Notification icon.
- Avatar bác sĩ.

Ví dụ breadcrumb:

Phòng bệnh / Phòng 101 / Giường 01

==================================================
3. PAGE 1 – LOGIN
==================================================

Tạo trang đăng nhập đơn giản, hiện đại.

Ở chính giữa màn hình có Login Card.

Logo phía trên:

Y NHÃN
Patient Monitoring System
by ViCare

Các trường:

Tài khoản
[_____________________]

Mật khẩu
[_____________________]

☐ Ghi nhớ đăng nhập

Button:

[ Đăng nhập ]

Có thể thêm một illustration nhỏ liên quan tới bệnh viện hoặc patient monitoring ở bên trái, nhưng thiết kế vẫn phải đơn giản.

Sau khi bấm "Đăng nhập" → chuyển tới trang danh sách phòng bệnh.

==================================================
4. PAGE 2 – DANH SÁCH PHÒNG BỆNH
==================================================

Header:

Phòng bệnh

Subtitle:

Theo dõi tình trạng bệnh nhân theo từng phòng.

Hiển thị 3 Room Card:

PHÒNG 101
5 bệnh nhân
5 / 5 giường đang sử dụng

Trạng thái:
Đang giám sát

Button:
[ Mở phòng ]

----------------------------------

PHÒNG 102
4 bệnh nhân

Trạng thái:
Chưa kết nối

Button disable:
[ Không khả dụng ]

----------------------------------

PHÒNG 103
3 bệnh nhân

Trạng thái:
Chưa kết nối

Button disable:
[ Không khả dụng ]

CHỈ PHÒNG 101 CÓ THỂ CLICK.

Phòng 102 và 103 phải được làm mờ hoặc disable để người dùng hiểu rằng chưa thể truy cập.

Click "Phòng 101" → mở trang Room Monitoring.

==================================================
5. PAGE 3 – PHÒNG 101
==================================================

Header:

Phòng 101

Subtitle:

Theo dõi trực tiếp 5 bệnh nhân

Ở phía trên có một thanh summary:

5 Bệnh nhân
5 Đang theo dõi
0 Cảnh báo
Phòng 101

--------------------------------------------------

MAIN AREA:

Tạo một khu vực Camera Tổng của cả phòng.

Title:

Camera tổng – Phòng 101

Video camera phải lớn.

Camera hiển thị một phòng bệnh có:

5 giường bệnh
5 bệnh nhân nằm trên 5 giường.

Trên mỗi bệnh nhân / giường có một clickable overlay.

Ví dụ:

Giường 01
Phạm Văn A
● Ổn định

Giường 02
Nguyễn Văn B
● Ổn định

Giường 03
Trần Thị C
● Ổn định

Giường 04
Lê Văn D
● Ổn định

Giường 05
Hoàng Thị E
● Ổn định

Các overlay không được che quá nhiều camera.

Có thể sử dụng border xanh nhạt quanh từng vùng giường để thể hiện computer vision đang theo dõi.

Khi hover vào một giường:
- Border sáng hơn.
- Hiển thị tên bệnh nhân.
- Hiển thị trạng thái.

Khi CLICK VÀO GIƯỜNG 01:
→ chuyển tới Patient Monitoring Page của Phạm Văn A.

Các giường còn lại cũng có thể thiết kế giao diện giống nhau nhưng Giường 01 là luồng prototype chính.

==================================================
6. PAGE 4 – PATIENT LIVE MONITORING
==================================================

Đây là trang quan trọng nhất của hệ thống.

Breadcrumb:

Phòng bệnh / Phòng 101 / Giường 01

Header:

Phạm Văn A

Subheader:

Giường 01 · Phòng 101

Badge:

● Đang giám sát trực tiếp

Ở bên phải Header hiển thị STATUS:

● BÌNH THƯỜNG

Màu xanh medical.

--------------------------------------------------
LAYOUT CHÍNH
--------------------------------------------------

Chia trang thành 2 khu vực:

LEFT khoảng 65%
RIGHT khoảng 35%

========================
LEFT – CAMERA MONITORING
========================

Có 2 Camera Card lớn.

CAMERA 1

Title:

Camera nhiệt

Subtitle:

Thermal Monitoring · Live

Có badge:

● LIVE

Video sử dụng video từ:
L_CAS Thermal Dataset

Camera này dùng để lấy:

- Nhiệt độ
- Nhịp thở

Hiển thị overlay nhỏ ở góc video:

TEMP
36.8 °C

RESP
17 /min

Có thể thêm ROI visualization rất nhẹ:

- vùng mặt / trán
- vùng mũi

Nhưng không làm quá nhiều box hoặc text khiến video khó quan sát.

----------------------------------

CAMERA 2

Title:

Camera hồng ngoại

Subtitle:

NIR Monitoring · Live

Badge:

● LIVE

Video sử dụng video từ:

IMVIA-NIR Dataset

Camera này dùng để lấy:

- Nhịp tim

Overlay:

HEART RATE
72 BPM

Có thể hiển thị ROI vùng mặt nhẹ trên camera.

========================
RIGHT – PATIENT DASHBOARD
========================

Tạo một Patient Information Dashboard dạng Card.

Phong cách card dựa trên reference image tôi cung cấp:
- card cao
- bo góc
- thông tin chia thành từng section rõ ràng
- typography medical
- status nổi bật ở trên cùng

Nhưng:

NORMAL STATE sử dụng màu xanh dương thay vì đỏ.

----------------------------------

SECTION 1 – STATUS

Icon check / monitoring.

BÌNH THƯỜNG

Subtitle:

Các chỉ số sinh tồn đang trong giới hạn theo dõi.

Có timestamp nhỏ:

14:02:45 · Vừa xong

----------------------------------

SECTION 2 – PATIENT

BỆNH NHÂN

Phạm Văn A

VỊ TRÍ

Giường 01
Phòng 101

----------------------------------

SECTION 3 – DEMOGRAPHICS

NHÂN KHẨU HỌC

Tuổi
65

Giới
Nam

Cao
165 cm

Nặng
68 kg

Các thông tin nhân khẩu học này có thể sử dụng MOCK DATA.

----------------------------------

SECTION 4 – VITAL SIGNS

Hiển thị 3 Vital Card.

NHIỆT ĐỘ

36.8 °C

Source:
Thermal Camera

----------------------------------

NHỊP THỞ

17 /min

Source:
Thermal Camera

----------------------------------

NHỊP TIM

72 BPM

Source:
NIR Camera

Mỗi Vital Card có:

- Icon nhỏ.
- Giá trị lớn.
- Đơn vị nhỏ hơn.
- Một mini waveform / sparkline phía dưới.
- Label nguồn dữ liệu.

Không cần SpO2.
Không cần huyết áp.

Chỉ có:

Temperature
Respiration Rate
Heart Rate

==================================================
7. DỮ LIỆU DATASET
==================================================

Hệ thống prototype cần được thiết kế để sử dụng dữ liệu thực từ 2 dataset sau:

1. L_CAS Thermal Physiological Monitoring Dataset

Dùng cho:

Thermal Video
Temperature
Respiration Rate

Nhiệt độ và nhịp thở hiển thị trên Dashboard phải đồng bộ theo Ground Truth tương ứng với video L_CAS.

2. IMVIA-NIR Dataset

Dùng cho:

NIR Video
Heart Rate

Nhịp tim hiển thị trên Dashboard phải đồng bộ theo Ground Truth tương ứng với video IMVIA-NIR.

QUAN TRỌNG:

Không tự tạo random Temperature / Respiration / Heart Rate nếu tôi đã cung cấp video và ground truth.

Khi tôi cung cấp các file dataset/video/ground truth cho project, hãy sử dụng chính các giá trị ground truth đó.

Nếu hiện tại chưa có dữ liệu được import vào Figma prototype, có thể tạm sử dụng mock values:

Temperature: 36.8°C
Respiration: 17/min
Heart Rate: 72 BPM

nhưng structure của UI phải sẵn sàng để thay bằng dữ liệu thật sau này.

==================================================
8. NORMAL / ALERT INTERACTION
==================================================

Ở cuối Patient Dashboard có một button lớn:

[ ✓ ỔN ĐỊNH ]

Màu xanh dương.

Khi CLICK vào nút này:

Status của bệnh nhân chuyển từ:

BÌNH THƯỜNG

sang:

CẢNH BÁO KHẨN

Button chuyển thành màu đỏ:

[ ⚠ CẢNH BÁO ]

Toàn bộ dashboard KHÔNG được chuyển thành màu đỏ.

Chỉ thay đổi:

- Status badge.
- Alert card.
- Button.
- Những chỉ số cần cảnh báo.

Các phần còn lại vẫn giữ background trắng để tránh gây rối mắt.

==================================================
9. EMERGENCY ALERT STATE
==================================================

Khi chuyển sang trạng thái cảnh báo:

Phần trên Dashboard xuất hiện Alert Card giống bố cục reference image tôi gửi.

Header:

🔔 CẢNH BÁO KHẨN

Timestamp:

14:02:45 · Vừa xong

Message:

Có dấu hiệu bất thường cần kiểm tra bệnh nhân.

Hoặc ví dụ:

Có dấu hiệu co giật và căng cứng cơ.

Patient:

Phạm Văn A

Location:

Giường 01
Phòng 101

Demographics:

Tuổi 65
Nam
165 cm
68 kg

Vital signs ví dụ:

Nhịp thở
10 /min

Nhiệt độ
40.0°C

Nhịp tim
112 BPM

Các giá trị bất thường được highlight màu đỏ.

Ở dưới Alert Card có:

[ Báo cáo Điều dưỡng ]

Button đỏ.

Và một button:

[ Đánh dấu bệnh nhân ổn định ]

Click vào button này sẽ đưa UI trở về trạng thái NORMAL.

==================================================
10. VITAL SIGNS VISUALIZATION
==================================================

Bên dưới camera có thể có một section:

Tín hiệu sinh tồn trực tiếp

Hiển thị 3 waveform chart:

Temperature
Respiration
Heart Rate

Chart rất đơn giản, medical style.

Respiration waveform:
dạng tín hiệu thở theo thời gian.

Heart Rate:
pulse waveform.

Temperature:
đường temperature trend.

Hiển thị khoảng thời gian:

60 giây gần nhất

Không cần chart quá lớn.

==================================================
11. SYSTEM STATUS
==================================================

Thêm một khu vực nhỏ:

TRẠNG THÁI HỆ THỐNG

Thermal Camera
● Đang hoạt động

NIR Camera
● Đang hoạt động

Patient Tracking
● Bình thường

Signal Quality
● Tốt

Mục đích là cho bác sĩ biết hệ thống đang quan sát bệnh nhân đáng tin cậy.

==================================================
12. INTERACTION PROTOTYPE
==================================================

Tạo prototype flow có thể click:

Login
↓
Rooms
↓
Room 101
↓
Click Giường 01
↓
Patient Live Monitoring
↓
Click "Ổn định"
↓
Emergency Alert State
↓
Click "Đánh dấu bệnh nhân ổn định"
↓
Normal State

Room 102 và Room 103 không click được.

==================================================
13. UI COMPONENTS
==================================================

Hãy tạo reusable components cho:

Button
Status Badge
Room Card
Bed Overlay
Camera Card
Vital Sign Card
Patient Information Card
Alert Card
Sidebar Item
Header
System Status Item
Waveform Card

Sử dụng Auto Layout và component variants.

Ví dụ Status Badge variants:

Normal
Warning
Disconnected
Monitoring

Button variants:

Primary
Secondary
Danger
Disabled

==================================================
14. IMPORTANT UX REQUIREMENTS
==================================================

Đây là phần mềm dùng trong bệnh viện nên ưu tiên:

- Quan sát nhanh.
- Chữ rõ.
- Không nhồi quá nhiều thông tin.
- Giá trị Vital Signs phải nhìn thấy ngay.
- Camera là nội dung chính.
- Không để các decoration làm người dùng mất tập trung.
- Red chỉ dùng cho Warning.
- Blue dùng cho hành động chính và trạng thái ổn định.
- Gray dùng cho thông tin phụ.
- Không dùng màu pastel quá nhiều.
- Không sử dụng kiểu UI game hoặc futuristic sci-fi.
- Không sử dụng glassmorphism quá mạnh.

Thiết kế phải trông giống một sản phẩm medical monitoring có thể triển khai thật, không giống một trang concept đơn thuần.

==================================================
15. MAIN SCREEN PRIORITY
==================================================

Hãy tập trung chất lượng thiết kế nhiều nhất vào:

Patient Live Monitoring Screen.

Khi bác sĩ mở trang này, trong vòng 2–3 giây họ phải nhận biết được ngay:

1. Đây là bệnh nhân nào.
2. Bệnh nhân nằm ở đâu.
3. Bệnh nhân có đang ổn định không.
4. Thermal Camera đang thấy gì.
5. NIR Camera đang thấy gì.
6. Temperature hiện tại.
7. Respiration Rate hiện tại.
8. Heart Rate hiện tại.
9. Camera và tín hiệu có đang hoạt động tốt không.
10. Có cảnh báo nào cần xử lý không.

Tên sản phẩm phải xuất hiện nhất quán:

Y NHÃN

Brand nhỏ:

by ViCare