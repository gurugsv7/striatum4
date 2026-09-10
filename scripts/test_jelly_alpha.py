import os
from PIL import Image
import numpy as np

jelly = Image.open(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\jellyfish_glowing.png")
arr = np.array(jelly)
print("Jelly shape:", arr.shape)
print("Min alpha:", arr[:, :, 3].min(), "Max alpha:", arr[:, :, 3].max())
