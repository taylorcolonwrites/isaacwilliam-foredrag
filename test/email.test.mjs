import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {emailConfig,initEmailOutbox,createEmailService} from '../server/email.mjs';
const settings={name:'Isaac William Lunde'},payload={type:'booking',name:'Testperson',email:'client@example.invalid',organisation:'Testarrangør',topic:'Autisme',date:'2099-05-20',message:'Privat testmelding som ikke skal reflekteres i kvitteringen.'};
function database(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;CREATE TABLE enquiries(id TEXT PRIMARY KEY);INSERT INTO enquiries VALUES(\'test-enquiry\');');initEmailOutbox(db);return db;}
const config=()=>emailConfig({EMAIL_ENABLED:'true',SMTP_USER:'post@isaacwilliam.no',SMTP_APP_PASSWORD:'fake-test-secret'});
test('email setup is explicit, Google-only and rejects incomplete or invalid sender configuration',()=>{
 assert.equal(emailConfig({}).enabled,false);assert.throws(()=>emailConfig({EMAIL_ENABLED:'true'}));assert.throws(()=>emailConfig({EMAIL_ENABLED:'true',SMTP_USER:'post@isaacwilliam.no\nBcc: x',SMTP_APP_PASSWORD:'fake'}));assert.throws(()=>emailConfig({EMAIL_ENABLED:'true',SMTP_USER:'post@isaacwilliam.no',SMTP_APP_PASSWORD:'fake',SMTP_HOST:'untrusted.invalid'}));
});
test('email-first enquiry queues once, has correct reply destinations and receipts contain no customer message or private link',async()=>{
 const db=database(),sent=[];const email=createEmailService(db,config(),{transport:{sendMail:async m=>{sent.push(m);return {rejected:[]};},verify:async()=>true}});
 email.enqueue('test-enquiry',payload,settings);email.enqueue('test-enquiry',payload,settings);assert.equal(email.status().counts.pending,2);await email.drain();assert.equal(sent.length,2);assert.equal(email.status().counts.sent,2);
 const notification=sent.find(m=>m.to==='post@isaacwilliam.no'),receipt=sent.find(m=>m.to===payload.email);assert.equal(notification.replyTo,payload.email);assert.equal(receipt.replyTo,'post@isaacwilliam.no');assert.ok(notification.text.includes(payload.message));assert.ok(!receipt.text.includes(payload.message));assert.ok(!receipt.text.includes('/foresporsel'));assert.ok(!JSON.stringify(email.status()).includes('fake-test-secret'));
 await email.verify();assert.equal(email.status().verifiedThisSession,true);await email.drain();assert.equal(sent.length,2);db.close();
});
test('SMTP failure is retained, retried with stable message IDs, redacted and does not delete the enquiry',async()=>{
 const db=database();let time=1000,failing=true;const ids=[];const email=createEmailService(db,config(),{now:()=>time,transport:{sendMail:async m=>{ids.push(m.messageId);if(failing)throw Object.assign(Error('fake-test-secret'),{code:'EAUTH'});return {rejected:[]};}}});email.enqueue('test-enquiry',payload,settings);
 for(let n=0;n<5;n++){await email.drain();time+=4000000;}assert.equal(email.status().counts.failed,2);assert.equal(db.prepare('SELECT count(*) AS n FROM enquiries').get().n,1);assert.ok(!JSON.stringify(email.status()).includes('fake-test-secret'));const firstId=ids[0];assert.ok(ids.filter(id=>id===firstId).length===5);
 failing=false;email.retry();await email.drain();assert.equal(email.status().counts.sent,2);assert.equal(email.status().counts.failed,0);db.prepare('DELETE FROM enquiries').run();assert.equal(email.status().recent.length,0);db.close();
});
test('disabled email sends nothing and email queue survives worker restart',async()=>{
 const db=database();let calls=0;const off=createEmailService(db,emailConfig({}),{transport:{sendMail:async()=>{calls++;}}});off.enqueue('test-enquiry',payload,settings);await off.drain();assert.equal(calls,0);assert.equal(off.status().recent.length,0);
 const email=createEmailService(db,config(),{transport:{sendMail:async()=>{calls++;return {rejected:[]};}}});email.enqueue('test-enquiry',payload,settings);db.prepare("UPDATE email_outbox SET status='sending' WHERE kind='owner'").run();initEmailOutbox(db);assert.equal(email.status().counts.pending,2);await email.drain();assert.equal(calls,2);db.close();
});
