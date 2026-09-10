from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
arr = np.array(img)
h, w, _ = arr.shape

# Let's find the left border of MY DELEGATE ID card:
# MY DELEGATE ID card is around y=320..380
for y in range(320, 380, 10):
    row = arr[y, :, :3]
    # cyan border
    border_pts = [x for x in range(w) if row[x, 0] < 50 and row[x, 1] > 80 and row[x, 2] > 100]
    if border_pts:
        print(f"MY DELEGATE ID y={y}: min_x={min(border_pts)}, max_x={max(border_pts)}, width={max(border_pts)-min(border_pts)}")

# Now find the cards below:
# y=510 (Certificates / Schedule row)
for y in [440, 520, 600]:
    row = arr[y, :, :3]
    border_pts = [x for x in range(w) if row[x, 0] < 50 and row[x, 1] > 80 and row[x, 2] > 100]
    if border_pts:
        print(f"Card row y={y}: min_x={min(border_pts)}, max_x={max(border_pts)}, width={max(border_pts)-min(border_pts)}")
