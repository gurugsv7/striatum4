from PIL import Image
import numpy as np

img = Image.open('public/assets/profile/rendered_phone_frame.png')
arr = np.array(img)
h, w, _ = arr.shape

# Let's search across all rows to find the card boundaries
for y in range(250, 700, 20):
    row = arr[y, :, :3]
    # Check for card borders (cyan color: r<80, g>80, b>100)
    cyan_pts = [x for x in range(w) if row[x, 0] < 80 and row[x, 1] > 80 and row[x, 2] > 100]
    if len(cyan_pts) > 10:
        print(f"y={y}: min_x={min(cyan_pts)}, max_x={max(cyan_pts)}, left_margin={min(cyan_pts)}, right_margin={w - 1 - max(cyan_pts)}")
