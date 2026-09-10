import os
from PIL import Image, ImageFilter
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
w, h = img.size

# Let's inspect the hero region from y=0 to y=260:
hero = img.crop((0, 0, w, 265)).convert("RGB")
hero.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\hero_raw_with_text.png")

# Notice what is on hero:
# Top: phone status bar (y: 0..45) -> we can remove/crop or extend top light rays
# Left: STRIATUM 4.0, IGMCRI · SIGMA 2026 (y: 45..75, x: 25..150)
# Right: PEOPLE / SCIENCE... (y: 45..90, x: 395..450)
# Left: Avatar (y: 102..194, x: 24..116)
# Center: Hello, Guru. Delegate IGMCRI "Same curiosity..." (y: 110..225, x: 135..295)
# Right: Whale is at x: 285..460, y: 115..200 (completely clean!)
# Below whale: S4 / 01, A SMALL PART... (y: 200..250, x: 375..450)

print("Inspecting hero clean areas...")
