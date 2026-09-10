from PIL import Image

rendered = Image.open('public/assets/profile/rendered_scaled_frame.png')
print("Scaled frame size:", rendered.size)

# Crop the full mobile screen
rendered.save('public/assets/profile/scaled_profile_complete.png')
print("Saved scaled_profile_complete.png")
