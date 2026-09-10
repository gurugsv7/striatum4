from PIL import Image

img = Image.open('public/assets/profile/rendered_100pct_frame.png')
cards_crop = img.crop((0, 390, img.width, 600))
cards_crop.save('public/assets/profile/inspect_cards_visual.png')
print("Saved inspect_cards_visual.png")
