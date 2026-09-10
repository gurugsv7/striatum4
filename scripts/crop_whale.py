import os
from PIL import Image

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")

# Let's crop the whale area:
# x: 280 to 460, y: 80 to 220
whale_area = img.crop((270, 80, 460, 220))
whale_area.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\whale_area.png")

# Notice: Above the whale is "PEOPLE SCIENCE A DEEPER TOMORROW" (x: 390..450, y: 40..85)
# Below the whale is "S4 / 01 \n A SMALL PART..." (x: 370..450, y: 200..250)
# To the left of the whale is the water.
# The whale itself is completely clear of text!
print("Whale area cropped.")
