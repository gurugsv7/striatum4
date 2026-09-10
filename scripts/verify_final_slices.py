from PIL import Image
import numpy as np

img = Image.open('public/assets/profile/rendered_100pct_frame.png')
print("Frame resolution:", img.size)

# Let's crop the entire screen into sections to verify:
# 1. Top hero section
# 2. My Delegate ID banner
# 3. 6 Cards Grid
# 4. Quote section
# 5. Footer & Bottom nav

hero = img.crop((0, 0, img.width, 260))
hero.save('public/assets/profile/final_hero.png')

banner = img.crop((0, 250, img.width, 390))
banner.save('public/assets/profile/final_banner.png')

cards = img.crop((0, 385, img.width, 600))
cards.save('public/assets/profile/final_cards.png')

quote = img.crop((0, 595, img.width, 720))
quote.save('public/assets/profile/final_quote.png')

footer = img.crop((0, 715, img.width, 852))
footer.save('public/assets/profile/final_footer.png')

print("All slices saved cleanly for verification.")
