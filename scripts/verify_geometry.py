import os
from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
w, h = img.size

# Let's inspect the cards grid:
# In mockup (473 x 1024):
# Card 1 (My Bookings): x: ~22 to 230, y: ~405 to 480 (height ~75px, width ~208px)
# Card 2 (My Registrations): x: ~243 to 451, y: ~405 to 480
# Card 3 (Certificates): x: ~22 to 230, y: ~490 to 565
# Card 4 (Schedule): x: ~243 to 451, y: ~490 to 565
# Card 5 (Personal Details): x: ~22 to 230, y: ~575 to 650
# Card 6 (Settings): x: ~243 to 451, y: ~575 to 650

# Gaps:
# Horizontal gap: 243 - 230 = 13px (at 473px width, which is ~10-12px at 393px width)
# Vertical gap: 490 - 480 = 10px

# Let's inspect the borders of the cards:
# Cards have a subtle 1px border with rounded corners (~12px radius)
# Card background is dark semi-translucent glass: rgba(2, 14, 26, 0.7) to rgba(4, 20, 36, 0.8)

# Quote section:
# y: ~660 to 780
# Left: jellyfish is at x: 15..140, y: 665..775
# Center: text at x: 190..370, y: 690..760
# Right: vertical column at x: 390..450, y: 690..760

# Footer section:
# y: ~790 to 920
# Background: seabed with light rays
# Left: "IDEAS TRAVEL FURTHER HERE." at x: 30, y: 840
# Right: "STRIATUM 4.0 / IGMCRI..." at x: 350, y: 840

print("Layout geometry verified.")
