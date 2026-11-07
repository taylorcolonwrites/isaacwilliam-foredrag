import http from 'node:http';
import {emailConfig,initEmailOutbox,createEmailService} from './email.mjs';
import {renderPublicPage,escape as escapeHTML} from '../public/assets/app.js';
import {visualPage} from './visual-qa.mjs';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync, realpathSync } from 'node:fs';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=resolve(process.env.DATA_DIR || join(root,'runtime'));
mkdirSync(dataDir,{recursive:true,mode:0o700});
mkdirSync(join(dataDir,'uploads'),{recursive:true,mode:0o700});
const db=new DatabaseSync(join(dataDir,'site.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS content(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS content_history(id INTEGER PRIMARY KEY, json TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY, created TEXT NOT NULL, updated TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', quote INTEGER, version INTEGER NOT NULL DEFAULT 1);
CREATE UNIQUE INDEX IF NOT EXISTS unique_confirmed_day ON enquiries(json_extract(payload,'$.date')) WHERE status='Bekreftet';
CREATE TABLE IF NOT EXISTS enquiry_access(hash TEXT PRIMARY KEY,enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS enquiry_messages(id TEXT PRIMARY KEY,enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,author TEXT NOT NULL CHECK(author IN ('arrangor','isaac')),text TEXT NOT NULL,created TEXT NOT NULL,seen INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS messages_by_enquiry ON enquiry_messages(enquiry_id,created);
CREATE TABLE IF NOT EXISTS blocks(id TEXT PRIMARY KEY, start TEXT NOT NULL, end TEXT NOT NULL, label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_config(id INTEGER PRIMARY KEY CHECK(id=1),salt BLOB NOT NULL,hash BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS throttle(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);`);
if(!db.prepare('SELECT id FROM content WHERE id=1').get())db.prepare('INSERT INTO content(id,json) VALUES(1,?)').run(readFileSync(join(root,'content/site.json'),'utf8'));
initEmailOutbox(db);const mailConfig=emailConfig(),email=createEmailService(db,mailConfig);const clientPortal=process.env.CLIENT_PORTAL_ENABLED==='true';
const emailTimer=setInterval(()=>email.drain().catch(()=>{}),15000);emailTimer.unref();
const prod=process.env.NODE_ENV==='production';
const visualQA=!prod&&process.env.VISUAL_QA==='true';
const password=process.env.ADMIN_PASSWORD || '';
if(password && password.length<16)throw new Error('ADMIN_PASSWORD må ha minst 16 tegn.');
if(prod&&!password)throw new Error('ADMIN_PASSWORD må settes før produksjonsstart.');
const storedCredential=db.prepare('SELECT salt,hash FROM auth_config WHERE id=1').get();
const salt=storedCredential?Buffer.from(storedCredential.salt):randomBytes(32);
const passwordHash=password?scryptSync(password,salt,64):null;
if(passwordHash&&(!storedCredential||!timingSafeEqual(passwordHash,Buffer.from(storedCredential.hash)))){
 db.exec('BEGIN IMMEDIATE');try{db.prepare('DELETE FROM sessions').run();db.prepare('INSERT INTO auth_config(id,salt,hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET salt=excluded.salt,hash=excluded.hash').run(salt,passwordHash);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
}
const statuses=['Ny','Under behandling','Tilbud sendt','Bekreftet','Gjennomført','Avslått','Avlyst','Arkivert'];
const types={'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8','json':'application/json; charset=utf-8','png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','webp':'image/webp','woff2':'font/woff2','ttf':'font/ttf','ico':'image/x-icon'};
const content=()=>{let row=db.prepare('SELECT json,revision FROM content WHERE id=1').get();return {...JSON.parse(row.json),revision:row.revision};};
const active=()=>process.env.BOOKING_ENABLED==='true' && content().settings.bookingEnabled===true;
function reply(res,status,value,headers={}) {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(value));}
function fail(status,message){throw Object.assign(new Error(message),{status});}
async function body(req,limit=2_000_000){let chunks=[],size=0;for await(let c of req){size+=c.length;if(size>limit)fail(413,'Innholdet er for stort.');chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'Ugyldig JSON.');}}
function text(v,max=500,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(400,'Kontroller at alle feltene er riktig utfylt.');return v.trim();}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)fail(400,'Ugyldig dato.');return v;}
function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo'}).format(new Date());}
function rate(key,max,window){let now=Date.now();db.prepare('DELETE FROM throttle WHERE reset<?').run(now);let row=db.prepare('SELECT * FROM throttle WHERE key=?').get(key);if(row&&row.count>=max)fail(429,'For mange forsøk. Prøv igjen senere.');db.prepare('INSERT INTO throttle(key,count,reset) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+window);}
function originCheck(req){let expected=process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`;if(req.headers.origin!==expected)fail(403,'Forespørselen må komme fra denne nettsiden.');if(!String(req.headers['content-type']||'').startsWith('application/json'))fail(415,'JSON kreves.');}
function session(req,res){if(!passwordHash)return null;let token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('iw_session='))?.slice(11);if(!token)return null;let hash=createHash('sha256').update(token).digest('hex');let row=db.prepare('SELECT * FROM sessions WHERE hash=? AND expires>?').get(hash,Date.now());return row?{...row,hash}:null;}
function auth(req,res,mutate=false){let s=session(req,res);if(!s)fail(401,'Logg inn for å fortsette.');if(mutate && req.headers['x-csrf-token']!==s.csrf)fail(403,'Økten er utløpt. Logg inn på nytt.');return s;}
function cookie(value,age=28800){return `iw_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${prod?'; Secure':''}`;}
function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
function conflicts(day,exclude=''){
 return db.prepare('SELECT id FROM blocks WHERE start<=? AND end>=?').get(day,day)||db.prepare("SELECT id FROM enquiries WHERE status='Bekreftet' AND json_extract(payload,'$.date')=? AND id<>?").get(day,exclude);
}
function validateContent(c){
 if(!c||!c.settings||!c.pages||Array.isArray(c.pages))fail(400,'Ugyldig innhold.');
 for(let key of ['name','domain','email','phone','address','privacyText'])text(c.settings[key],key==='privacyText'?15000:300,true);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.settings.email))fail(400,'Ugyldig e-postadresse.');
 if(typeof c.settings.bookingEnabled!=='boolean')fail(400,'Ugyldig bookinginnstilling.');
 const url=(v)=>{if(typeof v!=='string'||v.length>2000||!(/^(\/(?!\/)|#[\w-]|mailto:|tel:|https:\/\/)/.test(v)))fail(400,'Ugyldig lenke eller bildesti.');};
 for(let key of ['home','about','topics','booking','contact','pricing-and-services','faq','testimonials'])if(!c.pages[key])fail(400,'Alle hovedsidene må finnes.');
 if(Object.keys(c.pages).length>20)fail(400,'For mange sider.');
 for(let [key,p] of Object.entries(c.pages)){
  if(!/^[a-z-]+$/.test(key))fail(400,'Ugyldig sidenavn.');text(p.title,300,true);
  if(!Array.isArray(p.sections)||p.sections.length>30)fail(400,'Ugyldige seksjoner.');
  for(let s of p.sections){
   if(!['hero','intro','accordion','cards','form','quotes','stats'].includes(s.kind))fail(400,'Ugyldig seksjonstype.');
   text(s.title,700);text(s.text,20000);text(s.eyebrow,300);
   if(!Array.isArray(s.items)||s.items.length>50||!Array.isArray(s.links)||s.links.length>10||!Array.isArray(s.images)||s.images.length>20)fail(400,'Ugyldige innholdsfelt.');
   for(let i of s.items){text(i.title,700);text(i.text,20000);if(i.caption!==undefined)text(i.caption,700);}
   for(let l of s.links){text(l.label,300);url(l.href);}for(let i of s.images){url(i.src);text(i.alt,1000);}
  }
 }
 return c;
}
function enquiry(b){
 let out={type:b.type==='contact'?'contact':'booking',name:text(b.name,150,true),email:text(b.email,254,true),phone:text(b.phone||'',60),organisation:text(b.organisation||'',200,b.type!=='contact'),organisationType:text(b.organisationType||'',100,b.type!=='contact'),topic:text(b.topic||'',200),format:text(b.format||'',100),audience:text(b.audience||'',200),location:text(b.location||'',300),message:text(b.message,6000,true),date:'',time:text(b.time||'',10),participants:text(b.participants||'',10)};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))fail(400,'Kontroller e-postadressen.');
 if(out.type==='booking'){
  out.returningClient=b.returningClient===true;
  out.invoiceEmail=text(b.invoiceEmail||'',254);out.organisationNumber=text(b.organisationNumber||'',20).replace(/ /g,'');out.invoiceReference=text(b.invoiceReference||'',200);
  if(out.invoiceEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.invoiceEmail))fail(400,'Kontroller faktura-e-postadressen.');
  if(out.organisationNumber&&!/^\d{9}$/.test(out.organisationNumber))fail(400,'Organisasjonsnummer må ha ni sifre.');

  out.date=date(b.date||'');if(out.date<today())fail(400,'Velg en fremtidig dato.');
  if(!out.topic||!out.format||!out.audience||!out.location)fail(400,'Fyll ut tema, format, målgruppe og sted.');
  if(out.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out.time))fail(400,'Ugyldig klokkeslett.');
  if(out.participants&&!/^\d{1,6}$/.test(out.participants))fail(400,'Ugyldig antall deltakere.');
  if(conflicts(out.date))fail(409,'Datoen er opptatt. Velg en annen dato eller ta kontakt på e-post.');
 }
 if(b.consent!==true)fail(400,'Bekreft at du har lest personverninformasjonen.');return out;
}
function newAccess(id){const token=randomBytes(32).toString('hex'),expires=Date.now()+180*86400000;db.prepare('DELETE FROM enquiry_access WHERE enquiry_id=?').run(id);db.prepare('INSERT INTO enquiry_access VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),id,expires);return {token,expires};}
function portalAccess(req){const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))fail(401,'Lenken er ugyldig eller utløpt.');const row=db.prepare('SELECT enquiry_id,expires FROM enquiry_access WHERE hash=? AND expires>?').get(createHash('sha256').update(token).digest('hex'),Date.now());if(!row)fail(401,'Lenken er ugyldig eller utløpt.');return row;}
function messages(id){return db.prepare('SELECT id,author,text,created,seen FROM enquiry_messages WHERE enquiry_id=? ORDER BY created,rowid').all(id);}
function addMessage(id,author,value){const message=text(value,6000,true);if(db.prepare('SELECT count(*) AS n FROM enquiry_messages WHERE enquiry_id=?').get(id).n>=500)fail(400,'Samtalen har nådd grensen. Ta kontakt direkte.');const now=new Date().toISOString();db.prepare('INSERT INTO enquiry_messages VALUES(?,?,?,?,?,?)').run(randomUUID(),id,author,message,now,author==='isaac'?1:0);db.prepare('UPDATE enquiries SET updated=? WHERE id=?').run(now,id);}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options',visualQA?'SAMEORIGIN':'DENY');
 res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; font-src 'self'; connect-src 'self'; frame-ancestors ${visualQA?"'self'":"'none'"}; base-uri 'none'; form-action 'self'`);
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(process.env.ALLOW_INDEXING!=='true')res.setHeader('X-Robots-Tag','noindex, nofollow');
 try{
  let u=new URL(req.url,'http://localhost'),path=u.pathname;
  if(visualQA&&req.method==='GET'&&path.startsWith('/__qa/')){const page=visualPage(u);if(page){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(page);}}
  if(path.startsWith('/api/')){
   res.setHeader('Cache-Control','no-store');
   if(!['GET','HEAD'].includes(req.method))originCheck(req);
   let ip=req.socket.remoteAddress||'unknown'; // Never trust a visitor-supplied X-Forwarded-For.
   if(req.method==='GET'&&path==='/api/owner-access')return reply(res,200,{signedIn:Boolean(session(req,res))});
   if(req.method==='GET'&&path==='/api/content'){let c=content();return reply(res,200,{...c,bookingAvailable:active(),clientPortalAvailable:clientPortal});}
   if(req.method==='GET'&&path==='/api/availability'){
    let start=date(u.searchParams.get('from')||today()),end=date(u.searchParams.get('to')||start);if(end<start||Date.parse(end)-Date.parse(start)>370*86400000)fail(400,'Velg et tidsrom på inntil ett år.');
    let blocks=db.prepare('SELECT start,end FROM blocks WHERE end>=? AND start<=?').all(start,end);
    let confirmed=db.prepare("SELECT json_extract(payload,'$.date') AS day FROM enquiries WHERE status='Bekreftet' AND json_extract(payload,'$.date') BETWEEN ? AND ?").all(start,end);
    return reply(res,200,{unavailable:[...blocks,...confirmed.map(x=>({start:x.day,end:x.day}))]});
   }
   if(req.method==='POST'&&path==='/api/enquiries'){
    if(!active())fail(503,'Skjemaet er ikke åpnet ennå. Ta kontakt på e-post.');rate('submit:'+ip,10,3600000);let b=await body(req,20000);if(b.website)fail(400,'Kunne ikke sende forespørselen.');let payload={...enquiry(b),privacyRevision:content().revision,privacyAcknowledgedAt:new Date().toISOString()};let id=randomUUID(),now=new Date().toISOString();const access=transaction(()=>{db.prepare('INSERT INTO enquiries(id,created,updated,status,payload) VALUES(?,?,?,?,?)').run(id,now,now,'Ny',JSON.stringify(payload));email.enqueue(id,payload,content().settings);return clientPortal?newAccess(id):null;});setImmediate(()=>email.drain().catch(()=>{}));return reply(res,201,{id,...(access?{portalToken:access.token,portalExpires:access.expires}:{}),emailQueued:mailConfig.enabled,message:'Forespørselen er mottatt. Dette er ikke en bekreftet booking.'});
   }
   if(path==='/api/enquiry-page'){
    if(!clientPortal)fail(404,'Denne nettsiden bruker e-post til oppfølging.');
    rate('portal-read:'+ip,300,900000);const access=portalAccess(req),row=db.prepare('SELECT id,status,payload,created FROM enquiries WHERE id=?').get(access.enquiry_id);if(!row)fail(401,'Lenken er ugyldig eller utløpt.');
    if(req.method==='GET'){const p=JSON.parse(row.payload);return reply(res,200,{id:row.id,status:row.status,created:row.created,expires:access.expires,enquiry:{type:p.type,organisation:p.organisation,topic:p.topic,format:p.format,date:p.date,time:p.time,location:p.location,audience:p.audience,message:p.message},messages:messages(row.id).map(({seen,...m})=>m)});}
    if(req.method==='POST'){rate('portal-write:'+ip,30,3600000);const b=await body(req,20000);addMessage(row.id,'arrangor',b.message);return reply(res,201,{ok:true});}
    fail(405,'Metoden støttes ikke.');
   }
   if(req.method==='POST'&&path==='/api/login'){
    rate('login:'+ip,8,900000);let b=await body(req,2000);if(!passwordHash)fail(503,'Administrasjon må konfigureres på serveren først.');let supplied=typeof b.password==='string'?b.password:'';let check=scryptSync(supplied,salt,64);if(!timingSafeEqual(check,passwordHash))fail(401,'Feil passord.');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());let token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),csrf,Date.now()+28800000);return reply(res,200,{csrf},{'Set-Cookie':cookie(token)});
   }
   let s=auth(req,res,!['GET','HEAD'].includes(req.method));
   if(req.method==='GET'&&path==='/api/session')return reply(res,200,{csrf:s.csrf});
   if(req.method==='POST'&&path==='/api/logout'){db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);return reply(res,200,{ok:true},{'Set-Cookie':cookie('',0)});}
   if(req.method==='GET'&&path==='/api/admin/enquiries')return reply(res,200,{enquiries:db.prepare('SELECT * FROM enquiries ORDER BY created DESC').all().map(e=>({...e,payload:JSON.parse(e.payload),messages:messages(e.id)})),blocks:db.prepare('SELECT * FROM blocks ORDER BY start').all(),statuses});
   const conversation=path.match(/^\/api\/admin\/enquiries\/([a-f0-9-]+)\/(messages|access|read)$/);
   if(conversation&&req.method==='POST'){
    if(!clientPortal)fail(409,'Privat klientportal er ikke aktivert. Bruk e-post til oppfølging.');
    const [,id,action]=conversation;if(!db.prepare('SELECT id FROM enquiries WHERE id=?').get(id))fail(404,'Fant ikke forespørselen.');
    if(action==='access')return reply(res,201,newAccess(id));
    const b=await body(req,20000);
    if(action==='messages'){addMessage(id,'isaac',b.message);return reply(res,201,{ok:true});}
    if(!Array.isArray(b.ids)||b.ids.length>500||b.ids.some(id=>typeof id!=='string'||id.length>50))fail(400,'Ugyldige meldinger.');transaction(()=>{for(const messageId of b.ids)db.prepare("UPDATE enquiry_messages SET seen=1 WHERE id=? AND enquiry_id=? AND author='arrangor'").run(messageId,id);});return reply(res,200,{ok:true});
   }
   if(req.method==='GET'&&path==='/api/admin/email')return reply(res,200,email.status());
   if(req.method==='POST'&&path==='/api/admin/email/verify')return reply(res,200,await email.verify());
   if(req.method==='POST'&&path==='/api/admin/email/retry'){email.retry();setImmediate(()=>email.drain().catch(()=>{}));return reply(res,200,{ok:true});}
   if(req.method==='PUT'&&path==='/api/admin/content'){
    let b=await body(req);validateContent(b.content);let row=db.prepare('SELECT * FROM content WHERE id=1').get();if(row.revision!==b.revision)fail(409,'Innholdet er endret. Last inn siden på nytt før du lagrer.');
    let serialized=JSON.stringify({settings:b.content.settings,pages:b.content.pages});db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO content_history(json,created) VALUES(?,?)').run(row.json,new Date().toISOString());db.prepare('UPDATE content SET json=?,revision=revision+1 WHERE id=1').run(serialized);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return reply(res,200,{revision:row.revision+1});
   }
   if(req.method==='GET'&&path==='/api/admin/export')return reply(res,200,content(),{'Content-Disposition':'attachment; filename="nettsideinnhold.json"'});
   if(req.method==='POST'&&path==='/api/admin/uploads'){
    let b=await body(req,8_000_000);let bytes=Buffer.from(text(b.data,7_500_000,true),'base64'),ext;
    if(bytes.length>5_000_000)fail(413,'Bildet må være under 5 MB.');
    if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
    else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';
    else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')ext='webp';
    else fail(400,'Bruk PNG, JPG eller WebP.');
    let name=randomUUID()+'.'+ext;writeFileSync(join(dataDir,'uploads',name),bytes,{mode:0o600});return reply(res,201,{src:'/uploads/'+name});
   }
   if(req.method==='POST'&&path==='/api/admin/blocks'){
    let b=await body(req,2000),start=date(b.start),end=date(b.end);if(end<start)fail(400,'Sluttdato må komme etter startdato.');
    let id=randomUUID();transaction(()=>{if(db.prepare("SELECT id FROM enquiries WHERE status='Bekreftet' AND json_extract(payload,'$.date') BETWEEN ? AND ?").get(start,end))fail(409,'Perioden inneholder en bekreftet booking.');
    db.prepare('INSERT INTO blocks VALUES(?,?,?,?)').run(id,start,end,text(b.label||'Opptatt',200));});return reply(res,201,{id});
   }
   if(req.method==='DELETE'&&path.startsWith('/api/admin/blocks/')){db.prepare('DELETE FROM blocks WHERE id=?').run(path.split('/').pop());return reply(res,200,{ok:true});}
   if(req.method==='PATCH'&&path.startsWith('/api/admin/enquiries/')){
    let id=path.split('/').pop(),b=await body(req,15000),row=db.prepare('SELECT * FROM enquiries WHERE id=?').get(id);if(!row)fail(404,'Fant ikke forespørselen.');if(b.version!==row.version)fail(409,'Forespørselen er endret. Last inn på nytt.');
    if(!statuses.includes(b.status))fail(400,'Ugyldig status.');let p=JSON.parse(row.payload);
    transaction(()=>{let current=db.prepare('SELECT version FROM enquiries WHERE id=?').get(id);if(current.version!==b.version)fail(409,'Forespørselen er endret. Last inn på nytt.');if(b.status==='Bekreftet'){if(p.type!=='booking'||!p.date)fail(400,'Kun bookingforespørsler kan bekreftes.');if(p.date<today())fail(400,'Datoen er passert.');if(conflicts(p.date,id))fail(409,'Datoen er allerede opptatt.');}
    let quote=b.quote===null?null:Number(b.quote);if(quote!==null&&(!Number.isInteger(quote)||quote<0||quote>10000000))fail(400,'Ugyldig pristilbud. Bruk hele kroner.');
    db.prepare('UPDATE enquiries SET status=?,notes=?,quote=?,updated=?,version=version+1 WHERE id=?').run(b.status,text(b.notes||'',10000),quote,new Date().toISOString(),id);});return reply(res,200,{ok:true});
   }
   if(req.method==='DELETE'&&path.startsWith('/api/admin/enquiries/')){let id=path.split('/').pop();db.prepare('DELETE FROM enquiries WHERE id=?').run(id);return reply(res,200,{ok:true});}
   fail(404,'Fant ikke endepunktet.');
  }
  if(!['GET','HEAD'].includes(req.method))fail(405,'Metoden støttes ikke.');
  if(path==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end(process.env.ALLOW_INDEXING==='true'?'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /min-side\nDisallow: /api/\nDisallow: /foresporsel\n':'User-agent: *\nDisallow: /\n');}
  if(path==='/pricing'){res.writeHead(302,{Location:'/pricing-and-services'});return res.end();}
  if(['/booking.html','/personvern.html','/rediger.html'].includes(path)){res.writeHead(302,{Location:{'/booking.html':'/booking','/personvern.html':'/personvern','/rediger.html':'/admin'}[path]});return res.end();}
  let file,base;
  if(path.startsWith('/uploads/')){base=join(dataDir,'uploads');if(!/^\/uploads\/[a-f0-9-]+\.(png|jpg|webp)$/.test(path))fail(404,'Fant ikke bildet.');file=join(base,path.slice(9));}
  else if(path.startsWith('/assets/')){base=join(root,'public');file=resolve(base,'.'+decodeURIComponent(path));if(!file.startsWith(base+'/'))fail(404,'Fant ikke filen.');}
  else if(['/foresporsel','/foresporsel/'].includes(path)){res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');file=join(root,'public/enquiry.html');}
  else if(['/admin','/admin/','/min-side','/min-side/'].includes(path)){res.setHeader('X-Robots-Tag','noindex, nofollow');file=join(root,'public/admin.html');}
  else if(['/','/about','/topics','/booking','/contact','/pricing-and-services','/faq','/testimonials','/personvern'].includes(path.replace(/\/$/,'' )||'/'))file=join(root,'public/index.html');
  else {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="nb"><title>Fant ikke siden</title><h1>Fant ikke siden</h1><p><a href="/">Gå til forsiden</a></p></html>');}
  if(!existsSync(file)||!statSync(file).isFile())fail(404,'Fant ikke filen.');
  if(base&&!realpathSync(file).startsWith(realpathSync(base)+'/'))fail(404,'Fant ikke filen.');
  if(file===join(root,'public/index.html')){
   const site={...content(),bookingAvailable:active(),clientPortalAvailable:clientPortal},signedIn=Boolean(session(req,res)),rendered=renderPublicPage(site,path,signedIn);
   let html=readFileSync(file,'utf8').replace(/<title>[\s\S]*?<\/title>/,()=>`<title>${escapeHTML(rendered.title)}</title>`).replace(/<meta name="description" content="[^"]*">/,()=>`<meta name="description" content="${escapeHTML(rendered.description)}">`);
   html=html.replace('<header id="header"></header>',()=>`<header id="header">${rendered.header}</header>`).replace(/<main id="main">[\s\S]*?<\/main>/,()=>`<main id="main">${rendered.main}</main>`).replace('<footer id="footer"></footer>',()=>`<footer id="footer">${rendered.footer}</footer>`);
   const bootstrap=JSON.stringify({site,signedIn}).replace(/</g,'\\u003c');
   html=html.replace('</body>',()=>`<script id="site-data" type="application/json">${bootstrap}</script></body>`);
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:html);
  }
  res.writeHead(200,{'Content-Type':types[extname(file).slice(1)]||'application/octet-stream','Cache-Control':file.endsWith('.html')||!prod?'no-store':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
 }catch(e){reply(res,e.status||500,{error:e.status?e.message:'Det oppstod en serverfeil. Prøv igjen senere.'});}
});
const argument=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
server.listen(Number(argument('--port')||process.env.PORT||3000),argument('--host')||process.env.HOST||'0.0.0.0',()=>console.log('Isaac William website listening on port '+server.address().port));

for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>{db.close();process.exit(0);});});
