"""Browser integration against intercepted Supabase responses; never uses live data.
Run with tests/round-two-dev.mjs serving port 5187. Screenshots are ignored.
"""
import base64
import json
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

OWNER = '10000000-0000-4000-8000-000000000001'
FINANCE = '10000000-0000-4000-8000-000000000003'
EVENT_ADMIN = '10000000-0000-4000-8000-000000000004'
REG = '20000000-0000-4000-8000-000000000001'
ORDER = '30000000-0000-4000-8000-000000000001'
ENTRY = '40000000-0000-4000-8000-000000000001'
NOW = '2026-10-26T00:00:00Z'
shotdir = Path('tests/round-two-screenshots')
shotdir.mkdir(exist_ok=True)

class Backend:
    def __init__(self, existing=True):
        self.user = OWNER
        self.entries = []
        self.calls = []
        self.orders = []
        self.registrations = []
        self.participants = []
        if existing:
            self.anchor()
    def anchor(self):
        self.orders = [dict(id=ORDER, user_id=OWNER, reference='S4 / 0099', subtotal=0, total=0,
            discount_amount=0, status='approved', pricing_phase='early', created_at=NOW,
            order_lines=[dict(id=str(uuid.uuid4()), event_id='s4-16', event_name='CORAL CANVAS',
                event_code='S4 / 16', context='Poster Presentation', category='presentation',
                participation='individual', quantity=1, unit_price=0, abstract_name='Round 1.pdf',
                abstract_path='historical/Round1.pdf')])]
        self.registrations = [dict(id=REG, user_id=OWNER, order_id=ORDER, event_id='s4-16',
            participation='individual', team_index=1, confirmed_at=NOW)]
        self.participants = [dict(order_id=ORDER,event_id='s4-16',team_index=1,position=1,
            role='captain',name='Synthetic Participant',college='Test College',phone='9999999999',email='fixture@example.test')]
    def respond(self, route):
        request=route.request
        path=urlparse(request.url).path
        if request.method=='OPTIONS':
            route.fulfill(status=200,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'})
            return
        body=request.post_data_json if request.method=='POST' and 'application/json' in request.headers.get('content-type','') else None
        self.calls.append((path,body))
        result=[]
        if '/rest/v1/rpc/' in path:
            name=path.rsplit('/',1)[-1]
            if name=='is_admin': result=self.user in [FINANCE,EVENT_ADMIN]
            elif name=='is_finance_admin': result=self.user==FINANCE
            elif name=='event_seats_taken': result=1
            elif name=='event_seats_available': result=None
            elif name=='round_two_roster': result=[dict(entry_id=e['id'],name='Synthetic Participant',college='Test College',email='fixture@example.test',team_index=1) for e in self.entries]
            elif name=='start_round_two':
                if not self.registrations: self.anchor()
                e=dict(id=ENTRY,registration_id=REG,user_id=OWNER,event_id='s4-16',fee=300,
                    payment_status='draft',submission_status='draft',created_at=NOW,round_two_attempts=[])
                self.entries=[e]
                result=[e]  # PostgREST may return a singleton composite as an array.
            elif name=='submit_round_two':
                e=self.entries[0]
                a=dict(id=str(uuid.uuid4()), entry_id=ENTRY,attempt_number=len(e['round_two_attempts'])+1,
                    abstract_path=body['p_abstract_path'],abstract_name=body['p_abstract_name'],
                    proof_path=body['p_proof_path'],submitted_at=NOW,payment_status='under_review',submission_status='under_review',
                    payment_reason=None,submission_reason=None)
                e['round_two_attempts'].append(a)
                e['payment_status']=e['submission_status']='under_review'
                result=None
            elif name=='review_round_two':
                e=self.entries[0]; a=e['round_two_attempts'][-1]; kind=body['p_kind']
                a[kind+'_status']=e[kind+'_status']='approved' if body['p_approve'] else 'rejected'
                a[kind+'_reason']=body['p_reason'] if not body['p_approve'] else None
                result=None
        elif '/rest/v1/' in path:
            table=path.rsplit('/',1)[-1]
            result={'orders':self.orders if self.user!=EVENT_ADMIN else [],
                'registrations':self.registrations if self.user!=EVENT_ADMIN else [],
                'order_line_participants':self.participants if self.user!=EVENT_ADMIN else [],
                'events':[dict(id='s4-16',slots=None)],'round_two_entries':self.entries}.get(table,[])
        elif '/storage/v1/object/sign/' in path:
            result={'signedURL':'/object/synthetic-file.pdf'}
        elif '/storage/v1/object/' in path:
            result={'Key':path.split('/object/',1)[1]}
        elif '/auth/v1/user' in path:
            result=dict(id=self.user,email='fixture@example.test',user_metadata={})
        route.fulfill(status=200,body=json.dumps(result),content_type='application/json',headers={'access-control-allow-origin':'*'})

def session(page, uid):
    payload=base64.urlsafe_b64encode(json.dumps({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'}).encode()).decode().rstrip('=')
    token='eyJhbGciOiJIUzI1NiJ9.'+payload+'.synthetic'
    value=dict(access_token=token,refresh_token='synthetic',token_type='bearer',expires_at=int(time.time())+3600,
        user=dict(id=uid,email='fixture@example.test',aud='authenticated',role='authenticated',user_metadata={}))
    page.add_init_script("localStorage.setItem('sb-127-auth-token',"+json.dumps(json.dumps(value))+");")

def visit(context, backend, uid, path):
    backend.user=uid
    page=context.new_page()
    page.route('http://127.0.0.1:54444/**',backend.respond)
    session(page,uid)
    page.goto('http://127.0.0.1:5187'+path)
    page.wait_for_load_state('networkidle')
    return page

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [390,1440]:
        context=browser.new_context(viewport={'width':width,'height':920})
        backend=Backend()
        page=visit(context,backend,OWNER,'/my-events')
        expect(page.get_by_role('button',name='CONTINUE TO ROUND 2')).to_be_visible()
        page.get_by_role('button',name='CONTINUE TO ROUND 2').click()
        form=page.locator('[data-r2-submit]')
        expect(form).to_be_visible()
        expect(form).to_contain_text('₹300')
        expect(form).to_contain_text('sigmapy@iob')
        page.screenshot(path=str(shotdir/f'hub-{width}.png'),full_page=True)
        form.locator('[name="abstract"]').set_input_files({'name':'Round2.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 synthetic abstract'})
        form.locator('[name="payment"]').set_input_files({'name':'Proof.png','mimeType':'image/png','buffer':b'synthetic screenshot'})
        # An app refresh must keep the selected files in memory.
        page.evaluate("async()=>{const {appStore}=await import('/src/state/appStore.ts');appStore.refresh()}")
        expect(page.locator('[data-r2-submit]')).to_contain_text('Selected: Round2.pdf')
        page.get_by_role('button',name='SUBMIT ROUND 2 FOR REVIEW').click()
        expect(page.locator('[data-r2-entry]')).to_contain_text('PAYMENT: UNDER REVIEW')
        assert len([x for x in backend.calls if x[0].endswith('/submit_round_two')])==1
        page.reload(); page.wait_for_load_state('networkidle')
        expect(page.locator('[data-r2-entry]')).to_contain_text('ABSTRACT: UNDER REVIEW')
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Horizontal overflow'
        page.close()
        finance=visit(context,backend,FINANCE,'/admin')
        expect(finance.get_by_role('region',name='Round 2 payment review')).to_be_visible()
        finance.get_by_role('button',name='APPROVE PAYMENT',exact=True).click()
        expect(finance.get_by_role('region',name='Round 2 payment review')).to_contain_text('APPROVED')
        finance.close()
        admin=visit(context,backend,EVENT_ADMIN,'/admin/registrations')
        expect(admin.get_by_role('region',name='Round 2 submission review')).to_be_visible()
        expect(admin.get_by_role('region',name='Round 2 submission review')).to_contain_text('Synthetic Participant')
        expect(admin.get_by_role('button',name='VIEW PAYMENT PROOF')).to_have_count(0)
        admin.get_by_role('button',name='REQUEST CORRECTION',exact=True).click()
        expect(admin.locator('.r2-error')).to_contain_text('Enter a reason')
        admin.locator('[name="reason"]').fill('Add the methods section.')
        admin.get_by_role('button',name='REQUEST CORRECTION',exact=True).click()
        expect(admin.get_by_role('region',name='Round 2 submission review')).to_contain_text('REJECTED')
        admin.close()
        owner=visit(context,backend,OWNER,'/my-events')
        expect(owner.locator('[data-r2-entry]')).to_contain_text('No further payment is required')
        expect(owner.locator('[name="payment"]')).to_have_count(0)
        expect(owner.locator('[data-r2-entry]')).to_contain_text('Add the methods section.')
        owner.close()
        context.close()
        print(f'PASS {width}px: existing registration, fee, uploads, refresh, finance approval, organiser rejection, payment retained')
    context=browser.new_context(viewport={'width':390,'height':920})
    backend=Backend(existing=False)
    page=visit(context,backend,OWNER,'/event/s4-16')
    expect(page.get_by_role('button',name='REGISTER FOR ROUND 2')).to_be_visible()
    page.get_by_role('button',name='REGISTER FOR ROUND 2').click()
    expect(page.get_by_role('button',name='CONTINUE TO ROUND 2',exact=True)).to_be_visible()
    fields=page.locator('[data-reg-field]')
    for i in range(fields.count()):
        field=fields.nth(i); key=field.get_attribute('data-reg-field')
        if field.evaluate('(el)=>el.tagName')=='SELECT':
            values=field.locator('option').evaluate_all('(options)=>options.map(o=>o.value).filter(Boolean)')
            field.select_option(values[0])
        else: field.fill({'name':'New Participant','college':'Test College','phone':'9999999999','email':'fixture@example.test'}.get(key,'2024'))
    page.get_by_role('button',name='CONTINUE TO ROUND 2',exact=True).click()
    expect(page.locator('[data-r2-submit]')).to_be_visible()
    start=[body for path,body in backend.calls if path.endswith('/start_round_two')][0]
    assert start['p_registration_id'] is None
    assert start['p_team']['participants'][0]['name']=='New Participant'
    assert not any(path.endswith('/create_order') for path,_ in backend.calls)
    context.close()
    browser.close()
    print('PASS new participant: event page, roster form, dedicated Round 2 RPC, fee/upload hub')

