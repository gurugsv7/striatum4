import os
from PIL import Image

image_path = r"C:/Users/gurug/.gemini/antigravity-ide/brain/19b466cd-8e3a-451c-a67f-aecc42729fb3/.user_uploaded/media_1789011961070.png"

img = Image.open(image_path)
print(f"Image format: {img.format}, size: {img.size}, mode: {img.mode}")
width, height = img.size

# Let's save a copy in the workspace as profile_mockup.png for easy reference
dest_path = r"c:\Users\gurug\Desktop\striatum\profile_mockup.png"
img.save(dest_path)
print(f"Saved copy to {dest_path}")
