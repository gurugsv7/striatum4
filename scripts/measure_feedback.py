from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
arr = np.array(img)
h, w, _ = arr.shape
print(f"Screenshot shape: {w}x{h}")

# Let's inspect row y=425 (where My Bookings & My Registrations are):
# Find card borders:
# Cyan border in current screen:
for y in [425, 435, 520, 600]:
    row = arr[y, :, :3]
    # find cyan-ish or bright pixels
    bright_indices = [x for x in range(w) if (row[x, 1] > 100 and row[x, 2] > 140) or (row[x, 0] > 150 and row[x, 1] > 150)]
    print(f"y={y}: min_x={min(bright_indices) if bright_indices else None}, max_x={max(bright_indices) if bright_indices else None}")

# In the screenshot:
# Width of the screen is 400px.
# Notice the right card "My Registrations": its right edge is cut off at x=400!
# Why is it cut off?
