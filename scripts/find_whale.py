import os
from PIL import Image

# Let's inspect each reference JPG in the root
# Let's crop a small patch of the whale from profile_mockup:
# Whale is roughly at x=310..420, y=100..200
whale_patch = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png").crop((300, 110, 440, 210))
whale_patch.save(r"c:\Users\gurug\Desktop\striatum\public\assets\profile\whale_patch.png")

# Let's see if homepage.jpg or others have the whale
for name in ["homepage.jpg", "onboarding.jpg", "delegate_confirm.jpg", "delegate_payment.jpg", "event_details.jpg"]:
    p = os.path.join(r"c:\Users\gurug\Desktop\striatum", name)
    if os.path.exists(p):
        im = Image.open(p)
        print(f"{name}: size={im.size}")

print("Whale patch saved for inspection.")
