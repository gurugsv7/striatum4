import os
from PIL import Image
import numpy as np

mockup = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png").convert("RGBA")

# Card is located at x: 280 to 445, y: 266 to 388
pass_3d = mockup.crop((280, 266, 445, 388))
pass_3d.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\pass_3d_card.png")

# Also let's extract the card background texture (left side without text or the whole card texture):
# Let's crop the whole card from x: 22 to 451, y: 265 to 392
card_full = mockup.crop((22, 265, 451, 392))
card_full.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\delegate_banner_raw.png")

print("Saved pass_3d_card.png and delegate_banner_raw.png")
