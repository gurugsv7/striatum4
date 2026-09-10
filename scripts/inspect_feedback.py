from PIL import Image
import numpy as np

img_orig = Image.open(r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\.user_uploaded\media_1789011961070.png")
img_current = Image.open(r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\.user_uploaded\media_1789012745586.png")

print(f"Original mockup size: {img_orig.size}")
print(f"Current screen size: {img_current.size}")

# Let's inspect where the cards are in both images:
# In img_current (size is roughly 428 x 892 or similar)
# Let's save a copy in workspace to examine
img_current.save(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
print("Saved user_feedback_screenshot.png")
