import sys,re
src,js,out=sys.argv[1:4]
s=open(src).read()
def rep(a,b):
    global s
    assert s.count(a)==1,('NOT UNIQUE/FOUND',a[:70],s.count(a)); s=s.replace(a,b)
i=s.index('<script>'); j=s.index('</script>')+len('</script>')
s=s[:i]+open(js).read().strip()+s[j:]
rep('<title>Mars Retrograde — LessWrong Interactive Widget','<title>Mars Retrograde in 3D')
rep('</style>\n</head>','#universe{cursor:grab;touch-action:none}\n#pathChart{width:100%;height:auto;display:block}\n.opp-label{font-size:11px;color:#c9d5e2;white-space:nowrap;padding:0 4px;font-variant-numeric:tabular-nums}\n</style>\n</head>')
rep('aria-label="Animated orbital diagram of Mars, Earth, and the Sun"','aria-label="Animated three-dimensional orbital diagram of Mars, Earth, and the Sun; drag to rotate"')
rep('<div class="stage-inscription">ORBITAL PLANE · SCHEMATIC</div>','<div class="stage-inscription" id="inscription">DRAG TO ROTATE</div>')
rep('<label class="opt"><input id="trails" type="checkbox" checked>Trails</label>','<label class="opt"><input id="trails" type="checkbox" checked>Trails</label><label class="opt"><input id="exaggerate" type="checkbox" checked>Tilts ×10</label>')
rep('<div class="speed"><span>SPEED</span>','<div class="speed"><button type="button" id="oppPrev" aria-label="Earlier opposition">◀</button><output class="opp-label" id="oppLabel">Opposition</output><button type="button" id="oppNext" aria-label="Later opposition">▶</button></div><div class="speed"><span>SPEED</span>')
rep('for the selected model"></svg></section>','for the selected model"></svg></section>\n <section class="panel chart-panel"><div class="chart-head"><div><div class="kicker">04 — The loop in the sky</div><div class="chart-title">Mars against the stars</div></div><div class="chart-legend"><span><i class="line"></i>direct</span><span><i class="line back"></i>retrograde</span></div></div><svg id="pathChart" viewBox="0 0 1160 295" role="img" aria-label="Mars’s ecliptic latitude against longitude for the selected model, showing the shape of the retrograde loop"></svg></section>')
f0=s.index('<footer class="footer">'); f1=s.index('</footer>')+len('</footer>')
s=s[:f0]+'''<footer class="footer"><strong>About this model.</strong> Three-dimensional reconstructions using each astronomer’s own Mars parameters. Longitudes: Ptolemy’s <em>Almagest</em> X, Copernicus’s <em>De revolutionibus</em> V, and Copernicus’s values again in Tycho’s Earth-fixed frame, with Tycho’s solar eccentricity of 0.0358. Latitudes: Ptolemy’s eccentric tilted 1° and his rocking epicycle (2;15 to the eccentric at the limits, parallel to the ecliptic at the nodes, varied here as a cosine), and Copernicus’s orbit tilt rocking from 0;10 to 1;50 with Earth’s position. The Tychonic model uses Copernicus’s latitudes. All three share mean periods of 365.25 and 686.98 days and Ptolemy’s apsidal lines, with Mars’s northern limit at its apogee. Omitted: the slow drift of the apsides and nodes, and Copernicus’s variable solar eccentricity. Kepler’s ellipses (1609), in planes through the true Sun, replaced all three.</footer>'''+s[f1:]
open(out,'w').write(s)
