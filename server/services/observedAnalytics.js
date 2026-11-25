'use strict';
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');

function createObservedAnalytics(projects = Project, deployments = Deployment, now = () => new Date()) {
 return {
  async read(userId, requestedDays = 30) {
   if (!userId) throw Object.assign(new Error('Authentication required'), { status: 401 });
   const days = Number(requestedDays);
   if (!Number.isInteger(days) || days < 1 || days > 90) throw Object.assign(new Error('days must be an integer from 1 to 90'), { status: 400 });
   const end = now();
   const start = new Date(end); start.setUTCHours(0,0,0,0); start.setUTCDate(start.getUTCDate()-days+1);
   const previousStart = new Date(start); previousStart.setUTCDate(previousStart.getUTCDate()-days);
   const owned = await projects.find({userId}).select('_id').lean();
   const scope = {projectId: {$in: owned.map(project => project._id)}};
   const [counts, history] = await Promise.all([
    deployments.aggregate([
     {$match: {...scope, createdAt: {$gte: previousStart, $lte: end}}},
     {$group: {_id: {period: {$cond: [{$gte: ['$createdAt',start]},'current','previous']}, status: '$status'}, count: {$sum: 1}}},
    ]),
    deployments.aggregate([
     {$match: {...scope, createdAt: {$gte: start, $lte: end}}},
     {$group: {_id: {$dateToString: {date:'$createdAt',format:'%Y-%m-%d',timezone:'UTC'}}, deployments: {$sum:1}, failedDeployments: {$sum: {$cond: [{$eq:['$status','failed']},1,0]}}}},
     {$sort: {_id:1}},
    ]),
   ]);
   const statuses = {}; let previousDeployments = 0;
   for (const row of counts) {
    if (row._id.period === 'previous') previousDeployments += row.count;
    else statuses[row._id.status] = row.count;
   }
   const total = Object.values(statuses).reduce((sum,count)=>sum+count,0);
   const successful = (statuses.running||0)+(statuses.stopped||0)+(statuses['rolled-back']||0);
   const daily = new Map(history.map(row=>[row._id,row]));
   const timeline = [];
   for (let i=0;i<days;i++) {
    const date = new Date(start); date.setUTCDate(date.getUTCDate()+i);
    const key = date.toISOString().slice(0,10), row = daily.get(key);
    timeline.push({date:key,deployments:row?.deployments||0,failedDeployments:row?.failedDeployments||0,activeUsers:null,newUsers:null,avgResponseTime:null,p95ResponseTime:null});
   }
   return {
    overview: {totalDeployments:total,previousDeployments,successfulDeployments:successful,failedDeployments:statuses.failed||0,inProgressDeployments:(statuses.pending||0)+(statuses.building||0)+(statuses.deploying||0),runningDeployments:statuses.running||0,cancelledDeployments:statuses.cancelled||0,stoppedDeployments:statuses.stopped||0,successRate:total?successful/total*100:null,activeUsers:null,previousActiveUsers:null,apiCalls:null,previousApiCalls:null,avgResponseTime:null,p95ResponseTime:null,uptime:null,errorRate:null},
    history: timeline, observedAt:end.toISOString(), window:{days,start:start.toISOString(),end:end.toISOString(),timezone:'UTC'},
    unavailableMetrics:['activeUsers','apiCalls','avgResponseTime','p95ResponseTime','uptime','errorRate'],
   };
  },
 };
}
module.exports = createObservedAnalytics();
module.exports.createObservedAnalytics = createObservedAnalytics;
