// Preview-only adapter. No authentication or live data access is provided here.
export function createDemoApi(seed){let site=structuredClone(seed.site),records=structuredClone(seed.records);const copy=v=>structuredClone(v);return async(path,method='GET',data={})=>{
 if(path==='/api/session')return {csrf:'preview-only'};
 if(path==='/api/admin/email')return {enabled:false,configured:false,from:'post@isaacwilliam.no',owner:'post@isaacwilliam.no',verifiedThisSession:false,counts:{pending:0,sending:0,sent:0,failed:0},recent:[]};
 if(path==='/api/logout')return {ok:true};
 if(path==='/api/content')return copy(site);
 if(path==='/api/admin/enquiries'&&method==='GET')return copy(records);
 if(path==='/api/admin/content'&&method==='PUT'){if(data.revision!==site.revision)throw Error('Last demoen på nytt.');site={...copy(data.content),revision:site.revision+1,bookingAvailable:false};return {revision:site.revision};}
 if(path==='/api/admin/blocks'&&method==='POST'){const id='demo-block-'+Date.now();records.blocks.push({...copy(data),id});return {id};}
 if(path.startsWith('/api/admin/blocks/')&&method==='DELETE'){records.blocks=records.blocks.filter(b=>b.id!==path.split('/').pop());return {ok:true};}
 const match=path.match(/^\/api\/admin\/enquiries\/([^/]+)(?:\/(messages|read|access))?$/);if(match){const [,id,action]=match,r=records.enquiries.find(r=>r.id===id);if(!r)throw Error('Fant ikke testforespørselen.');
  if(action==='messages'){r.messages.push({id:'demo-message-'+Date.now(),author:'isaac',text:data.message,created:new Date().toISOString(),seen:1});return {ok:true};}
  if(action==='read'){for(const m of r.messages)if(data.ids.includes(m.id))m.seen=1;return {ok:true};}
  if(action==='access')throw Error('Private tilgangslenker opprettes bare på den fullstendige serverversjonen. Demoen har ingen klienttilgang.');
  if(method==='PATCH'){Object.assign(r,copy(data),{version:r.version+1});return {ok:true};}
  if(method==='DELETE'){records.enquiries=records.enquiries.filter(e=>e.id!==id);return {ok:true};}
 }
 throw Error('Denne funksjonen krever serverversjonen. Ingen endring er sendt til et ekte kontrollpanel.');
};}
