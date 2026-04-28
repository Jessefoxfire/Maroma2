#!/usr/bin/env python3

import csv
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List
from urllib.parse import urlparse

CSV_PATH = Path("/Users/jesse/Documents/Maroma.com2/Maroma Product Cataogue.csv")
PROJECT_ROOT = Path("/Users/jesse/Documents/maroma-staging-isolated")
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"
MEDIA_ROOT = PUBLIC_DIR / "staging-media"
MANIFEST_PATH = DATA_DIR / "maroma-image-manifest.json"
LOG_PATH = DATA_DIR / "maroma-image-download-log.json"

REQUEST_DELAY_SECONDS = 0.6
REQUEST_TIMEOUT_SECONDS = 30
MAX_FILES = None


def load_csv_urls(csv_path: Path) -> List[str]:
    urls: List[str] = []
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            images = (row.get("Images") or "").strip()
            if not images:
                continue
            urls.extend(part.strip() for part in images.split(",") if part.strip())
    return sorted(set(urls))


def safe_relative_path(url: str) -> Path:
    parsed = urlparse(url)
    raw_path = parsed.path.lstrip("/")
    if not raw_path:
        digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
        raw_path = f"unknown/{digest}"
    candidate = Path(raw_path)
    suffix = candidate.suffix or ".bin"
    sanitized_parts = []
    for part in candidate.parts:
        if part in {"", ".", ".."}:
            continue
        sanitized = "".join(ch for ch in part if ch.isalnum() or ch in {".", "-", "_"})
        sanitized_parts.append(sanitized or "file")
    safe_path = Path(*sanitized_parts)
    if safe_path.suffix != suffix:
        safe_path = safe_path.with_suffix(suffix)
    return safe_path


def load_existing_log() -> Dict[str, Dict[str, str]]:
    if not LOG_PATH.exists():
        return {}
    try:
        return json.loads(LOG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def download_file(url: str, destination: Path) -> Dict[str, str]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path = destination.with_suffix(destination.suffix + ".part")
    command = [
        "curl",
        "--fail",
        "--location",
        "--silent",
        "--show-error",
        "--max-time",
        str(REQUEST_TIMEOUT_SECONDS),
        "--user-agent",
        "MaromaStagingMediaCopy/1.0 (read-only, rate-limited)",
        "--header",
        "Accept: image/*,*/*;q=0.8",
        "--output",
        str(temp_path),
        "--write-out",
        "%{http_code}",
        url,
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        if temp_path.exists():
            temp_path.unlink()
        raise RuntimeError(result.stderr.strip() or f"curl exited with {result.returncode}")
    temp_path.replace(destination)
    return {
        "status": "downloaded",
        "http_status": result.stdout.strip() or "200",
        "bytes": str(destination.stat().st_size),
    }


def main() -> int:
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}", file=sys.stderr)
        return 1

    urls = load_csv_urls(CSV_PATH)
    manifest = []
    for url in urls[:MAX_FILES]:
        relative_path = safe_relative_path(url)
        local_disk_path = MEDIA_ROOT / relative_path
        manifest.append(
            {
                "source_url": url,
                "local_disk_path": str(local_disk_path),
                "public_url": f"/staging-media/{relative_path.as_posix()}",
            }
        )

    save_json(MANIFEST_PATH, manifest)

    log = load_existing_log()
    processed = 0
    for item in manifest:
        url = item["source_url"]
        disk_path = Path(item["local_disk_path"])
        if disk_path.exists():
            log[url] = {
                "status": "skipped_existing",
                "local_disk_path": str(disk_path),
                "public_url": item["public_url"],
            }
            processed += 1
            continue

        try:
            result = download_file(url, disk_path)
            log[url] = {
                **result,
                "local_disk_path": str(disk_path),
                "public_url": item["public_url"],
            }
        except Exception as exc:  # noqa: BLE001
            log[url] = {
                "status": "failed",
                "error": str(exc),
                "local_disk_path": str(disk_path),
                "public_url": item["public_url"],
            }
        save_json(LOG_PATH, log)
        processed += 1
        if processed < len(manifest):
            time.sleep(REQUEST_DELAY_SECONDS)

    counts: Dict[str, int] = {}
    for item in log.values():
        status = item.get("status", "unknown")
        counts[status] = counts.get(status, 0) + 1
    print(json.dumps({"total_manifest": len(manifest), "counts": counts}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
