"""Chuyển video NIR thành ảnh nhiệt giả lập (false-color)."""

import argparse

import cv2


def parse_input(value: str):
    return int(value) if value.isdigit() else value


def nir_to_fake_thermal(frame):
    """Đổi một frame NIR thành ảnh nhiệt giả lập."""
    gray = frame if len(frame.shape) == 2 else cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    normalized = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    normalized = cv2.GaussianBlur(normalized, (3, 3), 0)
    return cv2.applyColorMap(normalized, cv2.COLORMAP_JET)


def main():
    parser = argparse.ArgumentParser(description="NIR -> ảnh nhiệt giả lập")
    parser.add_argument("--input", default="0", help="ID camera hoặc file video")
    parser.add_argument("--output", default="", help="File MP4 đầu ra, tùy chọn")
    parser.add_argument("--no-preview", action="store_true", help="Không mở cửa sổ xem trước")
    args = parser.parse_args()

    capture = cv2.VideoCapture(parse_input(args.input))
    if not capture.isOpened():
        raise RuntimeError(f"Không mở được nguồn video: {args.input}")

    writer = None
    if args.output:
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = capture.get(cv2.CAP_PROP_FPS)
        if fps <= 0 or fps != fps:
            fps = 30.0
        writer = cv2.VideoWriter(
            args.output, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height)
        )
        if not writer.isOpened():
            capture.release()
            raise RuntimeError(f"Không tạo được file đầu ra: {args.output}")

    print("Đang chạy. Nhấn phím q để thoát.")
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            thermal_fake = nir_to_fake_thermal(frame)
            if writer is not None:
                writer.write(thermal_fake)
            if not args.no_preview:
                cv2.imshow("NIR - Fake Thermal", thermal_fake)
            if not args.no_preview and cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        capture.release()
        if writer is not None:
            writer.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
