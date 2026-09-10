import os
from PIL import Image

root = r"c:\Users\gurug\Desktop\striatum"
for f in os.listdir(root):
    if f.endswith(('.jpg', '.png', '.webp')):
        p = os.path.join(root, f)
        im = Image.open(p)
        print(f"{f:30s} {im.size} {im.mode}")
