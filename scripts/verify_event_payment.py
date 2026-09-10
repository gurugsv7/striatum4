import asyncio, json
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        await page.goto('http://localhost:5173', wait_until='networkidle')
        
        fake_state = {
            'version': 1,
            'cart': [],
            'orders': [{
                'id': 'ord-test-1',
                'reference': 'S4 / 0042',
                'lines': [{
                    'eventId': 'ev-quiz',
                    'eventName': 'Cerebral Vortex: Clinical Quiz',
                    'eventCode': 'S4-QZ01',
                    'context': 'Pre-Clinical & Clinical Diagnosis',
                    'category': 'academic',
                    'date': 'Day 2 · March 28',
                    'startTime': '10:00 AM',
                    'participation': 'team',
                    'unitPrice': 600,
                    'priceBasis': 'per team'
                }],
                'subtotal': 600,
                'discountAmount': 0,
                'discountRuleId': None,
                'discountLabel': None,
                'total': 600,
                'pricingPhase': 'Standard Phase',
                'status': 'awaiting_payment',
                'createdAt': 1740000000000
            }],
            'registrations': [],
            'delegate': None,
            'orderSeq': 42,
            'delegateSeq': 0
        }
        
        await page.evaluate("""(data) => {
            localStorage.setItem('striatum4.registration.v1', JSON.stringify(data));
        }""", fake_state)
        
        await page.reload(wait_until='networkidle')
        await page.wait_for_timeout(500)
        
        await page.click('#nav-to-my-events')
        await page.wait_for_timeout(500)
        
        pay_btn = await page.query_selector('button[id^="btn-order-pay-"]')
        if pay_btn:
            await pay_btn.click()
            await page.wait_for_timeout(500)
            print('Clicked pay button in my-events')
        else:
            print('pay_btn not found')
            
        phone = await page.wait_for_selector('#mobile-phone-frame')
        await phone.screenshot(path='scratch_event_payment_screen.png')
        print('Captured event payment screen to scratch_event_payment_screen.png')
        
        await browser.close()

asyncio.run(verify())
