#!/usr/bin/env python3
"""Add phone photos to the website gallery.

  1. Drop raw photos (jpg, jpeg, png, and heic if pillow-heif is installed) in photos/inbox/
  2. Run:  python3 tools/add_photos.py
  3. Commit and push.

For each photo this script:
  - fixes the rotation using the EXIF orientation,
  - STRIPS ALL EXIF / GPS / camera metadata (customer privacy),
  - saves a web copy (max 1600px on the long edge, JPEG ~82, progressive) and a 640px thumbnail in photos/,
  - gives it a clean slug filename (never overwrites an existing file; adds -02, -03 ... instead),
  - moves the original into photos/inbox/processed/,
  - appends an entry to photos/gallery.json (validated, written safely).

Optional:  --service "Air Conditioning"  --caption "Condenser replacement"  --date 2026-09-14
If you leave them out and run it in a terminal, it asks once per batch (press Enter to skip).
Needs Pillow only:  pip install pillow      (HEIC photos also need:  pip install pillow-heif)
"""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install pillow")

try:
    from PIL import ImageCms
except ImportError:  # lcms missing: colours are left as they are
    ImageCms = None

HEIF = False
try:
    import pillow_heif  # type: ignore
    pillow_heif.register_heif_opener()
    HEIF = True
except Exception:
    pass

SERVICES = ["Air Conditioning", "Heating", "Indoor Air Quality", "Water Heating"]
FULL_MAX, THUMB_MAX = 1600, 640
OK_EXT = {".jpg", ".jpeg", ".png"}
HEIC_EXT = {".heic", ".heif"}

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(BASE, "photos")
INBOX = os.path.join(PHOTOS, "inbox")
PROCESSED = os.path.join(INBOX, "processed")
GALLERY = os.path.join(PHOTOS, "gallery.json")


def slugify(text):
    text = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return text[:48].strip("-")


def sha1(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_gallery():
    if not os.path.exists(GALLERY):
        return []
    try:
        with open(GALLERY, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        sys.exit("photos/gallery.json is not valid JSON (%s). Fix it or restore it, then run again. Nothing was changed." % e)
    if not isinstance(data, list) or not all(isinstance(x, dict) for x in data):
        sys.exit("photos/gallery.json must be a list of photo entries ([ {...}, {...} ]). Nothing was changed.")
    return data


def save_gallery(data):
    fd, tmp = tempfile.mkstemp(dir=PHOTOS, suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, GALLERY)


def unique_name(stem, taken):
    n = 1
    while True:
        name = "%s-%02d" % (stem, n)
        if not any(os.path.exists(os.path.join(PHOTOS, name + s)) for s in (".jpg", "-640.jpg")) and (name + ".jpg") not in taken:
            return name
        n += 1


def exif_date(img):
    try:
        ex = img.getexif()
        raw = ex.get_ifd(0x8769).get(0x9003) or ex.get(0x0132)  # DateTimeOriginal, else DateTime
        if raw:
            return dt.datetime.strptime(str(raw)[:10], "%Y:%m:%d").date().isoformat()
    except Exception:
        pass
    return ""


def to_clean_rgb(img):
    """Orient, convert to sRGB, flatten transparency, and return a new image that carries NO metadata."""
    icc = img.info.get("icc_profile")
    img = ImageOps.exif_transpose(img)
    if icc and ImageCms is not None:
        try:
            import io
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            dst = ImageCms.createProfile("sRGB")
            img = ImageCms.profileToProfile(img.convert("RGB"), src, dst, outputMode="RGB")
        except Exception:
            pass
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    else:
        img = img.convert("RGB")
    return Image.frombytes("RGB", img.size, img.tobytes())  # fresh pixels only: no EXIF, GPS, ICC, thumbnails


def save_jpeg(img, path, long_edge, quality):
    out = img.copy()
    out.thumbnail((long_edge, long_edge), Image.LANCZOS)  # only ever shrinks
    out.save(path, "JPEG", quality=quality, optimize=True, progressive=True)  # no exif= argument: nothing is written
    return out.size


def pick_service(args):
    if args.service is not None:
        return args.service.strip()
    if not sys.stdin.isatty():
        return ""
    print("\nWhat service are these photos for?")
    for i, s in enumerate(SERVICES, 1):
        print("  %d) %s" % (i, s))
    ans = input("Number (Enter to skip): ").strip()
    if ans.isdigit() and 1 <= int(ans) <= len(SERVICES):
        return SERVICES[int(ans) - 1]
    return ""


def main():
    ap = argparse.ArgumentParser(description="Add photos from photos/inbox to the website gallery.")
    ap.add_argument("--service", help="one of: " + ", ".join(SERVICES))
    ap.add_argument("--caption", help="short caption, e.g. 'Condenser replacement'")
    ap.add_argument("--date", help="YYYY-MM-DD (default: the date stored in the photo, if any)")
    ap.add_argument("--dry-run", action="store_true", help="show what would happen, change nothing")
    args = ap.parse_args()

    if args.date:
        try:
            dt.date.fromisoformat(args.date)
        except ValueError:
            sys.exit("--date must look like 2026-09-14")
    if args.service and args.service.strip().lower() not in [s.lower() for s in SERVICES]:
        print("Note: '%s' is not one of the four services, so the gallery filter will not group it." % args.service)

    os.makedirs(INBOX, exist_ok=True)
    gallery = load_gallery()  # validates before we touch anything
    names = sorted(os.listdir(INBOX), key=str.lower)
    candidates, skipped = [], []
    for n in names:
        p = os.path.join(INBOX, n)
        if not os.path.isfile(p) or n.startswith("."):
            continue
        ext = os.path.splitext(n)[1].lower()
        if ext in OK_EXT or (ext in HEIC_EXT and HEIF):
            candidates.append(n)
        elif ext in HEIC_EXT:
            skipped.append(n)
    for n in skipped:
        print("SKIPPED %s: HEIC photos need pillow-heif (pip install pillow-heif). Or set the iPhone to Most Compatible / send as JPEG." % n)
    if not candidates:
        print("No new photos in photos/inbox/. Nothing to do.")
        return 0

    seen = set()
    if os.path.isdir(PROCESSED):
        for n in os.listdir(PROCESSED):
            p = os.path.join(PROCESSED, n)
            if os.path.isfile(p):
                seen.add(sha1(p))

    todo = []
    for n in candidates:
        p = os.path.join(INBOX, n)
        h = sha1(p)
        if h in seen:
            print("SKIPPED %s: an identical photo was already added (see photos/inbox/processed/). Delete it from the inbox." % n)
            continue
        seen.add(h)
        todo.append(n)
    if not todo:
        return 0

    service = pick_service(args)
    caption = args.caption.strip() if args.caption is not None else (input("Caption (Enter to skip): ").strip() if sys.stdin.isatty() else "")
    taken = {g.get("file") for g in gallery} | {g.get("thumb") for g in gallery}
    added = 0
    for n in todo:
        src = os.path.join(INBOX, n)
        try:
            with Image.open(src) as im:
                im.load()
                taken_date = exif_date(im)
                clean = to_clean_rgb(im)
        except Exception as e:
            print("SKIPPED %s: could not open it (%s)" % (n, e))
            continue
        stem = slugify(caption) or slugify(service) or slugify(os.path.splitext(n)[0]) or "photo"
        name = unique_name(stem, taken)
        full_name, thumb_name = name + ".jpg", name + "-640.jpg"
        date = args.date or taken_date
        alt = caption or ((service + " installation photo") if service else "Installation photo")
        entry = {"file": full_name, "thumb": thumb_name}
        if caption:
            entry["caption"] = caption
        if service:
            entry["service"] = service
        if date:
            entry["date"] = date
        entry["alt"] = alt
        if args.dry_run:
            print("WOULD ADD %s -> %s (+ %s)" % (n, full_name, thumb_name))
            taken.update({full_name, thumb_name})
            continue
        fs = save_jpeg(clean, os.path.join(PHOTOS, full_name), FULL_MAX, 82)
        ts = save_jpeg(clean, os.path.join(PHOTOS, thumb_name), THUMB_MAX, 80)
        os.makedirs(PROCESSED, exist_ok=True)
        dest = os.path.join(PROCESSED, n)
        k = 1
        while os.path.exists(dest):
            root, ext = os.path.splitext(n)
            dest = os.path.join(PROCESSED, "%s-%d%s" % (root, k, ext))
            k += 1
        shutil.move(src, dest)
        gallery.append(entry)
        taken.update({full_name, thumb_name})
        added += 1
        print("ADDED %s -> %s (%dx%d) + thumb (%dx%d), metadata removed" % (n, full_name, fs[0], fs[1], ts[0], ts[1]))

    if added:
        for g in gallery:  # final validation: every entry points at a real file
            if not g.get("file") or not os.path.exists(os.path.join(PHOTOS, g["file"])):
                print("WARNING: gallery.json lists %r but that file is missing from photos/." % g.get("file"))
        save_gallery(gallery)
        print("\nDone: %d photo(s) added. gallery.json now has %d photo(s). Next: commit and push." % (added, len(gallery)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
