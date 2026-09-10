import os
from PIL import Image, ImageFilter
import numpy as np

mockup = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png").convert("RGBA")
w, h = mockup.size

# Let's inspect the hero:
hero = mockup.crop((0, 0, w, 275)).convert("RGB")
hero_arr = np.array(hero)

# 1. Inpaint status bar (y: 0..45)
# In y: 0..45, white text/icons are where (R>180, G>180, B>180)
# Replace those pixels with adjacent water pixels
for y in range(45):
    for x in range(w):
        r, g, b = hero_arr[y, x]
        if r > 180 and g > 180 and b > 180:
            # sample water from y+3, x
            hero_arr[y, x] = hero_arr[min(44, y+3), x]

# 2. Inpaint top-left header: "STRIATUM 4.0", "IGMCRI · SIGMA 2026"
# x: 20..160, y: 40..80
for y in range(40, 80):
    for x in range(20, 160):
        r, g, b = hero_arr[y, x]
        # Text is white/cyan/grey on dark rock
        if (r > 120 or g > 140 or b > 140):
            # Sample rock from x-5 or y-5 or dark rock
            hero_arr[y, x] = hero_arr[y, 10]

# 3. Inpaint top-right text: "PEOPLE SCIENCE A DEEPER TOMORROW"
# x: 390..455, y: 40..95
for y in range(40, 95):
    for x in range(390, 455):
        r, g, b = hero_arr[y, x]
        if r > 100 or g > 100 or b > 100:
            hero_arr[y, x] = hero_arr[y, 465]

# 4. Inpaint bottom-right text: "S4 / 01", "A SMALL PART OF A LARGER EXPEDITION"
# x: 370..455, y: 195..255
for y in range(195, 255):
    for x in range(370, 455):
        r, g, b = hero_arr[y, x]
        if r > 100 or g > 100 or b > 100:
            hero_arr[y, x] = hero_arr[y, 465]

# 5. Inpaint avatar & center text:
# Avatar is at x: 25..120, y: 100..200
# Text is at x: 130..300, y: 110..235
# Notice: In live HTML/CSS, the avatar and "Hello, Guru." will sit right here!
# If we keep the dark background behind them clean or keep the rock texture, it's smooth.
# Let's see: the whale is at x: 285..465, y: 100..200. The whale is completely untouched!

clean_hero = Image.fromarray(hero_arr)
# Apply a very subtle blur to the inpainted areas to eliminate any sharp edges
clean_hero.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\hero_clean_ocean_whale.png")
print("Saved hero_clean_ocean_whale.png")
