import os
from PIL import Image, ImageOps

qr_src = r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\.user_uploaded\media_1789028734482.png"
im = Image.open(qr_src)
print("QR Code raw format:", im.format, "size:", im.size, "mode:", im.mode)

# Let's save a clean copy to public:
# public/art_delegate_qr.png
# public/art_event_qr.png
# public/upi_qr_sigmapy.png

# Ensure image is RGB and crisp
im_rgb = im.convert("RGB")

# Crop any extraneous whitespace or auto-crop cleanly
# Let's check bbox of non-white pixels
im_gray = im.convert("L")
# Invert so black QR dots are foreground
inv = ImageOps.invert(im_gray)
bbox = inv.getbbox()
print("QR Bounding box:", bbox)

# Crop with a slight clean quiet zone (margin) around the QR code
if bbox:
    margin = 12
    x0 = max(0, bbox[0] - margin)
    y0 = max(0, bbox[1] - margin)
    x1 = min(im.width, bbox[2] + margin)
    y1 = min(im.height, bbox[3] + margin)
    clean_qr = im_rgb.crop((x0, y0, x1, y1))
else:
    clean_qr = im_rgb

# Make it square and crisp (e.g. 500x500)
clean_qr = clean_qr.resize((512, 512), Image.Resampling.LANCZOS)

# Save to destination paths
clean_qr.save(r"c:\Users\gurug\Desktop\striatum\public\art_delegate_qr.png")
clean_qr.save(r"c:\Users\gurug\Desktop\striatum\public\art_event_qr.png")
clean_qr.save(r"c:\Users\gurug\Desktop\striatum\public\upi_qr_sigmapy.png")

print("Saved clean QR code to art_delegate_qr.png and art_event_qr.png")
