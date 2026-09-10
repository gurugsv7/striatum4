from PIL import Image

rendered = Image.open('public/assets/profile/rendered_phone_frame.png')
print("Rendered size:", rendered.size)

# Let's crop the cards area from rendered_phone_frame:
# Frame width is 393, height is 852 (or high-dpi)
w, h = rendered.size
scale = w / 393.0
print("Scale:", scale)

# Cards are around y = 390 to 600 in CSS pixels
cards_crop = rendered.crop((int(15 * scale), int(380 * scale), int(378 * scale), int(610 * scale)))
cards_crop.save('public/assets/profile/cards_after_fix.png')
print("Saved cards_after_fix.png")
