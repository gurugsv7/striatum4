from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
arr = np.array(img)
h, w, _ = arr.shape

# Let's inspect where the phone frame starts in the image:
# On the left (x: 0..50):
for x in range(0, 50, 5):
    col = arr[:, x, :3]
    print(f"x={x}: avg brightness = {col.mean():.1f}, max = {col.max()}")

# On the right (x: w-50..w):
for x in range(w-50, w, 5):
    col = arr[:, x, :3]
    print(f"x={x}: avg brightness = {col.mean():.1f}, max = {col.max()}")
