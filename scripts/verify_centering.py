from PIL import Image
import numpy as np

img = Image.open('public/assets/profile/rendered_phone_frame.png')
arr = np.array(img)
w = img.width

# Let's inspect row y=420 (Card 1 and Card 2):
row = arr[420, :, :3]
# Find bright pixels of card borders or background
# The card background is rgba(2, 14, 26, 0.72) with border rgba(42, 241, 250, 0.22)
# Inside the card, color is distinctly different from outer margin
# Let's find border points:
borders = [x for x in range(w) if row[x, 1] > 30 and row[x, 2] > 40]
leftmost = min(borders)
rightmost = max(borders)
print(f"Row 420: Left card start={leftmost}, Right card end={rightmost}")
print(f"Left margin = {leftmost}px, Right margin = {w - 1 - rightmost}px")
print(f"Total card area width = {rightmost - leftmost + 1}px (in {w}px container)")

# Check difference between left and right margin:
diff = abs(leftmost - (w - 1 - rightmost))
print(f"Centering difference: {diff}px (ideal is 0 or 1px due to integer rounding)")
