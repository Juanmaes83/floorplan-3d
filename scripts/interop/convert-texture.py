"""Bounded local conversion; binary PNG on stdout, no file writes or network."""
import io, sys
from PIL import Image, __version__

if __version__ != "12.3.0":
    raise RuntimeError("Profile requires Pillow 12.3.0; do not silently change encoder")
data = sys.stdin.buffer.read(1048577)
if len(data) > 1048576:
    raise ValueError("Surface exceeds input byte limit")
with Image.open(io.BytesIO(data)) as im:
    required = "PNG" if sys.argv[1:] == ["png-candidate"] else "WEBP"
    if im.format != required or max(im.size) > 256 or getattr(im, "n_frames", 1) != 1:
        raise ValueError("Profile requires static " + required + " <=256 px")
    im.load()
    if "A" in im.getbands() and im.getextrema()[-1] != (255, 255):
        raise ValueError("Alpha surface requires another profile")
    out = io.BytesIO()
    im.convert("RGB").save(out, format="PNG", compress_level=9, optimize=False)
    encoded = out.getvalue()
    if len(encoded) > 1048576:
        raise ValueError("Surface exceeds output byte limit")
    sys.stdout.buffer.write(encoded)
