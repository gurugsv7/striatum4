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
    
    for id_name in ['btn-card-bookings', 'btn-card-registrations', 'btn-card-certificates', 'btn-card-schedule']:
        el = driver.find_element(By.ID, id_name)
        rect = el.rect
        print(f"{id_name}: x={rect['x']}, y={rect['y']}, w={rect['width']}, h={rect['height']}")

finally:
    driver.quit()
