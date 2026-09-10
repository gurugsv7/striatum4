import os
from PIL import Image

rendered = Image.open('public/assets/profile/rendered_phone_frame.png')
mockup = Image.open('profile_mockup.png')

print("Rendered size:", rendered.size)
print("Mockup size:", mockup.size)

# Let's inspect rendered mobile direct as well
mob = Image.open('public/assets/profile/rendered_mobile_direct.png')
print("Mobile direct size:", mob.size)
