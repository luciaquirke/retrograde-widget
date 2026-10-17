<script>
(() => {
'use strict';
const $ = id => document.getElementById(id);
const TAU = 2*Math.PI, deg=Math.PI/180;
const minDay=260,maxDay=550;
// Earth and Mars share one size; the Sun is five times it, the ratio pre-telescope astronomers agreed on.
const planetSize=4;
const palette={gold:'#f5cc87',aqua:'#8adee4',mars:'#fc9b83',line:'#536b86',bg:'#101a2b'};
const make=(x,y,z=0)=>({x,y,z});
const plus=(a,b)=>make(a.x+b.x,a.y+b.y,a.z+b.z);
const minus=(a,b)=>make(a.x-b.x,a.y-b.y,a.z-b.z);
const scale=(p,k)=>make(p.x*k,p.y*k,p.z*k);
const flat=(a,b)=>a.x*b.x+a.y*b.y;
const lift=(p,z)=>make(p.x,p.y,z);
const theta=(v)=>Math.atan2(v.y,v.x);
const rads=(r,t)=>make(r*Math.cos(t),r*Math.sin(t));
const WE=TAU/365.25, WM=TAU/686.98, synodic=1/(1/365.25-1/686.98);
// Mean longitude of Mars at day 0, chosen so the first opposition falls on day 403.
const phase=3.0477;
// Apsidal lines from the Almagest: Mars apogee 115;30°, Sun apogee 65;30°. Mars's northern limit sits at its apogee.
const marsApogee=rads(1,115.5*deg), sunApogee=rads(1,65.5*deg);
// Almagest X, scaled so the epicycle is 1: deferent 60, eccentricity 6 (equant at 12), epicycle 39;30. Sun eccentricity 2;30 of 60, at the distance of the Planetary Hypotheses spheres.
// Almagest XIII: the eccentric is tilted 1° to the ecliptic; the epicycle lies parallel to the ecliptic at the nodes and tilts 2;15 to the eccentric at the limits.
const ptolemy={deferent:60/39.5,ecc:6/39.5,sunEcc:2.5/60,sunDist:.35,tilt:1*deg,epicycleTilt:1.25*deg};
// De revolutionibus V, in parts of a 10000 deferent: Mars eccentricity 1460, epicyclet 500, Earth's orbit 6580. Earth eccentricity 0.0323.
// De revolutionibus VI: Mars's orbit tilts about nodes through the centre of Earth's orbit, rocking from 0;10 at conjunction to 1;50 at opposition.
const copernicus={deferent:1/.658,ecc:.146/.658,epicyclet:.05/.658,earthEcc:.0323,tiltMean:1*deg,tiltSwing:50/60*deg};
const tychoSunEcc=.03584;
const meanMars=t=>phase+WM*t, meanEarth=t=>WE*t;
// Copernican Mars relative to the centre of Earth's orbit: the epicyclet turns at twice the anomaly, nearest the deferent centre at apogee.
const copernicanMars=t=>{const m=meanMars(t),centre=scale(marsApogee,copernicus.ecc),onDeferent=plus(centre,rads(copernicus.deferent,m));return {centre,onDeferent,mars:plus(onDeferent,rads(copernicus.epicyclet,2*m-theta(marsApogee)+Math.PI))};};
const copernicanTilt=t=>copernicus.tiltMean+copernicus.tiltSwing*Math.cos(meanMars(t)-meanEarth(t));
const sunCentred=(t,hub,sun)=>{const cm=copernicanMars(t),tilt=Math.tan(copernicanTilt(t)),liftMars=p=>lift(p,flat(minus(p,hub),marsApogee)*tilt);return {hub,sun,mars:liftMars(plus(hub,cm.mars)),deferentCentre:liftMars(plus(hub,cm.centre)),epicycleCentre:liftMars(plus(hub,cm.onDeferent)),liftDeferent:liftMars,liftEpicycle:liftMars};};
const frames={
geo:t=>{const u=rads(1,meanMars(t)),meanSun=rads(1,meanEarth(t)+Math.PI),equant=scale(marsApogee,2*ptolemy.ecc),k=flat(marsApogee,u),s=-ptolemy.ecc*k+Math.sqrt(ptolemy.deferent**2-ptolemy.ecc**2*(1-k*k));
 const liftDeferent=p=>lift(p,flat(p,marsApogee)*Math.tan(ptolemy.tilt)),epicycleCentre=liftDeferent(plus(equant,scale(u,s))),radial=scale(epicycleCentre,1/Math.hypot(epicycleCentre.x,epicycleCentre.y)),slope=Math.tan(ptolemy.epicycleTilt*Math.cos(theta(epicycleCentre)-theta(marsApogee)));
 const liftEpicycle=p=>lift(p,epicycleCentre.z-flat(minus(p,epicycleCentre),radial)*slope);
 return {earth:make(0,0),sun:scale(plus(scale(sunApogee,ptolemy.sunEcc),meanSun),ptolemy.sunDist),mars:liftEpicycle(plus(epicycleCentre,meanSun)),deferentCentre:liftDeferent(scale(marsApogee,ptolemy.ecc)),equant:liftDeferent(equant),epicycleCentre,nodeCentre:make(0,0),liftDeferent,liftEpicycle};},
helio:t=>{const hub=scale(sunApogee,-copernicus.earthEcc);return {...sunCentred(t,hub,make(0,0)),earth:plus(hub,rads(1,meanEarth(t))),nodeCentre:hub};},
tycho:t=>{const hub=rads(-1,meanEarth(t));return {...sunCentred(t,hub,plus(hub,scale(sunApogee,tychoSunEcc))),earth:make(0,0),nodeCentre:hub};}
};
let model='helio',time=403,speed=1,playing=false,showGuides=true,showTrails=true,exaggerate=true,lastFrame=null,opposition=6;
const view={az:-25*deg,tilt:55*deg};
function vec(t,m){return frames[m](t+offset());}
const sky=(t,m=model)=>{const c=vec(t,m),v=minus(c.mars,c.earth);return {lon:theta(v)/deg,lat:Math.atan2(v.z,Math.hypot(v.x,v.y))/deg};};
const directionalDelta=(a,b)=>((a-b+540)%360)-180;
// Each true opposition lies within weeks of the mean synodic spacing; solve for it in the Copernican geometry.
const oppositionDays=Array.from({length:8},(_,k)=>{const gap=t=>{const c=frames.helio(t);return directionalDelta(theta(c.mars)/deg,theta(c.earth)/deg);};let a=403+k*synodic-70;while(!(gap(a)>0&&gap(a+1)<=0))a+=1;let b=a+1;for(let i=0;i<40;i++){const m=(a+b)/2;if(gap(m)>0)a=m;else b=m;}return a;});
const offset=()=>oppositionDays[opposition]-403;
const getLongitude=(t,m=model)=>{const ref=sky(403,m).lon;return ref+directionalDelta(sky(t,m).lon,ref);};
const apparentRate=t=>directionalDelta(sky(t+.05).lon,sky(t-.05).lon)/.1;
const formatAngle=t=>((sky(t).lon%360)+360)%360;
const descriptions={
geo:{reference:'EARTH HELD STILL',headline:'An epicycle.',copy:'Earth sits just off the centre of Mars’s deferent circle. The epicycle’s centre moves around the deferent at a steady rate as seen from the equant, a point on the far side of the deferent’s centre. Mars revolves on the epicycle, whose radius always stays parallel to the line from Earth to the mean Sun. When Mars is on the inner side of the epicycle, its backward motion exceeds the deferent’s forward motion.',equation:'Earth → Mars = eccentric deferent (steady about the equant) + epicycle parallel to the mean Sun',insight:'Latitude: the deferent tilts 1°, highest at the apogee. The epicycle rocks: flat at the nodes, its near side tilted a further 1¼° north or south at the limits.'},
helio:{reference:'SUN HELD STILL',headline:'The observer is moving.',copy:'Earth orbits faster than Mars. As Earth overtakes it, our line of sight sweeps backward for a while. Copernicus still allowed only steady circular motion, so to match Ptolemy’s equant, Mars revolves on a small epicyclet on an off-centre deferent. Both orbits are measured from the centre of Earth’s orbit, which sits slightly off the Sun.',equation:'Earth → Mars = centre → Mars (deferent + epicyclet) − centre → Earth',insight:'Latitude: Mars’s orbit tilts about a line of nodes through the centre of Earth’s orbit, rocking from 0°10′ at conjunction to 1°50′ at opposition.'},
tycho:{reference:'EARTH HELD STILL',headline:'The Sun’s motion.',copy:'Earth stays fixed. The Sun circles Earth, and Mars circles the Sun on the same off-centre deferent and epicyclet that Copernicus used. Mars’s circle cuts through the Sun’s, which Tycho could accept because his observations of the comet of 1577 had already ruled out solid celestial spheres.',equation:'Earth → Mars = Earth → mean Sun + mean Sun → Mars',insight:'Latitude: Copernicus’s rocking tilt, carried along by the Sun. Tycho’s team never made Mars’s latitudes fit his observations.'}
};
const starSeeds=Array.from({length:85},(_,i)=>{const a=Math.sin(i*127.13+41.9)*43758.5453,b=Math.sin(i*93.77+12.6)*9182.31;return {x:30+(a-Math.floor(a))*660,y:20+(b-Math.floor(b))*433,r:i%7===0?1.15:.55,opacity:i%3===0?.31:.18}});
const stars=starSeeds.map(s=>`<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r}" fill="#b8c9e4" opacity="${s.opacity}"/>`).join('');
const center=make(360,243),ringRadius=290;
function projector(){const zoom=model==='helio'?140:model==='geo'?100:95,k=exaggerate?10:1,ca=Math.cos(view.az),sa=Math.sin(view.az),ct=Math.cos(view.tilt),st=Math.sin(view.tilt);return {zoom,project:p=>{const x=p.x*ca-p.y*sa,y=p.x*sa+p.y*ca;return make(center.x+zoom*x,center.y-zoom*(y*ct+p.z*k*st));}};}
function path(points,project,close=false){return points.map((p,i)=>{const q=project(p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join(' ')+(close?'Z':'');}
function orbitSvg(){
 const c=vec(time,model),{zoom,project}=projector();
 const pEarth=project(c.earth),pMars=project(c.mars),pSun=project(c.sun);
 const ring=(centre,r,liftFn,color,opacity=.7,dash='')=>`<path d="${path(Array.from({length:120},(_,i)=>liftFn(plus(centre,rads(r,i*TAU/120)))),project,true)}" class="orbit" stroke="${color}" stroke-opacity="${opacity}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const inEcliptic=p=>lift(p,0);
 const line=(a,b,color,opacity=.7,dash='')=>`<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.5" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const dot=(p,r,color)=>`<circle cx="${p.x}" cy="${p.y}" r="${Math.min(r*2.25,r+14)}" fill="${color}" opacity=".11" filter="url(#planetGlow)"/><circle cx="${p.x}" cy="${p.y}" r="${r+2.4}" fill="${color}" opacity=".11"/><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${color}" stroke="#ffffff" stroke-opacity=".22" stroke-width=".7"/>`;
 const pin=(p,color)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" fill="${color}" opacity=".8"/>`;
 const origin=model==='helio'?c.sun:c.earth;
 let orbits='',traces='',constructions='';
 const trailTimes=(span,n)=>Array.from({length:n},(_,i)=>Math.max(minDay,time-span)+i*(Math.min(span,time-minDay)/(n-1)));
 const trail=(times,key,color,width,opacity)=>`<path d="${path(times.map(t=>vec(t,model)[key]),project)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="round"/>`;
 if(model==='helio'){
   orbits+=ring(c.hub,1,inEcliptic,palette.aqua,.26)+ring(c.deferentCentre,copernicus.deferent,c.liftDeferent,palette.mars,.36);
   if(showTrails){const times=trailTimes(94,76);traces+=trail(times,'earth',palette.aqua,2.65,.65)+trail(times,'mars',palette.mars,2.7,.68);}
   if(showGuides)constructions+=line(project(c.hub),pEarth,palette.aqua,.34,'4 6')+line(project(c.deferentCentre),project(c.epicycleCentre),palette.mars,.3,'4 6')+ring(c.epicycleCentre,copernicus.epicyclet,c.liftEpicycle,palette.mars,.7,'2 3')+pin(project(c.hub),palette.aqua)+pin(project(c.deferentCentre),palette.mars);
 }else if(model==='tycho'){
   orbits+=ring(scale(sunApogee,tychoSunEcc),1,inEcliptic,palette.gold,.4)+ring(c.deferentCentre,copernicus.deferent,c.liftDeferent,palette.mars,.44);
   if(showGuides)constructions+=line(pEarth,project(c.hub),palette.gold,.49,'4 5')+line(project(c.deferentCentre),project(c.epicycleCentre),palette.mars,.37,'4 6')+ring(c.epicycleCentre,copernicus.epicyclet,c.liftEpicycle,palette.mars,.7,'2 3')+pin(project(c.hub),palette.gold)+pin(project(c.deferentCentre),palette.mars);
   if(showTrails){const times=trailTimes(120,105);traces+=trail(times,'mars',palette.mars,2.7,.7)+trail(times,'sun',palette.gold,1.9,.5);}
 }else{
   const cp=project(c.epicycleCentre),pq=project(c.equant);
   orbits+=ring(lift(c.deferentCentre,0),ptolemy.deferent,c.liftDeferent,palette.aqua,.35)+ring(scale(sunApogee,ptolemy.sunEcc*ptolemy.sunDist),ptolemy.sunDist,inEcliptic,palette.gold,.35);
   if(showGuides){orbits+=ring(c.epicycleCentre,1,c.liftEpicycle,palette.mars,.55,'4 5');constructions+=line(pq,cp,palette.aqua,.5,'4 5')+line(cp,pMars,palette.mars,.7,'5 5')+line(pEarth,pSun,palette.gold,.6,'3 4')+pin(project(c.deferentCentre),palette.aqua)+pin(pq,palette.aqua)+`<circle cx="${cp.x}" cy="${cp.y}" r="3.7" fill="#cad6eb" opacity=".75"/>`;}
   if(showTrails){const times=trailTimes(120,105);traces+=trail(times,'mars',palette.mars,2.7,.72);}
 }
 if(showGuides){const across=rads(2.05,theta(marsApogee)+Math.PI/2),a=project(plus(c.nodeCentre,across)),b=project(minus(c.nodeCentre,across));constructions+=line(a,b,'#9fb0c4',.32,'1 5')+`<text x="${a.x.toFixed(1)}" y="${(a.y-6).toFixed(1)}" text-anchor="middle" class="svg-small">NODES</text>`;}
 const pShadow=project(lift(c.mars,0));
 const drop=line(pMars,pShadow,palette.mars,.8,'2 3')+`<circle cx="${pShadow.x.toFixed(1)}" cy="${pShadow.y.toFixed(1)}" r="2.4" fill="none" stroke="${palette.mars}" stroke-opacity=".8"/>`;
 const v=minus(pMars,pEarth),len=Math.hypot(v.x,v.y)||1,direction=scale(v,1/len),end=plus(pMars,scale(direction,Math.min(76,Math.max(0,ringRadius*Math.cos(view.tilt)*.6+40-Math.hypot(pMars.x-center.x,pMars.y-center.y)))));
 const ray=`<line x1="${pEarth.x}" y1="${pEarth.y}" x2="${end.x}" y2="${end.y}" stroke="#dce6f3" stroke-opacity=".82" stroke-width="1.4" stroke-dasharray="3 6"/>`;
 const axis=ring(origin,(ringRadius+11)/zoom,inEcliptic,'#455a74',.48,'1 12')+Array.from({length:36},(_,i)=>{const a=i*TAU/36,ri=ringRadius,ro=ringRadius+(i%3===0?7:3);return line(project(plus(origin,rads(ri/zoom,a))),project(plus(origin,rads(ro/zoom,a))),'#62768c',i%3===0?.34:.16)}).join('')+`<text x="360" y="14" text-anchor="middle" class="svg-small">FIXED-STAR REFERENCE · ECLIPTIC PLANE</text>`;
 const apart=(from,to,gap)=>{const d=minus(to,from),n=Math.hypot(d.x,d.y)||1;return {x:to.x+d.x/n*gap,y:to.y+d.y/n*gap+4,anchor:Math.abs(d.x/n)<.35?'middle':d.x>0?'start':'end'};};
 const label=(at,color,text)=>`<text x="${at.x.toFixed(1)}" y="${at.y.toFixed(1)}" text-anchor="${at.anchor}" class="svg-label" fill="${color}">${text}</text>`;
 const earthLabel=label(apart(pSun,pEarth,planetSize+12),palette.aqua,'Earth');
 const sunLabel=label(apart(pEarth,pSun,planetSize*5+12),palette.gold,'Sun');
 const marsLabel=`<text x="${pMars.x+12}" y="${pMars.y-13}" class="svg-label" fill="${palette.mars}">Mars</text>`;
 
 const miniLabel=(model==='geo'&&showGuides)?(()=>{const cp=project(c.epicycleCentre),pq=project(c.equant);return `<text x="${cp.x+10}" y="${cp.y-10}" class="svg-small">EPICYCLE CENTER</text><text x="${pq.x-8}" y="${pq.y-6}" text-anchor="end" class="svg-small">EQUANT</text>`;})():'';
 const clip=`<defs><radialGradient id="nebula"><stop offset="0%" stop-color="#314664" stop-opacity=".25"/><stop offset="100%" stop-color="#101a2b" stop-opacity="0"/></radialGradient><filter id="planetGlow" x="-400%" y="-400%" width="900%" height="900%"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
 $('universe').innerHTML=clip+`<ellipse cx="360" cy="240" rx="310" ry="235" fill="url(#nebula)"/>`+stars+axis+orbits+traces+constructions+drop+ray+dot(pSun,planetSize*5,palette.gold)+sunLabel+dot(pEarth,planetSize,palette.aqua)+earthLabel+dot(pMars,planetSize,palette.mars)+marsLabel+miniLabel;
 $('inscription').textContent=`DRAG TO ROTATE · TILTS ${exaggerate?'×10':'TRUE SCALE'}`;
}
function skyDial(){const s=sky(time),a=s.lon*deg;const x=75+49*Math.cos(a),y=75-49*Math.sin(a);const fixed=Array.from({length:24},(_,i)=>{const t=i*TAU/24;const xx=75+63*Math.cos(t),yy=75-63*Math.sin(t);return `<circle cx="${xx.toFixed(2)}" cy="${yy.toFixed(2)}" r="${i%3===0?1.6:1}" fill="#b4c7dc" opacity="${i%3===0?.6:.27}"/>`;}).join('');$('skyDial').innerHTML=`<defs><filter id="glowDial"><feGaussianBlur stdDeviation="3"/></filter></defs><circle cx="75" cy="75" r="61" fill="#17253970" stroke="#495f79" stroke-opacity=".6" stroke-width=".9"/>${fixed}<circle cx="75" cy="75" r="49" fill="none" stroke="#516a86" stroke-width=".7" stroke-dasharray="2 5"/><path d="M75 22V128M22 75H128" stroke="#4c637b" stroke-width=".5" stroke-opacity=".35"/><line x1="75" y1="75" x2="${x}" y2="${y}" stroke="#e4c79b" stroke-width="1.5" stroke-opacity=".85"/><circle cx="75" cy="75" r="4.8" fill="${palette.aqua}"/><circle cx="${x}" cy="${y}" r="11" fill="${palette.mars}" opacity=".16" filter="url(#glowDial)"/><circle cx="${x}" cy="${y}" r="4.5" fill="${palette.mars}"/><text x="75" y="147" text-anchor="middle" font-size="9" fill="#70869d" letter-spacing="1">FIXED STARS</text>`;const rate=apparentRate(time);const retro=rate<0; $('motion').textContent=retro?'↶ Retrograde · westward':'↷ Direct · eastward';$('motion').className='motion '+(retro?'retro':'direct');}
const chart=$('skyChart'),pathChart=$('pathChart'),chartLeft=88,chartRight=1115,chartTop=48,chartBottom=251;
let chartMinY=-8,chartMaxY=88,retroStart=0,retroEnd=0,loop=null,pathFrom=minDay,pathTo=maxDay;
const chartX=t=>chartLeft+(t-minDay)/(maxDay-minDay)*(chartRight-chartLeft);
const chartY=lon=>chartBottom-(lon-chartMinY)/(chartMaxY-chartMinY)*(chartBottom-chartTop);
const sampleTimes=(from,to,step=1)=>{const times=[];for(let t=from;t<to;t+=step)times.push(t);times.push(to);return times;};
const segment=(from,to)=>sampleTimes(from,to).map((t,i)=>`${i?'L':'M'}${chartX(t).toFixed(2)},${chartY(getLongitude(t)).toFixed(2)}`).join(' ');
function retroWindows(){let enter=null,exit=null;for(let t=minDay;t<=maxDay;t+=.1){const r=apparentRate(t);if(enter===null&&r<0)enter=t;if(enter!==null&&r>=0){exit=t;break;}}return [enter,exit];}
function niceStep(span,target){const raw=span/target,p=10**Math.floor(Math.log10(raw));return [1,2,5,10].map(k=>k*p).find(k=>k>=raw);}
function drawStaticChart(){
 const lons=sampleTimes(minDay,maxDay,2).map(t=>getLongitude(t)),lo=Math.min(...lons),hi=Math.max(...lons),pad=(hi-lo)*.08;chartMinY=lo-pad;chartMaxY=hi+pad;const step=niceStep(hi-lo,5);
 let s=`<defs><linearGradient id="retroShade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff9087" stop-opacity=".13"/><stop offset="1" stop-color="#ff9087" stop-opacity="0"/></linearGradient></defs>`;
 s+=`<rect x="${chartX(retroStart)}" y="${chartTop}" width="${chartX(retroEnd)-chartX(retroStart)}" height="${chartBottom-chartTop}" fill="url(#retroShade)"/><text x="${(chartX(retroStart)+chartX(retroEnd))/2}" y="29" fill="#ff9d8d" font-size="10" font-weight="760" text-anchor="middle" letter-spacing="1.4">RETROGRADE</text>`;
 for(let d=Math.ceil(chartMinY/step)*step;d<=chartMaxY;d+=step){const y=chartY(d);s+=`<line x1="${chartLeft}" x2="${chartRight}" y1="${y}" y2="${y}" stroke="#50627a" stroke-width="1" stroke-opacity=".34" stroke-dasharray="2 5"/><text x="${chartLeft-16}" y="${y+4}" text-anchor="end" font-size="12" fill="#889ab1">${((d%360)+360)%360}°</text>`;}
 for(let d=260;d<=550;d+=58){const x=chartX(d);s+=`<line x1="${x}" y1="${chartBottom}" x2="${x}" y2="${chartBottom+5}" stroke="#637790"/><text x="${x}" y="${chartBottom+22}" text-anchor="middle" fill="#8296ac" font-size="11">${Math.round(d+offset())}</text>`;}
 s+=`<text x="${chartLeft}" y="32" text-anchor="start" fill="#8296ac" font-size="10" letter-spacing="1.5">ECLIPTIC LONGITUDE · °</text><text x="${(chartLeft+chartRight)/2}" y="290" text-anchor="middle" fill="#8296ac" font-size="10" letter-spacing="1.5">SIMULATION DAY</text>`;
 s+=`<path d="${segment(minDay,maxDay)}" stroke="#9acbd1" stroke-opacity=".28" stroke-width="4" stroke-linecap="round" fill="none"/><path d="${segment(minDay,retroStart)}" stroke="${palette.aqua}" stroke-width="2.7" fill="none"/><path d="${segment(retroStart,retroEnd)}" stroke="#ff958b" stroke-width="3.6" stroke-linecap="round" fill="none"/><path d="${segment(retroEnd,maxDay)}" stroke="${palette.aqua}" stroke-width="2.7" fill="none"/>`;
 s+=`<g><line id="currentLine" x1="0" x2="0" y1="${chartTop}" y2="${chartBottom}" stroke="#d8c6a6" opacity=".8" stroke-width="1.2" stroke-dasharray="4 6"/><circle id="currentHalo" r="12" fill="#f9d8a2" opacity=".18"/><circle id="currentDot" r="5.1" fill="#f9d8a2" stroke="#101827" stroke-width="1.6"/></g>`;
 chart.innerHTML=s;
}
// Sky path: longitude increases to the left, as when facing south; degrees share one scale on both axes.
function drawPathChart(){
 pathFrom=Math.max(minDay,retroStart-50);pathTo=Math.min(maxDay,retroEnd+50);
 const pts=t=>({lon:getLongitude(t),lat:sky(t).lat}),all=sampleTimes(pathFrom,pathTo,1).map(pts);
 const lonLo=Math.min(...all.map(p=>p.lon)),lonHi=Math.max(...all.map(p=>p.lon)),latLo=Math.min(...all.map(p=>p.lat)),latHi=Math.max(...all.map(p=>p.lat));
 const k=Math.min((chartRight-chartLeft)/(lonHi-lonLo)/1.04,(chartBottom-chartTop)/Math.max(latHi-latLo,.5)/1.1),midLon=(lonLo+lonHi)/2,midLat=(latLo+latHi)/2,midX=(chartLeft+chartRight)/2,midY=(chartTop+chartBottom)/2;
 loop={x:lon=>midX-(lon-midLon)*k,y:lat=>midY-(lat-midLat)*k};
 const seg=(from,to)=>sampleTimes(from,to,.5).map(pts).map((p,i)=>`${i?'L':'M'}${loop.x(p.lon).toFixed(2)},${loop.y(p.lat).toFixed(2)}`).join(' ');
 let s='';const lonStep=niceStep(lonHi-lonLo,8),latStep=niceStep(latHi-latLo,4);
 for(let d=Math.ceil((midLat-(midY-chartTop)/k)/latStep)*latStep;d<=midLat+(midY-chartTop)/k;d+=latStep){const y=loop.y(d);s+=`<line x1="${chartLeft}" x2="${chartRight}" y1="${y}" y2="${y}" stroke="#50627a" stroke-width="1" stroke-opacity="${Math.abs(d)<1e-9?.7:.34}" stroke-dasharray="2 5"/><text x="${chartLeft-16}" y="${y+4}" text-anchor="end" font-size="12" fill="#889ab1">${Math.abs(d)<1e-9?'0°':Math.abs(+d.toFixed(2))+'°'+(d>0?' N':' S')}</text>`;}
 for(let d=Math.ceil((midLon-(midX-chartLeft)/k)/lonStep)*lonStep;d<=midLon+(midX-chartLeft)/k;d+=lonStep){const x=loop.x(d);s+=`<line x1="${x}" y1="${chartBottom}" x2="${x}" y2="${chartBottom+5}" stroke="#637790"/><text x="${x}" y="${chartBottom+22}" text-anchor="middle" fill="#8296ac" font-size="11">${((Math.round(d)%360)+360)%360}°</text>`;}
 s+=`<text x="${chartLeft}" y="32" text-anchor="start" fill="#8296ac" font-size="10" letter-spacing="1.5">ECLIPTIC LATITUDE</text><text x="${(chartLeft+chartRight)/2}" y="290" text-anchor="middle" fill="#8296ac" font-size="10" letter-spacing="1.5">← EAST · ECLIPTIC LONGITUDE · WEST →</text>`;
 s+=`<path d="${seg(pathFrom,retroStart)}" stroke="${palette.aqua}" stroke-width="2.7" fill="none"/><path d="${seg(retroStart,retroEnd)}" stroke="#ff958b" stroke-width="3.6" stroke-linecap="round" fill="none"/><path d="${seg(retroEnd,pathTo)}" stroke="${palette.aqua}" stroke-width="2.7" fill="none"/>`;
 s+=`<circle id="loopHalo" r="12" fill="#f9d8a2" opacity=".18"/><circle id="loopDot" r="5.1" fill="#f9d8a2" stroke="#101827" stroke-width="1.6"/>`;
 pathChart.innerHTML=s;
}
function moveChart(){const x=chartX(time),y=chartY(getLongitude(time));$('currentLine').setAttribute('x1',x);$('currentLine').setAttribute('x2',x);for(const id of ['currentHalo','currentDot']){const el=$(id);el.setAttribute('cx',x);el.setAttribute('cy',y);}const lx=loop.x(getLongitude(time)),ly=loop.y(sky(time).lat),shown=time>=pathFrom&&time<=pathTo;for(const id of ['loopHalo','loopDot']){const el=$(id);el.setAttribute('cx',lx);el.setAttribute('cy',ly);el.style.display=shown?'':'none';}}
function setResponsiveViewport(){const narrow=window.matchMedia('(max-width:900px)').matches;const mobile=window.matchMedia('(max-width:550px)').matches;$('universe').setAttribute('viewBox',narrow?'120 0 480 485':'0 0 720 485');for(const svg of [chart,pathChart]){if(narrow){const width=mobile?510:760,offsetX=Math.max(chartLeft,Math.min(chartRight-width,(svg===chart?chartX(time):loop.x(getLongitude(time)))-width/2));svg.setAttribute('viewBox',`${offsetX.toFixed(1)} 0 ${width} 295`);}else{svg.setAttribute('viewBox','0 0 1160 295');}}}
function repaint(){setResponsiveViewport();orbitSvg();skyDial();moveChart();$('timeline').value=time;$('dayLabel').textContent='Day '+Math.round(time+offset());$('oppLabel').textContent=`Opposition ${opposition+1} of 8`;$('playIcon').textContent=playing?'Ⅱ':'▶';$('playLabel').textContent=playing?'Pause':'Play';$('play').setAttribute('aria-label',playing?'Pause animation':'Play animation');}
function redrawCharts(){[retroStart,retroEnd]=retroWindows();drawStaticChart();drawPathChart();}
function selectModel(m){model=m;document.querySelectorAll('.tab').forEach(b=>{const selected=b.dataset.model===m;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});const a=descriptions[m];$('referenceNote').textContent=a.reference;$('modelHeadline').textContent=a.headline;$('explanation').textContent=a.copy;$('equation').textContent=a.equation;$('insight').textContent=a.insight;redrawCharts();repaint();}
function frame(ms){if(lastFrame!==null&&playing){const dt=Math.min(.06,(ms-lastFrame)/1000);time+=dt*10*speed;if(time>=maxDay){time=minDay;}}lastFrame=ms;if(playing)repaint();requestAnimationFrame(frame);}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>selectModel(b.dataset.model)));
$('play').addEventListener('click',()=>{playing=!playing;lastFrame=null;repaint();});
$('reset').addEventListener('click',()=>{time=minDay;playing=false;repaint();});
$('timeline').addEventListener('input',e=>{time=Number(e.target.value);repaint();});
$('construction').addEventListener('change',e=>{showGuides=e.target.checked;repaint();});
$('trails').addEventListener('change',e=>{showTrails=e.target.checked;repaint();});
$('exaggerate').addEventListener('change',e=>{exaggerate=e.target.checked;repaint();});
const stepOpposition=d=>{opposition=(opposition+d+8)%8;redrawCharts();repaint();};
$('oppPrev').addEventListener('click',()=>stepOpposition(-1));
$('oppNext').addEventListener('click',()=>stepOpposition(1));
let drag=null;const universe=$('universe');
universe.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};universe.setPointerCapture(e.pointerId);});
universe.addEventListener('pointermove',e=>{if(!drag)return;view.az+=(e.clientX-drag.x)*.008;view.tilt=Math.max(0,Math.min(88*deg,view.tilt+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};repaint();});
universe.addEventListener('pointerup',()=>{drag=null;});
universe.addEventListener('dblclick',()=>{view.az=-25*deg;view.tilt=55*deg;repaint();});
document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(s=>s.classList.toggle('selected',s===b));}));
window.addEventListener('keydown',e=>{if(['INPUT','BUTTON'].includes(document.activeElement?.tagName))return;if(e.key===' '){e.preventDefault();playing=!playing;repaint();}if(e.key==='ArrowRight'){time=Math.min(maxDay,time+1);repaint();}if(e.key==='ArrowLeft'){time=Math.max(minDay,time-1);repaint();}});
window.addEventListener('resize',repaint);selectModel('helio');requestAnimationFrame(frame);
})();
</script>
