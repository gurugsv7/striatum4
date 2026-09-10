import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from PIL import Image

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--window-size=1200,1000')

driver = webdriver.Chrome(options=opts)
try:
    driver.get('http://localhost:5173/profile')
    time.sleep(2) # wait for fonts & images
    
    # 1. Capture the desktop workbench view (showing phone frame inside surround)
    driver.save_screenshot('public/assets/profile/rendered_desktop.png')
    print("Saved rendered_desktop.png")
    
    # 2. Capture the mobile phone frame element directly
    phone_frame = driver.find_element(By.ID, 'mobile-phone-frame')
    phone_frame.screenshot('public/assets/profile/rendered_phone_frame.png')
    print("Saved rendered_phone_frame.png")
    
    # 3. Also let's test mobile direct viewport (<= 500px width where phone fills the entire screen)
    driver.set_window_size(393, 852)
    time.sleep(1)
    driver.save_screenshot('public/assets/profile/rendered_mobile_direct.png')
    print("Saved rendered_mobile_direct.png")

finally:
    driver.quit()

print("Capture finished successfully.")
