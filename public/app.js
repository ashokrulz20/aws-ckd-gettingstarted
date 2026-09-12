const dims={data:78,integration:84,security:72,quality:88,operations:74,adoption:69};
const labels={data:'Data readiness',integration:'Integration readiness',security:'Security & compliance',quality:'AI quality',operations:'Operational readiness',adoption:'Adoption readiness'};
const $=id=>document.getElementById(id);

function money(n){return '$'+Number(n||0).toLocaleString();}
function readinessPayload(){const o={};Object.keys(dims).forEach(k=>o[k]=Number($('r-'+k).value));return o;}
function roiPayload(){return {analysts:+$('analysts').value,casesPerDay:+$('casesPerDay').value,minutesBefore:+$('minutesBefore').value,improvementPct:+$('improvementPct').value,hourlyCost:+$('hourlyCost').value,annualPlatformCost:+$('annualPlatformCost').value};}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error((await r.json()).error||'Request failed');return r.json();}

function initSliders(){const host=$('sliders');host.innerHTML='';Object.entries(dims).forEach(([k,v])=>{const el=document.createElement('div');el.className='slider-row';el.innerHTML=`<div class="slider-top"><span>${labels[k]}</span><span id="v-${k}">${v}</span></div><input id="r-${k}" type="range" min="0" max="100" value="${v}"/>`;host.appendChild(el);el.querySelector('input').addEventListener('input',e=>$('v-'+k).textContent=e.target.value);});}

async function loadArchitecture(){const d=await fetch('/api/architecture').then(r=>r.json());$('architecture').innerHTML=d.flow.map((x,i)=>`<span class="arch-node">${x}</span>${i<d.flow.length-1?'<span class="arch-arrow">→</span>':''}`).join('');}

async function assess(){const d=await post('/api/readiness',readinessPayload());$('readinessScore').textContent=d.score+'/100';$('readinessDecision').textContent=d.status;$('rolloutDecision').textContent=d.status;$('gaps').innerHTML=d.gaps.length?d.gaps.map(g=>`<div class="gap"><b>${labels[g.area]}</b><span>${g.action}</span></div>`).join(''):'<div class="gap" style="background:#ecfdf5;border-color:#a7f3d0;color:#047857"><b>No blocking readiness gaps</b><span>All dimensions are at or above 75.</span></div>';const rollout=await post('/api/rollout',{readiness:readinessPayload()});$('rolloutDecision').textContent=rollout.recommendation;$('phases').innerHTML=rollout.phases.map((p,i)=>`<div class="phase"><div class="num">${i+1}</div><b>${p.name}</b><span>${p.users} users · ${p.duration}</span><small><strong>Gate:</strong> ${p.gate}</small></div>`).join('');return d;}

async function calculate(){const d=await post('/api/roi',roiPayload());$('hoursSaved').textContent=d.annualHoursSaved.toLocaleString();$('netValue').textContent=money(d.netValue);$('roiPct').textContent=d.roiPct+'%';$('payback').textContent='Payback '+d.paybackMonths+' months';$('laborValue').textContent=money(d.annualLaborValue);return d;}

async function generate(){const payload={customer:$('customer').value,useCase:$('useCase').value,readiness:readinessPayload(),roi:roiPayload()};const d=await post('/api/report',payload);$('report').className='report-grid';$('report').innerHTML=`<div class="report-block"><h3>Executive decision</h3><p class="decision">${d.decision}</p><p><b>${d.customer}</b> · ${d.useCase}</p><p>${d.valueCase}</p><p><b>Next action:</b> ${d.nextStep}</p></div><div class="report-block"><h3>Production criteria</h3><ul>${d.productionCriteria.map(x=>`<li>${x}</li>`).join('')}</ul><h3>Priority gaps</h3>${d.topRisks.length?`<ul>${d.topRisks.map(x=>`<li>${labels[x.area]} — ${x.score}/100</li>`).join('')}</ul>`:'<p>No blocking gaps.</p>'}</div>`;return d;}

async function full(){const b=$('runFull');const old=b.textContent;b.disabled=true;b.textContent='Evaluating…';try{await assess();await calculate();await generate();}finally{b.disabled=false;b.textContent=old;}}
function reset(){Object.entries(dims).forEach(([k,v])=>{$('r-'+k).value=v;$('v-'+k).textContent=v;});$('customer').value='Northstar Insurance Group';$('useCase').value='Agentic RAG claims assistant';$('users').value='Claims analysts and team leads';$('businessTarget').value='40% faster claim review';$('analysts').value=120;$('casesPerDay').value=8;$('minutesBefore').value=25;$('improvementPct').value=40;$('hourlyCost').value=42;$('annualPlatformCost').value=180000;$('report').className='report-empty';$('report').textContent='Run the full assessment to generate an executive-ready deployment and value brief.';full();}

$('assessReadiness').onclick=assess;$('calculateRoi').onclick=calculate;$('generateReport').onclick=generate;$('runFull').onclick=full;$('loadDemo').onclick=reset;
initSliders();loadArchitecture();full();
