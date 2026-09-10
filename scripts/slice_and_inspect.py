import os
from PIL import Image

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
w, h = img.size
print(f"Mockup size: {w} x {h}")

# The mockup image has width 473, height 1024.
# Let's inspect the vertical layout in detail:
# 0 - 55: Status bar (9:41, wifi, signal, battery)
# ~55 - 110: Header:
#   Left: STRIATUM 4.0 / IGMCRI · SIGMA 2026
#   Right: PEOPLE \n SCIENCE \n A DEEPER \n TOMORROW \n ---
# ~110 - 260:
#   Left: Avatar (circle, ~92px diameter with border and edit badge)
#   Center:
#     "Hello," (serif / playfair italic or regular)
#     "Guru." (bold serif, cyan dot)
#     "Delegate"
#     "IGMCRI"
#     "Same curiosity. A deeper tomorrow." (italic quote)
#   Right:
#     Swimming whale in deep blue water
#     "S4 / 01" (with cyan dot)
#     "A SMALL PART OF A LARGER EXPEDITION"
# ~265 - 390:
#   "MY DELEGATE ID" card
#   Left:
#     "MY DELEGATE ID"
#     "Your pass to STRIATUM 4.0"
#     "View Pass ->" (button)
#   Right:
#     3D floating card graphic with QR code, STRIATUM 4.0, IDEAS TRAVEL FURTHER HERE
# ~400 - 650:
#   2x3 grid of action cards:
#   Row 1: My Bookings | My Registrations
#   Row 2: Certificates | Schedule
#   Row 3: Personal Details | Settings
# ~660 - 785:
#   Quote section with Jellyfish:
#   Left: Glowing cyan/blue jellyfish
#   Middle:
#     "More than an event,"
#     "a shared current." (cyan)
#     "Thank you for being a part of STRIATUM 4.0."
#   Right:
#     SCIENCE
#     PEOPLE
#     POSSIBILITIES
#     BELOW
#     THE SURFACE
#     ---
# ~790 - 920:
#   Footer section:
#   Background: ocean seafloor with glowing light rays
#   Left:
#     "IDEAS TRAVEL FURTHER HERE."
#     ---
#   Right:
#     "STRIATUM 4.0" (4.0 in cyan)
#     "IGMCRI · SIGMA 2026"
# ~920 - 1024:
#   Bottom navigation bar:
#   Home, Explore, My Events, Profile (active cyan)
#   Home indicator pill

print("Slicing regions for detailed inspection...")

os.makedirs(r"c:\Users\gurug\Desktop\striatum\public\profile", exist_ok=True)

# Let's save crops to public/profile/ so we can inspect them and use clean artwork:
# 1. Avatar photo crop
# Circle avatar is roughly at x=24..116, y=102..194
avatar_crop = img.crop((24, 102, 116, 194))
avatar_crop.save(r"c:\Users\gurug\Desktop\striatum\public\profile\avatar_raw.png")

# 2. Hero background artwork (ocean + whale)
# Notice the whale is at x=280..473, y=60..280
hero_art = img.crop((0, 0, w, 280))
hero_art.save(r"c:\Users\gurug\Desktop\striatum\public\profile\hero_raw.png")

# 3. Delegate pass card graphic (the right side of MY DELEGATE ID card)
card_art = img.crop((290, 265, 450, 390))
card_art.save(r"c:\Users\gurug\Desktop\striatum\public\profile\card_pass_graphic.png")

# 4. Jellyfish graphic in quote section
jelly_crop = img.crop((15, 660, 160, 785))
jelly_crop.save(r"c:\Users\gurug\Desktop\striatum\public\profile\jellyfish_quote.png")

# 5. Footer ocean floor artwork
footer_art = img.crop((0, 785, w, 920))
footer_art.save(r"c:\Users\gurug\Desktop\striatum\public\profile\footer_ocean_raw.png")

print("Crops saved successfully!")
