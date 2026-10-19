from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

output = Path(os.environ.get('CART_QA_OUTPUT', '.'))
output.mkdir(parents=True, exist_ok=True)
base = os.environ.get('CART_QA_URL', 'http://127.0.0.1:3107')
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height in [(320,740),(390,844),(844,390),(1440,1000)]:
        page = browser.new_page(viewport={'width':width,'height':height})
        page.goto(base+'/tests/cart-layout.html')
        page.wait_for_load_state('networkidle')
        page.wait_for_function('window.fixtureReady')
        button = page.locator('#btn-proceed-to-payment')
        assert button.is_enabled()
        assert page.locator('.cart-reg-complete').inner_text() == 'DETAILS COMPLETE ✓'
        button.click()
        assert button.is_disabled()
        # A second event while awaiting the server must not create another order.
        button.dispatch_event('click')
        error = page.locator('#cart-checkout-error')
        error.wait_for(state='visible')
        assert page.evaluate('window.checkoutCalls') == 1
        assert button.is_enabled()
        assert error.evaluate('(e)=>e===document.activeElement')
        assert error.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        error.scroll_into_view_if_needed()
        page.screenshot(path=str(output/f'cart-{width}.png'),full_page=True)
        page.goto(base+'/tests/cart-layout.html?invalid=1')
        page.wait_for_load_state('networkidle')
        page.wait_for_function('window.fixtureReady')
        assert page.locator('#btn-proceed-to-payment').is_disabled()
        assert page.locator('.cart-reg-incomplete').inner_text() == 'DETAILS NEED REVIEW'
        assert page.locator('[data-edit-registration]').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        results.append({'width':width,'height':height,'valid_cart':True,'invalid_cart_blocked':True,'long_error_wraps':True,'duplicate_click_blocked':True})
        page.close()
    browser.close()
print(json.dumps(results,indent=2))
