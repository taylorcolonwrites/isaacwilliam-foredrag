import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const dir=mkdtempSync(join(tmpdir(),'iw-tests-')),password=randomBytes(32).toString('hex');let child,base,cookie,csrf,content;
async function start(overrides={}){child=spawn(process.execPath,['server/index.mjs'],{cwd:resolve('.'),env:{...process.env,PORT:'0',HOST:'127.0.0.1',DATA_DIR:dir,ADMIN_PASSWORD:password,PUBLIC_ORIGIN:'',BOOKING_ENABLED:'true',NODE_ENV:'test',EMAIL_ENABLED:'false',CLIENT_PORTAL_ENABLED:'true',...overrides},stdio:['ignore','pipe','pipe']});base=await new Promise((yes,no)=>{child.stdout.on('data',c=>{let m=String(c).match(/port (\d+)/);if(m)yes('http://127.0.0.1:'+m[1]);});child.on('exit',c=>no(Error('Server exited '+c)));child.on('error',no);});}
async function stop(){await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
async function request(path,method='GET',b,authenticated=true,extra={}){return fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:base,...(authenticated?{Cookie:cookie||'','X-CSRF-Token':csrf||''}:{}),...extra},body:b===undefined?undefined:JSON.stringify(b),redirect:'manual'});}
async function login(){let r=await request('/api/login','POST',{password},false);assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];csrf=(await r.json()).csrf;}
before(start);after(async()=>{await stop();rmSync(dir,{recursive:true,force:true});});
test('complete private booking and content workflow',async()=>{
 let r=await request('/api/admin/enquiries','GET',undefined,false);assert.equal(r.status,401);
 r=await request('/api/owner-access','GET',undefined,false);assert.deepEqual(await r.json(),{signedIn:false});
 for(const path of ['/api/admin/export','/api/session'])assert.equal((await request(path,'GET',undefined,false)).status,401);
 r=await request('/api/login','POST',{password:'incorrect'},false);assert.equal(r.status,401);
 r=await request('/api/enquiries','POST',{},false);assert.equal(r.status,503);
 await login();
 r=await request('/api/owner-access');assert.deepEqual(await r.json(),{signedIn:true});
 content=await(await request('/api/content')).json();assert.equal(Object.keys(content.pages).length,8);assert.equal(content.bookingAvailable,false);
 let invalid=structuredClone(content);invalid.pages.home.sections[0].links[0].href='javascript:alert(1)';
 r=await request('/api/admin/content','PUT',{revision:content.revision,content:invalid});assert.equal(r.status,400);
 content.settings.bookingEnabled=true;
 r=await request('/api/admin/content','PUT',{revision:content.revision,content},true, {'X-CSRF-Token':'wrong'});assert.equal(r.status,403);
 r=await request('/api/admin/content','PUT',{revision:content.revision,content});assert.equal(r.status,200);content.revision=(await r.json()).revision;
 r=await request('/api/admin/content','PUT',{revision:1,content});assert.equal(r.status,409);

 // Server-rendered text and metadata are present without running JavaScript.
 r=await request('/about','GET',undefined,false);let html=await r.text();
 assert.match(html,/<title>Om Isaac William Tufte Lunde \| Isaac William Lunde<\/title>/);
 assert.match(html,/Erfaringer som gir rom for samtale/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.doesNotMatch(html,/<a href="\/min-side">/);
 r=await request('/','GET',undefined,true);assert.match(await r.text(),/<a href="\/min-side">Mitt kontrollpanel<\/a>/);
 const malicious=structuredClone(content);malicious.settings.name='Example $& </title><script>alert(1)</script>';
 r=await request('/api/admin/content','PUT',{revision:content.revision,content:malicious});assert.equal(r.status,200);content.revision=(await r.json()).revision;
 r=await request('/','GET',undefined,false);html=await r.text();assert.ok(html.includes('Example $&amp; &lt;/title&gt;&lt;script&gt;'));assert.ok(!html.includes('</title><script>alert(1)</script>'));assert.ok(html.includes('\\u003c/script>'));
 r=await request('/api/admin/content','PUT',{revision:content.revision,content});assert.equal(r.status,200);content.revision=(await r.json()).revision;
 const sample={returningClient:true,invoiceEmail:'invoice@example.invalid',organisationNumber:'123 456 789',invoiceReference:'REF-TEST',type:'booking',name:'Testperson',email:'test@example.invalid',organisation:'Testarrangør',organisationType:'Skole',topic:'Autisme',format:'Foredrag',audience:'Ansatte',location:'Digitalt',date:'2099-05-20',time:'12:30',participants:'50',message:'Dette er en automatisert test.',consent:true};
 r=await request('/api/enquiries','POST',sample,false,{Origin:'https://untrusted.invalid'});assert.equal(r.status,403);
 r=await request('/api/enquiries','POST',{...sample,email:'invalid'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',{...sample,date:'2099-99-99'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',{...sample,date:'2099-02-30'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',{...sample,date:'2000-01-01'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',{...sample,invoiceEmail:'invalid'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',{...sample,organisationNumber:'123'},false);assert.equal(r.status,400);
 r=await request('/api/enquiries','POST',sample,false);assert.equal(r.status,201);const receipt=await r.json();let id=receipt.id;let portalToken=receipt.portalToken;assert.match(portalToken,/^[a-f0-9]{64}$/);
 r=await request('/api/enquiries','POST',sample,false);assert.equal(r.status,201);const otherReceipt=await r.json();let duplicateId=otherReceipt.id;const otherToken=otherReceipt.portalToken;
 let overview=await(await request('/api/admin/enquiries')).json();assert.equal(overview.enquiries.length,2);assert.equal(overview.enquiries[0].payload.name,'Testperson');const saved=overview.enquiries.find(e=>e.id===id).payload;assert.equal(saved.invoiceEmail,'invoice@example.invalid');assert.equal(saved.organisationNumber,'123456789');assert.equal(saved.invoiceReference,'REF-TEST');assert.equal(saved.returningClient,true);
 r=await request('/api/content','GET',undefined,false);assert.ok(!JSON.stringify(await r.json()).includes('invoice@example.invalid'));
 r=await request('/api/availability?from=2099-05-20&to=2099-05-20', 'GET',undefined,false);assert.deepEqual((await r.json()).unavailable,[]);
 r=await request('/api/admin/enquiries/'+id,'PATCH',{version:1,status:'Bekreftet',quote:2500,notes:'Testnotat'});assert.equal(r.status,200);
 // Each receipt is a private capability, independent of accounts and email.
 const portal=(method='GET',body,token=portalToken,extra={})=>request('/api/enquiry-page',method,body,false,{Authorization:'Bearer '+token,...extra});
 assert.equal((await request('/api/enquiry-page','GET',undefined,false)).status,401);
 assert.equal((await portal('GET',undefined,'0'.repeat(64))).status,401);
 assert.equal((await portal('GET',undefined,id)).status,401);
 r=await portal();assert.equal(r.status,200);let privatePage=await r.json();assert.equal(privatePage.id,id);assert.equal(privatePage.status,'Bekreftet');assert.ok(!JSON.stringify(privatePage).includes('Testnotat'));assert.ok(!('quote' in privatePage));assert.ok(!('invoiceEmail' in privatePage.enquiry));
 r=await portal('POST',{message:'Test fra arrangør' },portalToken,{Origin:'https://untrusted.invalid'});assert.equal(r.status,403);
 r=await portal('POST',{message:''});assert.equal(r.status,400);
 r=await portal('POST',{message:'Kan vi starte klokken 13?',author:'isaac',enquiry_id:duplicateId});assert.equal(r.status,201);
 r=await request('/api/admin/enquiries');let conversation=(await r.json()).enquiries.find(e=>e.id===id).messages;assert.equal(conversation[0].author,'arrangor');assert.equal(conversation[0].seen,0);
 r=await request('/api/admin/enquiries/'+id+'/messages','POST',{message:'Hei, det passer. <script>test</script>'},true,{'X-CSRF-Token':'wrong'});assert.equal(r.status,403);
 r=await request('/api/admin/enquiries/'+id+'/messages','POST',{message:'Hei, det passer. <script>test</script>'});assert.equal(r.status,201);
 r=await request('/api/admin/enquiries/'+id+'/read','POST',{ids:conversation.map(m=>m.id)});assert.equal(r.status,200);
 r=await portal();privatePage=await r.json();assert.equal(privatePage.messages.length,2);assert.equal(privatePage.messages[1].author,'isaac');
 assert.equal((await (await portal('GET',undefined,otherToken)).json()).messages.length,0);
 r=await request('/api/admin/enquiries');assert.equal((await r.json()).enquiries.find(e=>e.id===id).messages[0].seen,1);
 r=await request('/api/admin/enquiries/'+id+'/access','POST',{});assert.equal(r.status,201);const renewed=await r.json();assert.notEqual(renewed.token,portalToken);assert.equal((await portal()).status,401);portalToken=renewed.token;assert.equal((await portal()).status,200);const inspectDb=new DatabaseSync(join(dir,'site.sqlite'));const storedAccess=inspectDb.prepare('SELECT hash FROM enquiry_access WHERE enquiry_id=?').get(id);assert.notEqual(storedAccess.hash,portalToken);inspectDb.prepare('UPDATE enquiry_access SET expires=0 WHERE enquiry_id=?').run(id);inspectDb.close();assert.equal((await portal()).status,401);r=await request('/api/admin/enquiries/'+id+'/access','POST',{});portalToken=(await r.json()).token;
 assert.equal((await request('/api/admin/enquiries/'+id+'/messages','POST',{message:'Not allowed'},false)).status,401);
 r=await request('/foresporsel','GET',undefined,false);assert.equal(r.status,200);assert.equal(r.headers.get('referrer-policy'),'no-referrer');assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(!(await r.text()).includes('Kan vi starte klokken 13?'));
 r=await request('/api/availability?from=2099-05-20&to=2099-05-20','GET',undefined,false);let avail=await r.json();assert.equal(avail.unavailable.length,1);assert.equal(JSON.stringify(avail).includes('Testperson'),false);
 r=await request('/api/admin/enquiries/'+duplicateId,'PATCH',{version:1,status:'Bekreftet',quote:2500,notes:''});assert.equal(r.status,409);
 r=await request('/api/enquiries','POST',sample,false);assert.equal(r.status,409);
 r=await request('/api/admin/blocks','POST',{start:'2099-05-20',end:'2099-05-21',label:'Test'});assert.equal(r.status,409);
 r=await request('/api/admin/blocks','POST',{start:'2099-06-01',end:'2099-06-03',label:'Privat'});assert.equal(r.status,201);let block=(await r.json()).id;
 r=await request('/api/admin/blocks/'+block,'DELETE',{});assert.equal(r.status,200);
 // Make another unconfirmed request, then confirm atomically against the occupied date.
 { r=await request('/api/enquiries','POST',{...sample,date:'2099-05-21'},false);assert.equal(r.status,201); }
 r=await request('/api/admin/enquiries/'+id,'PATCH',{version:1,status:'Gjennomført',quote:2500,notes:''});assert.equal(r.status,409);
 r=await request('/api/admin/uploads','POST',{data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')});assert.equal(r.status,400);
 r=await request('/api/admin/export');assert.equal(r.status,200);assert.equal((await r.json()).settings.email,'post@isaacwilliam.no');
 await stop();await start();await login();overview=await(await request('/api/admin/enquiries')).json();assert.equal(overview.enquiries.length,3);assert.equal(overview.enquiries.find(e=>e.id===id).status,'Bekreftet');
 assert.equal((await portal()).status,200);assert.equal((await (await portal()).json()).messages.length,2);
 r=await request('/api/admin/enquiries/'+id,'DELETE',{});assert.equal(r.status,200);assert.equal((await portal()).status,401);
 r=await request('/api/availability?from=2099-05-20&to=2099-05-20');assert.equal((await r.json()).unavailable.length,0);
 r=await request('/api/logout','POST',{});assert.equal(r.status,200);r=await request('/api/admin/enquiries');assert.equal(r.status,401);
 // Changing the owner password invalidates old persisted sessions; removing it cannot expose data.
 await login();const oldCookie=cookie;
 await stop();await start({ADMIN_PASSWORD:randomBytes(32).toString('hex')});
 r=await request('/api/admin/enquiries');assert.equal(r.status,401);
 await stop();await start({ADMIN_PASSWORD:''});cookie=oldCookie;
 r=await request('/api/admin/enquiries');assert.equal(r.status,401);

});
test('all pages and local assets are served securely; reviews are anonymous and unique',async()=>{
 for(let path of ['/','/about','/topics','/booking','/contact','/pricing-and-services','/faq','/testimonials','/personvern','/admin','/min-side']){
  let r=await request(path,'GET',undefined,false);assert.equal(r.status,200,path);assert.match(r.headers.get('content-type'),/text\/html/);assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 }
 for(let path of ['/content/site.json','/runtime/site.sqlite','/.env','/server/index.mjs','/missing-page','/__qa/dashboard','/__qa/mobile'])assert.equal((await request(path)).status,404,path);
 const c=JSON.parse(readFileSync('content/site.json'));
 const texts=[];for(let s of c.pages.testimonials.sections)for(let i of s.items){texts.push(i.text);assert.ok(['FAU-leder','Rektor','Rådgiver','Ansatt','Daglig leder','Deltaker','Lærer','Skolepsykolog','Ungdomskonsulent','Arrangementskoordinator','Skolerådgiver'].includes(i.title));assert.ok(['','Ungdomsskole','Videregående skole','Bibliotek','Ungdomsklubb','Åpent arrangement','Skole','Kommune','Frivillig organisasjon'].includes(i.caption));}
 assert.equal(texts.length,13);assert.equal(new Set(texts).size,texts.length);
 for(let p of Object.values(c.pages))for(let s of p.sections){for(let im of s.images){assert.ok(existsSync('public'+im.src),im.src);assert.equal((await request(im.src)).status,200);}for(let item of s.items)assert.ok(item.text.trim());}
});

test('email-first mode keeps owner data private and does not issue client links or require an account',async()=>{
 await stop();await start({DATA_DIR:join(dir,'email-first'),CLIENT_PORTAL_ENABLED:'false'});await login();let c=await(await request('/api/content')).json();assert.equal(c.clientPortalAvailable,false);c.settings.bookingEnabled=true;let r=await request('/api/admin/content','PUT',{revision:c.revision,content:c});assert.equal(r.status,200);
 r=await request('/api/enquiries','POST',{type:'booking',name:'Testperson',email:'client@example.invalid',organisation:'Testarrangør',organisationType:'Skole',topic:'Autisme',format:'Foredrag',audience:'Foresatte',date:'2099-05-21',location:'Digitalt',message:'Test av e-postflyt.',consent:true},false);assert.equal(r.status,201);const receipt=await r.json();assert.ok(!('portalToken' in receipt));assert.equal(receipt.emailQueued,false);
 r=await request('/api/enquiry-page','GET',undefined,false);assert.equal(r.status,404);
 for(const path of ['/api/admin/enquiries','/api/admin/email','/api/admin/export'])assert.equal((await request(path,'GET',undefined,false)).status,401);
 r=await request('/api/admin/email');assert.equal(r.status,200);const mail=await r.json();assert.equal(mail.enabled,false);assert.ok(!('options' in mail));assert.equal(mail.recent.length,0);
 r=await request('/api/admin/email/verify','POST',{},true,{'X-CSRF-Token':'wrong'});assert.equal(r.status,403);r=await request('/api/admin/email/verify','POST',{});assert.equal(r.status,409);
 r=await request('/api/admin/enquiries/'+receipt.id+'/access','POST',{});assert.equal(r.status,409);
});
