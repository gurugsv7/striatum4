from PIL import Image

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
# Crop card 1: x: 22 to 230, y: 405 to 480
card1 = img.crop((22, 405, 230, 480))
card1.save(r"c:\Users\gurug\Desktop\striatum\mockup_card1.png")
card2 = img.crop((243, 405, 451, 480))
card2.save(r"c:\Users\gurug\Desktop\striatum\mockup_card2.png")
print("Saved mockup_card1.png and mockup_card2.png")
