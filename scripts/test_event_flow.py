import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        await page.goto('http://localhost:5173', wait_until='networkidle')
        await page.wait_for_timeout(500)
        
        # 1. Fill delegate registration so user has active delegate pass
        await page.click('#nav-to-delegate-registration')
        await page.wait_for_timeout(500)
        
        # Click Continue to Payment on Delegate Registration
        await page.click('#btn-delegate-submit')
        await page.wait_for_timeout(500)
        
        # On Delegate Payment, upload a fake proof screenshot or click submit
        # Let's set a delegate screenshot in state or upload
        await page.click('#btn-delegate-pay-back')
        await page.wait_for_timeout(300)
        
        # Let's directly test delegate payment view and screenshot
        await page.click('#nav-to-delegate-payment')
        await page.wait_for_timeout(500)
        phone = await page.wait_for_selector('#mobile-phone-frame')
        await phone.screenshot(path='scratch_final_delegate_payment.png')
        print('Captured scratch_final_delegate_payment.png')
        
        # Now let's test event payment view
        # We can set an order directly in localStorage and open it
        fake_state = {
            'version': 1,
            'cart': [],
            'orders': [{
                'id': 'ord-test-1',
                'reference': 'S4 / 0042',
                'lines': [{
                    'eventId': 's4-01',
                    'eventName': 'THE SONO EDGE',
                    'eventCode': 'S4 / 01',
                    'context': 'Ultrasound-Guided Anaesthesia',
                    'category': 'workshop',
                    'date': '15 OCT',
                    'startTime': '8:30 AM',
                    'participation': 'individual',
                    'unitPrice': 2500,
                    'priceBasis': 'per person'
                }],
                'subtotal': 2500,
                'discountAmount': 0,
                'discountRuleId': None,
                'discountLabel': None,
                'total': 2500,
                'pricingPhase': 'Standard Phase',
                'status': 'awaiting_payment',
                'createdAt': 1740000000000
            }],
            'registrations': [],
            'delegate': {
                'id': 'del-1',
                'delegateId': 'S4-DEL-001',
                'status': 'approved',
                'tier': 'aqualume',
                'amount': 500
            },
            'orderSeq': 42,
            'delegateSeq': 1
        }
        
        await page.evaluate("""(data) => {
            localStorage.setItem('striatum4.registration.v1', JSON.stringify(data));
        }""", fake_state)
        
        await page.reload(wait_until='networkidle')
        await page.wait_for_timeout(500)
        
        # Open payment for ord-test-1
        await page.evaluate("""() => {
            // Using window routing or hash
            window.history.pushState({}, '', '/payment');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }""")
        await page.wait_for_timeout(800)
        
        phone = await page.wait_for_selector('#mobile-phone-frame')
        await phone.screenshot(path='scratch_final_event_payment.png')
        print('Captured scratch_final_event_payment.png')
        
        await browser.close()

asyncio.run(verify())
