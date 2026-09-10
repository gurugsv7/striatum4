import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless')
opts.add_argument('--window-size=1200,1000')

driver = webdriver.Chrome(options=opts)
try:
    driver.get('http://localhost:5173/profile')
    time.sleep(2)
    
    # Let's inspect the bounding box of:
    # 1. #mobile-phone-frame
    # 2. .app-viewport-wrapper
    # 3. .profile-screen-container
    # 4. .profile-banner-section
    # 5. .profile-cards-section
    # 6. .profile-cards-grid
    # 7. #btn-card-bookings
    # 8. #btn-card-registrations
    
    elements = {
        'frame': '#mobile-phone-frame',
        'scroller': '#viewport-scroller',
        'container': '.profile-screen-container',
        'banner_sec': '.profile-banner-section',
        'banner_card': '.profile-delegate-banner-card',
        'cards_sec': '.profile-cards-section',
        'grid': '.profile-cards-grid',
        'card1': '#btn-card-bookings',
        'card2': '#btn-card-registrations',
    }
    
    for name, sel in elements.items():
        el = driver.find_element(By.CSS_SELECTOR, sel)
        loc = el.location
        size = el.size
        rect = el.rect
        print(f"{name:12s} ({sel}): x={loc['x']:.1f}, y={loc['y']:.1f}, w={size['width']:.1f}, h={size['height']:.1f}")

finally:
    driver.quit()
