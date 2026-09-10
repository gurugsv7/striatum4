import os
from PIL import Image

public_dir = r"c:\Users\gurug\Desktop\striatum\public"
for f in sorted(os.listdir(public_dir)):
    if f.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        p = os.path.join(public_dir, f)
        try:
            im = Image.open(p)
            print(f"{f:30s} {im.size} {im.mode}")
        except Exception as e:
            print(f"{f:30s} Error: {e}")
