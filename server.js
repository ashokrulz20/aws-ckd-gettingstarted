const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = path.join(__dirname, 'public');

const demo = {
  customer: 'Northstar Insurance Group',
  useCase: 'Agentic RAG claims assistant',
  users: 'Claims analysts and team leads',
  integrations: ['CRM', 'Policy API', 'Document repository'],
  pocTarget: '40% faster claim review',
  qualityTarget: '>=90% grounded responses',
  latencyTarget: 'P95 < 2.5s'
};

function send(res, code, body, type='application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) reject(new Error('Payload too large')); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function readiness(input={}) {
  const values = {
    data: Number(input.data ?? 78),
    integration: Number(input.integration ?? 84),
    security: Number(input.security ?? 72),
    quality: Number(input.quality ?? 88),
    operations: Number(input.operations ?? 74),
    adoption: Number(input.adoption ?? 69)
  };
  Object.keys(values).forEach(k => values[k] = Math.max(0, Math.min(100, values[k])));
  const weights = { data:.18, integration:.18, security:.18, quality:.20, operations:.14, adoption:.12 };
  const score = Math.round(Object.entries(values).reduce((a,[k,v]) => a + v*weights[k],0));
  const status = score >= 85 ? 'GO' : score >= 70 ? 'CONDITIONAL GO' : 'NO-GO';
  const gaps = Object.entries(values).filter(([,v]) => v < 75).map(([k,v]) => ({ area:k, score:v, action:`Raise ${k} readiness to at least 75 before production rollout.` }));
  return { score, status, dimensions: values, gaps };
}

function roi(input={}) {
  const analysts = Math.max(1, Number(input.analysts ?? 120));
  const casesPerDay = Math.max(1, Number(input.casesPerDay ?? 8));
  const minutesBefore = Math.max(1, Number(input.minutesBefore ?? 25));
  const improvementPct = Math.max(0, Math.min(95, Number(input.improvementPct ?? 40)));
  const hourlyCost = Math.max(1, Number(input.hourlyCost ?? 42));
  const annualPlatformCost = Math.max(0, Number(input.annualPlatformCost ?? 180000));
  const workingDays = 220;
  const minutesSavedPerCase = minutesBefore * improvementPct / 100;
  const annualHoursSaved = Math.round((analysts * casesPerDay * workingDays * minutesSavedPerCase) / 60);
  const annualLaborValue = Math.round(annualHoursSaved * hourlyCost);
  const netValue = annualLaborValue - annualPlatformCost;
  const roiPct = annualPlatformCost ? Math.round((netValue / annualPlatformCost) * 100) : 0;
  const paybackMonths = annualLaborValue > 0 ? Math.round((annualPlatformCost / annualLaborValue) * 12 * 10) / 10 : null;
  return { analysts, improvementPct, annualHoursSaved, annualLaborValue, annualPlatformCost, netValue, roiPct, paybackMonths };
}

function rollout(score) {
  const phases = [
    { name:'POC', users:8, duration:'2 weeks', gate:'Groundedness >= 90%, task success >= 92%' },
    { name:'Pilot', users:35, duration:'3 weeks', gate:'P95 < 2.5s, adoption >= 70%, critical defects = 0' },
    { name:'Canary', users:'10% traffic', duration:'1 week', gate:'SLOs stable, rollback validated, error budget healthy' },
    { name:'Production', users:'100%', duration:'Ongoing', gate:'Business KPI and quality KPI reviewed weekly' }
  ];
  return { recommendation: score >= 85 ? 'Proceed to phased rollout' : score >= 70 ? 'Proceed after readiness gaps are closed' : 'Remain in pilot/POC', phases };
}

function report(input={}) {
  const r = readiness(input.readiness || {});
  const v = roi(input.roi || {});
  return {
    title: 'Executive Customer Deployment & Value Brief',
    customer: input.customer || demo.customer,
    useCase: input.useCase || demo.useCase,
    decision: r.status,
    readinessScore: r.score,
    valueCase: `${v.annualHoursSaved.toLocaleString()} hours/year saved with estimated net annual value of $${v.netValue.toLocaleString()}.`,
    productionCriteria: ['Groundedness >= 90%', 'P95 latency < 2.5s', 'Critical defects = 0', 'Rollback tested', 'Named business owner and adoption plan'],
    topRisks: r.gaps.slice(0,3),
    nextStep: r.status === 'GO' ? 'Start controlled canary rollout.' : 'Close readiness gaps and repeat production gate.'
  };
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'})[ext] || 'text/plain; charset=utf-8';
}

function serveStatic(req,res) {
  let rel = req.url.split('?')[0];
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) return send(res,403,{error:'Forbidden'});
  fs.readFile(file,(err,data)=> err ? send(res,404,{error:'Not found'}) : send(res,200,data,mime(file)));
}

const server = http.createServer(async (req,res) => {
  try {
    const url = req.url.split('?')[0];
    if (url === '/health') return send(res,200,{status:'ok',service:'fde-customer-deployment-value-studio',runtime:'node',timestamp:new Date().toISOString()});
    if (url === '/api/demo') return send(res,200,demo);
    if (url === '/api/readiness' && req.method === 'POST') return send(res,200,readiness(await readBody(req)));
    if (url === '/api/roi' && req.method === 'POST') return send(res,200,roi(await readBody(req)));
    if (url === '/api/rollout' && req.method === 'POST') {
      const body = await readBody(req); const r = readiness(body.readiness || body); return send(res,200,rollout(r.score));
    }
    if (url === '/api/report' && req.method === 'POST') return send(res,200,report(await readBody(req)));
    if (url === '/api/architecture') return send(res,200,{flow:['Customer Discovery','Requirements & Risks','Solution Architecture','Integration Readiness','AI/RAG/Agent Evaluation','Pilot','Canary','Production','Observability','Value Realization']});
    return serveStatic(req,res);
  } catch (e) { return send(res,400,{error:e.message}); }
});

server.listen(PORT,'0.0.0.0',()=>console.log(`FDE Customer Deployment & Value Studio listening on ${PORT}`));
