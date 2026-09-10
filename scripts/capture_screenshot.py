import os
import asyncio
from playwright.async_api import async_playwright

async def capture():
    async with async_playwright() as p:
        # Launch Chromium
        browser = await p.chromium.launch(headless=True)
        # iPhone 15 Pro viewport: 393 x 852 or matching device width
        # The mockup has width 473 x 1024, or standard mobile viewport
        # Let's test standard mobile viewport first, and also full page
        context = await browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()
        # Navigate to profile view
        await page.goto("http://localhost:5173/profile", wait_until="networkidle")
        # Wait a moment for fonts and images to load
        await page.wait_for_timeout(1000)
        
        # Take screenshot of the phone frame or page
        # In DesktopSurround, on desktop it renders phone inside desktop workbench,
        # but on mobile width <= 500px, main.css renders just the phone frame!
        # Let's capture the phone frame directly:
        frame = await page.query_selector("#mobile-phone-frame")
        if frame:
            await frame.screenshot(path="public/assets/profile/captured_phone_frame.png")
            print("Captured #mobile-phone-frame screenshot")
        else:
            await page.screenshot(path="public/assets/profile/captured_full_page.png")
            print("Captured full page screenshot")
            
        await browser.close()

asyncio.run(capture())
