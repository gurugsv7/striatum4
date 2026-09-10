import os
from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\gurug\Desktop\striatum\profile_mockup.png")
w, h = img.size
print(f"Dimensions: width={w}, height={h}")

# Let's inspect vertical regions:
# Top bar:
# 0 to ~50: Phone status bar (9:41, wifi, battery) -> "Separate device chrome from application UI; do not reproduce an iPhone status bar as web content unless explicitly requested."
# Header:
# STRIATUM 4.0 (left), IGMCRi · SIGMA 2026 (below it)
# Right: PEOPLE / SCIENCE / A DEEPER / TOMORROW with line under it
# Avatar & Greeting:
# Circle avatar with edit pencil badge
# "Hello," / "Guru." (with cyan dot)
# "Delegate" / "IGMCRI"
# "Same curiosity. A deeper tomorrow."
# Right side: swimming whale / marine life in deep water
# S4 / 01 (cyan dot next to it), "A SMALL PART OF A LARGER EXPEDITION"
#
# Card 1: MY DELEGATE ID
# "MY DELEGATE ID"
# "Your pass to STRIATUM 4.0"
# "View Pass ->" (pill button with border and arrow)
# Right side of card: 3D-ish card graphic with STRIATUM 4.0, IDEAS TRAVEL FURTHER HERE, QR code
#
# 2x3 Grid of Feature Cards:
# 1. My Bookings (Calendar icon) / Events, workshops, competitions ->
# 2. My Registrations (Document icon) / View and manage ->
# 3. Certificates (Star icon) / Download your certificates ->
# 4. Schedule (Clock icon) / Your personalised plan ->
# 5. Personal Details (User icon) / View or edit your information ->
# 6. Settings (Gear icon) / Preferences & app settings ->
#
# Bottom Banner / Quote Section:
# Neon glowing jellyfish on left
# "More than an event,"
# "a shared current." (cyan)
# "Thank you for being a part of STRIATUM 4.0."
# Right side:
# SCIENCE
# PEOPLE
# POSSIBILITIES
# BELOW
# THE SURFACE
# Underline
#
# Below that / Footer artwork:
# Deep ocean seafloor / trench with light rays
# Left: IDEAS TRAVEL FURTHER HERE. with underline
# Right: STRIATUM 4.0 (cyan 4.0), IGMCRi · SIGMA 2026
#
# Bottom Navigation Bar:
# Home (house icon)
# Explore (compass icon)
# My Events (calendar icon)
# Profile (user icon - active with cyan highlight)
# Home indicator bar (white horizontal pill at very bottom)

print("Analysis complete.")
