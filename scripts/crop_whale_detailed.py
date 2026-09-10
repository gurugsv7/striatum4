import os
from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")

# Let's crop the swimming whale precisely:
# x: 280 to 465, y: 100 to 205
whale = img.crop((280, 100, 465, 205))
whale.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\whale_raw.png")

# Let's also inspect the light shafts at top center:
# x: 180 to 320, y: 0 to 120
sunshafts = img.crop((160, 0, 320, 120))
sunshafts.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\sunshafts.png")

print("Whale & sunshafts saved.")
