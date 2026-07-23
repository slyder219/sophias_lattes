
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageOps
import pillow_avif  # noqa: F401


folder1 = Path(r"C:\Users\seanl\Documents\sophias_lattes\assets\slideshow")
folder2 = Path(r"C:\Users\seanl\Documents\sophias_lattes\assets\backgrouds")

MAX_BYTES = 500_000
QUALITY_STEPS = (56, 48, 40, 34, 28, 24, 20)
RESIZE_STEPS = (1.0, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52)


def load_image(path: Path) -> Image.Image:
	with Image.open(path) as opened:
		normalized = ImageOps.exif_transpose(opened)
		if normalized.mode not in {"RGB", "RGBA"}:
			if "A" in normalized.getbands():
				normalized = normalized.convert("RGBA")
			else:
				normalized = normalized.convert("RGB")
		return normalized.copy()


def resized_copy(image: Image.Image, scale: float) -> Image.Image:
	if scale >= 0.999:
		return image.copy()

	width, height = image.size
	resized_dimensions = (max(1, int(width * scale)), max(1, int(height * scale)))
	return image.resize(resized_dimensions, Image.Resampling.LANCZOS)


def encode_avif(image: Image.Image, quality: int) -> bytes:
	buffer = io.BytesIO()
	image.save(buffer, format="AVIF", quality=quality, speed=8)
	return buffer.getvalue()


def choose_payload(image: Image.Image) -> tuple[bytes, tuple[int, int], int, bool]:
	best_payload = b""
	best_dimensions = image.size
	best_quality = QUALITY_STEPS[-1]

	for scale in RESIZE_STEPS:
		candidate = resized_copy(image, scale)
		try:
			for quality in QUALITY_STEPS:
				payload = encode_avif(candidate, quality)
				if not best_payload or len(payload) < len(best_payload):
					best_payload = payload
					best_dimensions = candidate.size
					best_quality = quality

				if len(payload) <= MAX_BYTES:
					return payload, candidate.size, quality, True
		finally:
			candidate.close()

	return best_payload, best_dimensions, best_quality, False


def shrink_file(path: Path) -> str:
	current_size = path.stat().st_size
	if current_size <= MAX_BYTES:
		return f"skip  {path.name} | already {current_size / 1000:.1f} KB"

	image = load_image(path)
	try:
		payload, dimensions, quality, fits_target = choose_payload(image)
	finally:
		image.close()

	temp_path = path.with_name(f"{path.name}.tmp")
	temp_path.write_bytes(payload)
	temp_path.replace(path)

	result = (
		f"done  {path.name} | {current_size / 1000:.1f} KB -> {len(payload) / 1000:.1f} KB"
		f" | {dimensions[0]}x{dimensions[1]} | q={quality}"
	)
	if fits_target:
		return result

	return f"warn  {result} | still above target"


def iter_avif_files(folder: Path) -> list[Path]:
	return sorted(path for path in folder.iterdir() if path.is_file() and path.suffix.lower() == ".avif")


def main() -> int:
	folders = (folder1, folder2)
	warnings = 0

	for folder in folders:
		print(f"\n[{folder}]")
		for path in iter_avif_files(folder):
			message = shrink_file(path)
			print(message)
			if message.startswith("warn"):
				warnings += 1

	return 0 if warnings == 0 else 2


if __name__ == "__main__":
	raise SystemExit(main())

