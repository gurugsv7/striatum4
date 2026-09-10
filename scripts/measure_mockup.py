import os
from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
arr = np.array(img)

# Let's find exact coordinates of:
# 1. Avatar circle:
# Center and radius
# 2. "MY DELEGATE ID" box:
# Top, bottom, left, right, border color, background gradient
# 3. The 6 cards:
# Rows, columns, width, height, gaps
# 4. Jellyfish section box
# 5. Footer section box

# Let's inspect the MY DELEGATE ID card bounds
# Looking at rows between y=250 and y=420
# Columns are around x=20 to 450
print("Image shape:", arr.shape)

# Let's write an inspection script to find borders and bounding boxes
def find_horizontal_lines(y_start, y_end):
    for y in range(y_start, y_end):
        row = arr[y, :, :3]
        # Check cyan/blue border pixels
        cyan_pixels = [x for x in range(len(row)) if row[x, 0] < 50 and row[x, 1] > 100 and row[x, 2] > 150]
        if len(cyan_pixels) > 10:
            pass # print(f"y={y}: {len(cyan_pixels)} cyan pixels, x range {min(cyan_pixels)}..{max(cyan_pixels)}")

find_horizontal_lines(260, 420)
