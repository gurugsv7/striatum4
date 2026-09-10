import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from PIL import Image

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--window-size=1600,1200')

driver = webdriver.Chrome(options=opts)
try:
    driver.get('http://localhost:5173/profile')
    time.sleep(2)
    
    # 100% scale
    btn_100 = driver.find_element(By.ID, 'btn-scale-100')
    btn_100.click()
    time.sleep(1)
    
    phone_frame = driver.find_element(By.ID, 'mobile-phone-frame')
    phone_frame.screenshot('public/assets/profile/rendered_scaled_frame.png')
    
    elements = {
        'container': '.profile-screen-container',
        'hero': '.profile-hero-backdrop',
        'banner': '.profile-delegate-banner-card',
        'grid': '.profile-cards-grid',
        'card1': '#btn-card-bookings',
        'quote': '.profile-quote-section',
        'footer': '.profile-footer-seabed-backdrop',
        'nav': '#bottom-nav'
    }
    
    for name, sel in elements.items():
        el = driver.find_element(By.CSS_SELECTOR, sel)
        loc = el.location
        size = el.size
        print(f"{name:12s} ({sel}): y={loc['y']:.1f}, h={size['height']:.1f}, bottom={loc['y'] + size['height']:.1f}")

finally:
    driver.quit()

print("Measurements complete.")
