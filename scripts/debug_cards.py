from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
arr = np.array(img)

# Let's crop the cards area: y from 400 to 650
cards_area = img.crop((0, 400, img.width, 650))
cards_area.save(r"c:\Users\gurug\Desktop\striatum\cards_area_debug.png")

# Let's measure the width and position of Card 1 and Card 2 in row 1:
# Row 1 is around y=440
row1 = arr[440, :, :3]
# In row1, let's find the cards by looking at the card borders:
# Card borders have cyan: row[x, 1] > 60, row[x, 2] > 80
for x in range(img.width):
    r, g, b = row1[x]
    if b > 80 and g > 50 and r < 50:
        print(f"x={x}: rgb=({r},{g},{b})")

