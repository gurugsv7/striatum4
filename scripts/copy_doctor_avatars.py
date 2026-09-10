import shutil
import os
from PIL import Image

src_female = r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\female_doctor_1789028373770.jpg"
src_male = r"C:\Users\gurug\.gemini\antigravity-ide\brain\19b466cd-8e3a-451c-a67f-aecc42729fb3\male_doctor_1789028646607.jpg"

dest_female = r"c:\Users\gurug\Desktop\striatum\public\assets\profile\avatar_doctor_female.jpg"
dest_male = r"c:\Users\gurug\Desktop\striatum\public\assets\profile\avatar_doctor_male.jpg"

# Resize to standard avatar 400x400 for high density and fast loading
im_f = Image.open(src_female)
im_f.resize((400, 400), Image.Resampling.LANCZOS).save(dest_female, quality=92)

im_m = Image.open(src_male)
im_m.resize((400, 400), Image.Resampling.LANCZOS).save(dest_male, quality=92)

print("Saved avatar_doctor_female.jpg and avatar_doctor_male.jpg")
