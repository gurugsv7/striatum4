import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--window-size=1600,1200')

driver = webdriver.Chrome(options=opts)
try:
    driver.get('http://localhost:5173/profile')
    time.sleep(2)
    
    # Click 100% scale button
    btn_100 = driver.find_element(By.ID, 'btn-scale-100')
    btn_100.click()
    time.sleep(1)
    
    phone_frame = driver.find_element(By.ID, 'mobile-phone-frame')
    phone_frame.screenshot('public/assets/profile/rendered_100pct_frame.png')
    print("Saved rendered_100pct_frame.png at 100% exact resolution")

finally:
    driver.quit()
