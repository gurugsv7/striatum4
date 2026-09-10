from PIL import Image
import numpy as np

img = Image.open('public/assets/profile/rendered_100pct_frame.png')
print("Image size:", img.size)
arr = np.array(img)
w = img.width

# Let's inspect the cards area:
# Row 1 of cards is around y=420..460
for y in range(410, 470, 10):
    row = arr[y, :, :3]
    # Card borders have cyan color
    cyan_pts = [x for x in range(w) if row[x, 0] < 80 and row[x, 1] > 80 and row[x, 2] > 100]
    if len(cyan_pts) > 5:
        min_x = min(cyan_pts)
        max_x = max(cyan_pts)
        left_m = min_x
        right_m = w - 1 - max_x
        print(f"y={y}: min_x={min_x}, max_x={max_x}, left_margin={left_m}px, right_margin={right_m}px, diff={abs(left_m - right_m)}px")
