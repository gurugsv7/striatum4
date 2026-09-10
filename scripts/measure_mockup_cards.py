from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
# Mockup size is 473 x 1024
# If scaled to 400 width: factor = 400 / 473 = 0.84566
# If scaled to 393 width: factor = 393 / 473 = 0.83086

# In original mockup:
# Let's find exact left and right of Card 1 and Card 2 in row 1:
# Row 1 is y=405 to 480
arr = np.array(img)
# Let's check card 1 left edge:
# Find border around x=20..30, y=440
for x in range(10, 50):
    r, g, b = arr[440, x, :3]
    if b > 40 and g > 30: # border
        pass

# Let's find card borders in profile_mockup:
print("Inspecting profile_mockup card positions at y=440:")
for x in range(img.width):
    r, g, b = arr[440, x, :3]
    if (b > 60 and g > 40 and r < 30) or (b > 100 and g > 100):
        # print first few
        pass

# Let's measure card 1: x_min, x_max, card 2: x_min, x_max
# Let's write a loop to find card 1 and card 2 bounds
y = 440
row = arr[y, :, :3]
# Card 1 background is around x=24..230
# Card 2 background is around x=244..450
print(f"Original mockup width={img.width}")
# In original mockup (w=473):
# Left margin to Card 1: x ≈ 24px -> 24 / 473 = 5.07%
# Card 1 right: x ≈ 230px -> 230 / 473 = 48.6%
# Gap: 244 - 230 = 14px -> 14 / 473 = 2.96%
# Card 2 left: x ≈ 244px -> 244 / 473 = 51.58%
# Card 2 right: x ≈ 450px -> 450 / 473 = 95.14%
# Right margin: 473 - 450 = 23px -> 23 / 473 = 4.86%

# At 393px width (iPhone 15 Pro):
# Left margin: 393 * 0.0507 ≈ 20px
# Right margin: 393 * 0.0486 ≈ 19px
# Gap: 393 * 0.0296 ≈ 11px
# Each card width: (393 - 20 - 19 - 11) / 2 = 343 / 2 = 171.5px!

# Now let's check what happened in the user's screenshot:
fb = Image.open(r"c:\Users\gurug\Desktop\striatum\user_feedback_screenshot.png")
print(f"User screenshot size={fb.size}")
# In user screenshot:
# Notice that Card 1 starts at x=32!
# But Card 2 ends at x=395+ (it extends PAST the right edge of the screen!)
# Why does Card 2 extend past the right edge?
