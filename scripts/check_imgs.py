import os
from PIL import Image

for name in ["homepage.jpg", "onboarding.jpg", "delegate_confirm.jpg", "delegate_payment.jpg", "event_details.jpg", "explore_edits.jpg"]:
    p = os.path.join(r"c:\Users\gurug\Desktop\striatum", name)
    im = Image.open(p)
    print(f"{name} format={im.format} size={im.size}")
