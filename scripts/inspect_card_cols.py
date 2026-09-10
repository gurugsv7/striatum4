from PIL import Image
import numpy as np

img = Image.open('public/assets/profile/inspect_cards_visual.png')
arr = np.array(img)
h, w, _ = arr.shape

# Let's check text pixels (white pixels: r>200, g>200, b>200) across all columns:
white_cols = []
for x in range(w):
    col = arr[:, x, :3]
    whites = np.sum((col[:, 0] > 200) & (col[:, 1] > 200) & (col[:, 2] > 200))
    if whites > 0:
        white_cols.append((x, whites))

print(f"Total width={w}")
print(f"Columns with white text: min_x={white_cols[0][0] if white_cols else None}, max_x={white_cols[-1][0] if white_cols else None}")

# Group white columns into card 1 and card 2:
c1_cols = [x for x, n in white_cols if x < 200]
c2_cols = [x for x, n in white_cols if x >= 200]

print(f"Card 1 text x range: {min(c1_cols) if c1_cols else None} to {max(c1_cols) if c1_cols else None}")
print(f"Card 2 text x range: {min(c2_cols) if c2_cols else None} to {max(c2_cols) if c2_cols else None}")
