"""Prepare browser-friendly ViCare monitoring media and ground-truth data.

The script pairs five LCAS thermal recordings with five IMVIA-FIR recordings,
creates H.264 MP4 files for the web dashboard, and writes downsampled JSON
signals used by the React visualisations.

Run from ``WebSite Demo``::

    python3 scripts/prepare_dashboard_media.py
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np


SUBJECTS = [
    ("01", "2016-11-22-14-09-37-Joao", "joao"),
    ("02", "2016-11-22-14-13-46-anestis", "anestis"),
    ("03", "2016-11-22-14-23-08-Claudio", "claudio"),
    ("04", "2016-11-22-14-29-29-Manuel", "manuel"),
    ("05", "2016-11-22-14-39-46-Jaime", "jaime"),
]

CLIP_DURATION_SECONDS = 30.0


def timestamp_seconds(value: str) -> float:
    match = re.search(r"-(\d\d):(\d\d):(\d\d\.\d+)$", value.strip())
    if not match:
        raise ValueError(f"Unexpected LCAS timestamp: {value}")
    hour, minute, second = match.groups()
    return int(hour) * 3600 + int(minute) * 60 + float(second)


def read_lcas_csv(path: Path) -> tuple[np.ndarray, np.ndarray]:
    times: list[float] = []
    values: list[float] = []
    with path.open(newline="") as handle:
        for row in csv.reader(handle):
            if len(row) < 2:
                continue
            times.append(timestamp_seconds(row[0]))
            values.append(float(row[1]))
    time_array = np.asarray(times, dtype=np.float64)
    time_array -= time_array[0]
    return time_array, np.asarray(values, dtype=np.float64)


def read_numeric_csv(path: Path) -> np.ndarray:
    values: list[float] = []
    with path.open(newline="") as handle:
        for row in csv.reader(handle):
            if not row:
                continue
            try:
                values.append(float(row[-1]))
            except ValueError:
                continue
    return np.asarray(values, dtype=np.float64)


def sample_signal(
    times: np.ndarray,
    values: np.ndarray,
    samples_per_second: float,
    aggregate: str = "mean",
) -> list[list[float]]:
    """Bucket a signal while retaining a compact [time, value] representation."""
    if not len(times):
        return []
    bucket = np.floor(times * samples_per_second).astype(np.int64)
    result: list[list[float]] = []
    for bucket_id in np.unique(bucket):
        selected = values[bucket == bucket_id]
        value = float(np.max(selected) if aggregate == "max" else np.mean(selected))
        result.append([round(float(bucket_id / samples_per_second), 3), round(value, 3)])
    return result


def respiration_rate(times: np.ndarray, values: np.ndarray) -> float:
    # LCAS respiration ground truth is an impulse signal. Count rising edges,
    # merging detections within 1.5 seconds to reject duplicate/noisy impulses.
    active = values > 0.5
    candidates = times[active & ~np.r_[False, active[:-1]]]
    edges: list[float] = []
    for candidate in candidates:
        if not edges or float(candidate) - edges[-1] >= 1.5:
            edges.append(float(candidate))
    duration_minutes = max(float(times[-1]) / 60.0, 1e-6)
    return round(float(len(edges) / duration_minutes), 1)


def locate_imvia(root: Path, bed: str, filename: str) -> Path:
    candidates = sorted(root.glob(f"**/{bed}/{filename}"))
    if not candidates:
        raise FileNotFoundError(f"Missing IMVIA-FIR {bed}/{filename} below {root}")
    return candidates[0]


def video_duration(path: Path) -> float:
    output = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return float(output.strip())


def transcode_imvia(source: Path, output: Path, overwrite: bool) -> None:
    if output.exists() and not overwrite:
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-t",
            str(CLIP_DURATION_SECONDS),
            "-vf",
            "scale=720:-2",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "25",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(output),
        ],
        check=True,
    )


def thermal_chunks(dataset_root: Path, stem: str) -> list[Path]:
    chunks = sorted(dataset_root.glob(f"*/thermal/{stem}_*.npy"))
    if not chunks:
        raise FileNotFoundError(f"No extracted thermal chunks for {stem} below {dataset_root}")
    return chunks


def encode_lcas(
    chunks: list[Path],
    output: Path,
    duration: float,
    overwrite: bool,
) -> int:
    source_frame_count = sum(int(np.load(chunk, mmap_mode="r").shape[0]) for chunk in chunks)
    fps = source_frame_count / max(duration, 1.0)
    frame_count = min(source_frame_count, int(round(fps * CLIP_DURATION_SECONDS)))
    if output.exists() and not overwrite:
        return frame_count

    first = np.load(chunks[0], mmap_mode="r")
    height, width = map(int, first.shape[1:3])
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{width}x{height}",
        "-r",
        f"{fps:.6f}",
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "24",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    written = 0
    try:
        for chunk in chunks:
            frames = np.load(chunk, mmap_mode="r")
            for frame in frames:
                if written >= frame_count:
                    break
                gray = np.clip(frame, 0, 255).astype(np.uint8)
                colour = cv2.applyColorMap(gray, cv2.COLORMAP_INFERNO)
                process.stdin.write(colour.tobytes())
                written += 1
            if written >= frame_count:
                break
    except BrokenPipeError as exc:
        raise RuntimeError("ffmpeg stopped while encoding LCAS frames") from exc
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"ffmpeg failed to encode {output}")
    return frame_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", type=Path, default=Path("../dataset"))
    parser.add_argument("--lcas-root", type=Path, default=Path("data/L_CASThermal"))
    parser.add_argument("--imvia-root", type=Path, default=Path("data/IMVIA-FIR"))
    parser.add_argument("--public-root", type=Path, default=Path("public"))
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    metadata: dict[str, object] = {"generatedFrom": "L_CAS + IMVIA-FIR", "beds": {}}
    beds = metadata["beds"]
    assert isinstance(beds, dict)

    for bed, lcas_stem, slug in SUBJECTS:
        heart_path = args.lcas_root / "Ground_Truth" / f"{lcas_stem}_heartbeat.csv"
        resp_path = args.lcas_root / "Ground_Truth" / f"{lcas_stem}_respiration.csv"
        heart_t, heart_v = read_lcas_csv(heart_path)
        resp_t, resp_v = read_lcas_csv(resp_path)
        source_lcas_duration = max(float(heart_t[-1]), float(resp_t[-1]))
        heart_mask = heart_t <= CLIP_DURATION_SECONDS
        resp_mask = resp_t <= CLIP_DURATION_SECONDS
        heart_t, heart_v = heart_t[heart_mask], heart_v[heart_mask]
        resp_t, resp_v = resp_t[resp_mask], resp_v[resp_mask]
        lcas_duration = min(source_lcas_duration, CLIP_DURATION_SECONDS)

        lcas_output = args.public_root / "media" / "lcas" / slug / "video.mp4"
        frame_count = encode_lcas(
            thermal_chunks(args.dataset_root, lcas_stem),
            lcas_output,
            source_lcas_duration,
            args.overwrite,
        )

        imvia_source = locate_imvia(args.imvia_root, bed, "vid.avi")
        bvp_path = locate_imvia(args.imvia_root, bed, "BVP.csv")
        imvia_output = args.public_root / "media" / "imvia" / bed / "video.mp4"
        transcode_imvia(imvia_source, imvia_output, args.overwrite)
        imvia_duration = video_duration(imvia_output)
        bvp = read_numeric_csv(bvp_path)
        source_imvia_duration = video_duration(imvia_source)
        bvp_times = np.linspace(0.0, source_imvia_duration, len(bvp), endpoint=False)
        bvp_mask = bvp_times <= CLIP_DURATION_SECONDS
        bvp_times, bvp = bvp_times[bvp_mask], bvp[bvp_mask]

        heart_values = heart_v[np.isfinite(heart_v)]
        beds[bed] = {
            "lcas": {
                "subject": lcas_stem.rsplit("-", 1)[-1].title(),
                "video": f"media/lcas/{slug}/video.mp4",
                "duration": round(lcas_duration, 3),
                "frames": frame_count,
                "heartRate": round(float(np.median(heart_values)), 1),
                "respirationRate": respiration_rate(resp_t, resp_v),
                "heartbeat": sample_signal(heart_t, heart_v, 2.0),
                "respiration": sample_signal(resp_t, resp_v, 4.0, aggregate="max"),
            },
            "imvia": {
                "subject": bed,
                "video": f"media/imvia/{bed}/video.mp4",
                "duration": round(imvia_duration, 3),
                "bvp": sample_signal(bvp_times, bvp, 10.0),
            },
        }
        print(f"Prepared bed {bed}: {lcas_output.name} + {imvia_output.name}")

    data_dir = args.public_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "monitoring.json").write_text(
        json.dumps(metadata, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    logo = Path("data/LogoVICARE.png")
    if logo.exists():
        args.public_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(logo, args.public_root / "logo-vicare.png")
    hospital_room = Path("data/HospitalRoom.png")
    if hospital_room.exists():
        shutil.copy2(hospital_room, args.public_root / "hospital-room.png")


if __name__ == "__main__":
    main()
