from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\.user_uploaded\media_1789028116646.png")
w, h = img.size
print(f"Screenshot size: {w}x{h}")
img.save(r"c:\Users\gurug\Desktop\striatum\user_feedback_v2.png")

# Also let's inspect the original mockup:
orig = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
ow, oh = orig.size
print(f"Original mockup size: {ow}x{oh}")

# In original mockup:
# Height is 1024, width is 473. Ratio: 1024 / 473 = 2.165
# In user screenshot:
# Width is w, height is h. Ratio: h / w
print(f"User screenshot ratio: {h / w:.3f}")
