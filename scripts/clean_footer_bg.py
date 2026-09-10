import os
from PIL import Image
import numpy as np

mockup = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png").convert("RGBA")
w, h = mockup.size

footer = mockup.crop((0, 785, w, 925)).convert("RGB")
f_arr = np.array(footer)
fh, fw, _ = f_arr.shape

# In footer:
# Left text: "IDEAS TRAVEL FURTHER HERE." (x: 25..120, y: 40..85 in footer coords)
# Right text: "STRIATUM 4.0 / IGMCRI..." (x: 340..455, y: 45..85 in footer coords)
# Center has the underwater light rays hitting the seafloor (x: 180..300)
# Let's inpaint left text using bedrock texture from x: 10..24 or y: 90..110
for y in range(40, 85):
    for x in range(25, 120):
        r, g, b = f_arr[y, x]
        if r > 80 or g > 80 or b > 80:
            # sample from dark rock nearby
            f_arr[y, x] = f_arr[min(fh-1, y+35), x]

for y in range(40, 85):
    for x in range(340, 455):
        r, g, b = f_arr[y, x]
        if r > 80 or g > 80 or b > 80:
            f_arr[y, x] = f_arr[min(fh-1, y+35), x]

clean_footer = Image.fromarray(f_arr)
clean_footer.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\footer_clean_seabed.png")
print("Saved footer_clean_seabed.png")
