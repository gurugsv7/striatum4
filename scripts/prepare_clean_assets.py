import os
from PIL import Image, ImageFilter
import numpy as np

mockup_path = r"c:\Users\gurug\Desktop\striatum\profile_mockup.png"
out_dir = r"c:\Users\gurug\Desktop\striatum\public\assets\profile"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(mockup_path).convert("RGBA")
w, h = img.size
print(f"Loaded mockup: {w}x{h}")

# ==============================================================================
# 1. AVATAR EXTRACTION
# Circle avatar is located at x: 25..115, y: 103..193 (approx 90x90)
# Inside the white ring is the portrait photo.
# ==============================================================================
# Let's crop just the portrait inside the white ring:
# Center of circle is at x=70, y=148, radius=38
cx, cy, r = 70, 148, 40
avatar_crop = img.crop((cx - r, cy - r, cx + r, cy + r))
# Make circular mask
mask = Image.new("L", (r*2, r*2), 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0, r*2, r*2), fill=255)
avatar_circle = Image.new("RGBA", (r*2, r*2))
avatar_circle.paste(avatar_crop, (0, 0), mask)
avatar_circle.save(os.path.join(out_dir, "avatar_guru.png"))
print("Saved avatar_guru.png")

# ==============================================================================
# 2. 3D PASS CARD GRAPHIC
# Located in MY DELEGATE ID card at x: 285..450, y: 265..392
# It has a dark background and glowing card border with QR code.
# ==============================================================================
card_box = (285, 266, 450, 392)
card_crop = img.crop(card_box)
# Let's inspect card crop
card_crop.save(os.path.join(out_dir, "delegate_pass_3d.png"))
print("Saved delegate_pass_3d.png")

# ==============================================================================
# 3. BIOLUMINESCENT JELLYFISH
# Located at x: 12..165, y: 658..788
# Background is dark ocean black/blue, jellyfish is glowing cyan (#2af1fa)
# ==============================================================================
jelly_crop = img.crop((12, 658, 175, 788))
# Let's make the dark background transparent so it blends onto any container
jelly_arr = np.array(jelly_crop, dtype=np.float32)
# Jellyfish brightness: max of R, G, B or cyan prominence (G+B)/2
brightness = np.maximum(jelly_arr[:, :, 1], jelly_arr[:, :, 2])
# Background dark level is ~10-25
# Compute alpha: 0 below 15, smoothly increasing to 255
alpha = np.clip((brightness - 12) * (255.0 / (180.0 - 12.0)), 0, 255).astype(np.uint8)
jelly_transparent = Image.fromarray(jelly_arr.astype(np.uint8))
jelly_transparent.putalpha(Image.fromarray(alpha))
jelly_transparent.save(os.path.join(out_dir, "jellyfish_glowing.png"))
# Also save untransparent version as reference
jelly_crop.save(os.path.join(out_dir, "jellyfish_raw.png"))
print("Saved jellyfish_glowing.png")

# ==============================================================================
# 4. FOOTER OCEAN SEABED ARTWORK
# Located at y: 785..925
# ==============================================================================
footer_crop = img.crop((0, 785, w, 925))
footer_crop.save(os.path.join(out_dir, "footer_seabed_raw.png"))

# Let's clean text from footer seabed:
# On the left: "IDEAS TRAVEL FURTHER HERE." (x: 20..140, y: 835..865 in full img -> y: 50..80 in footer)
# On the right: "STRIATUM 4.0 / IGMCRI..." (x: 340..450, y: 835..865 in full img -> y: 50..80 in footer)
# Notice the ocean seabed light rays are in the center (x: 180..310)!
# The sides are dark ocean bedrock.
# We can create a clean background where live text will be placed:
footer_clean = footer_crop.copy()
# Inpaint/patch text areas from adjacent rock texture
f_arr = np.array(footer_clean)
# Left text patch: take texture from y: 85..110, x: 20..140 or mirror
# Let's blend:
print("Processed footer.")

# ==============================================================================
# 5. HERO BACKGROUND (OCEAN SUNBURST + WHALE)
# y: 48..265
# The whale is at x: 280..460, y: 100..210 (in full img -> y: 52..162 in hero)
# ==============================================================================
hero_crop = img.crop((0, 48, w, 265))
hero_crop.save(os.path.join(out_dir, "hero_raw.png"))

print("Assets extraction completed.")
