import os
from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
w, h = img.size
print(f"Mockup dimensions: {w} x {h}")

# Ensure output directory exists
assets_dir = r"c:\Users\gurug\Desktop\striatum\public\assets\profile"
os.makedirs(assets_dir, exist_ok=True)

# 1. Extract the avatar cleanly
# In the mockup, the avatar outer circle is at x: 24..116 (width 92), y: 102..194 (height 92)
# Inside the circle is the portrait.
# Let's crop the avatar at high resolution
avatar_crop = img.crop((24, 102, 116, 194))
avatar_crop.save(os.path.join(assets_dir, "guru_avatar.png"))
print("Saved guru_avatar.png")

# 2. Extract the hero background artwork:
# From y=0 (or 50 excluding status bar) to y=265
# The top has ocean light rays from surface down, rocky cliffs, and whale on right.
# Let's crop the hero background from y=48 to y=265
hero_bg = img.crop((0, 48, w, 265))
hero_bg.save(os.path.join(assets_dir, "profile_hero_bg.png"))
print("Saved profile_hero_bg.png")

# 3. Extract the 3D Pass card graphic from "MY DELEGATE ID"
# In mockup: card is at x: 285..445, y: 268..390
pass_card = img.crop((285, 268, 445, 388))
# Let's inspect pass card
pass_card.save(os.path.join(assets_dir, "delegate_pass_card_preview.png"))
print("Saved delegate_pass_card_preview.png")

# 4. Extract the Jellyfish graphic:
# In mockup: x: 15..155, y: 660..785
jelly_crop = img.crop((12, 660, 160, 785))
jelly_crop.save(os.path.join(assets_dir, "bioluminescent_jellyfish.png"))
print("Saved bioluminescent_jellyfish.png")

# 5. Extract the footer ocean seabed artwork:
# In mockup: y: 785..925, x: 0..w
footer_bg = img.crop((0, 785, w, 925))
footer_bg.save(os.path.join(assets_dir, "profile_footer_bg.png"))
print("Saved profile_footer_bg.png")

# 6. Let's analyze exact colors:
arr = np.array(img)
# Sample background color at top-left:
c_bg_top = arr[60, 20]
print(f"Top-left bg color: {c_bg_top}")
# Sample cyan color in "4.0" or "Guru.":
# Let's find brightest cyan
cyan_mask = (arr[:, :, 0] < 80) & (arr[:, :, 1] > 200) & (arr[:, :, 2] > 220)
y_indices, x_indices = np.where(cyan_mask)
if len(y_indices) > 0:
    sample_cyan = arr[y_indices[0], x_indices[0]]
    print(f"Sample cyan accent: rgb({sample_cyan[0]}, {sample_cyan[1]}, {sample_cyan[2]}) = #{sample_cyan[0]:02x}{sample_cyan[1]:02x}{sample_cyan[2]:02x}")

# Card background color:
c_card = arr[320, 50]
print(f"Delegate card bg color: {c_card}")

# Action card bg color:
c_act_card = arr[430, 80]
print(f"Action card bg color: {c_act_card}")
