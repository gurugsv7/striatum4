from PIL import Image

mockup = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
mw, mh = mockup.size # 473 x 1024

# Let's measure vertical landmarks in original mockup:
# Status bar: 0..48
# Header: 48..100 (height 52)
# Hero identity (Avatar to quote): 100..265 (height 165)
#   - Avatar diameter: 92px
#   - Greeting "Guru.": 38px
#   - Whale area & S4 / 01: y=200..255
# MY DELEGATE ID banner card: 265..395 (height 130px)
# 6 Cards Grid: 405..655 (height 250px! Each card row is ~72px height, with 10px gaps!)
# Quote section: 660..785 (height 125px! Jellyfish height is ~115px!)
# Footer seabed section: 790..925 (height 135px!)
# Bottom nav: 925..1024 (height 99px!)
# Total height: 1024px!

print("Landmarks in original mockup (473x1024):")
print("1. Hero: 48..265 (H = 217px, Avatar diam = 92px)")
print("2. Banner card: 265..395 (H = 130px)")
print("3. 6 Cards Grid: 405..655 (H = 250px, each card H = 72px)")
print("4. Quote Section: 660..785 (H = 125px, Jellyfish H = 115px)")
print("5. Footer Section: 790..925 (H = 135px)")
print("6. Bottom Nav: 925..1024 (H = 99px)")

# Notice that in the original mockup, the footer section reaches right down to the bottom nav!
# There is NO empty void between the footer and the bottom nav!
