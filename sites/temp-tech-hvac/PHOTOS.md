# Adding photos to the gallery

The "Recent installs" section appears on the site only when there is at least one photo. With no photos there is no section, no gallery link and no empty frame.

## Three steps

1. **Drop photos in `photos/inbox/`** (straight from a phone: jpg, jpeg or png; HEIC works if `pillow-heif` is installed).
2. **Run the script:** `python3 tools/add_photos.py`
   It asks once for the service (1 to 4, or Enter to skip) and a short caption (or Enter). To skip the questions:
   `python3 tools/add_photos.py --service "Air Conditioning" --caption "Condenser replacement" --date 2026-09-14`
3. **Commit and push.**

The script rotates each photo correctly, **removes all hidden data from the image files (GPS location, camera details, timestamps)**; if the photo carried a date, it is kept only as the `date` in `gallery.json`, makes a web copy (up to 1600px) and a small thumbnail, names the files tidily, moves your originals to `photos/inbox/processed/`, and adds the photos to `photos/gallery.json`. It never overwrites an existing file, and running it again with an empty inbox does nothing. You need Python 3 and Pillow (`pip install pillow`).

## Even easier

Send the photos to Claude in the chat with a one-line description (the service, and the town if you like, for example "Heating, furnace replacement, Avon"). Claude runs the script and commits the result.

## Photo privacy

- Get the customer's OK before posting photos of their home.
- Avoid faces, house numbers, license plates, mail or paperwork, and open doors that show the inside of the home.
- Frame the equipment, not the neighbourhood.
- The script removes GPS and other hidden data from the files. It cannot blur what is visible in the picture.

## How the page uses the files

- `photos/gallery.json` is a plain list. Each entry: `file` (required), `thumb`, `caption`, `service` (Air Conditioning, Heating, Indoor Air Quality or Water Heating), `date`, `alt`. You can edit it by hand.
- The page also accepts the same list inline (`GALLERY_DATA = [] /*GALLERY_DATA*/` in the config at the top of the page script) so a build step can fill it in. An entry with `"sample": true` shows a visible "Sample" badge. Never ship samples.
- More than 6 photos show "Show more". Two or more different services show quiet filter chips.

## Previewing on your computer

Opening `index.html` by double-click cannot read `photos/gallery.json` (browsers block local file reads). To preview the gallery, run `python3 -m http.server 8000` in this folder and open http://localhost:8000. On the published site it just works.

## Later: phone upload page

A page where the crew picks photos on the phone and they go straight into the gallery needs a small backend (storage plus a review step). It is a later step, not part of today's setup.
