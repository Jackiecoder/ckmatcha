// A real-time matcha powder sculpture. Everything is rendered locally in WebGL.
export function createMatchaField(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) { canvas.parentElement.classList.add('no-webgl'); return { stir() {}, resize() {} }; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const vertex = `
    precision highp float;
    attribute vec4 aSeed;
    uniform float uTime, uIntro, uAspect, uDpr, uStir, uScale;
    uniform vec2 uMouse, uRotation;
    varying vec3 vColor;
    varying float vAlpha;
    mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
    void main(){
      float arm = floor(aSeed.y*3.);
      float theta = aSeed.x*9.6 + arm*2.094395 + uTime*(.04+(1.-aSeed.x)*.075);
      float phi = fract(aSeed.y*3.)*6.283185;
      float thick = pow(aSeed.z,.65)*(.055+aSeed.x*.16);
      float radius = .055 + pow(aSeed.x,.8)*1.26 + thick*cos(phi);
      vec3 p = vec3(cos(theta)*radius,sin(phi)*thick*.8,sin(theta)*radius);
      p.y += sin(theta*2. + uTime*.12)*.055;
      float cloud = (1.-uIntro)*2.8;
      p += vec3(sin(phi*7.),cos(theta*8.),sin(theta*5.))*cloud*aSeed.w;
      float dust = step(.92,aSeed.w);
      p *= 1. + dust*(aSeed.z*.75);
      p.xz = rot(uStir*.16*(1.-aSeed.z))*p.xz;
      p.yz = rot(.95 + uRotation.y*.35)*p.yz;
      p.xy = rot(-.22 + uRotation.x*.2 + sin(uTime*.07)*.08)*p.xy;
      p.xz = rot(uRotation.x*.25)*p.xz;
      float perspective = 2.85/(3.3+p.z);
      vec2 screen = p.xy*perspective*uScale;
      vec2 mouse = vec2(uMouse.x*uAspect,uMouse.y);
      float distanceToMouse = length(screen-mouse);
      float influence = exp(-distanceToMouse*distanceToMouse*6.) * .10;
      screen += (screen-mouse) * influence * (1.+uStir*.5);
      gl_Position = vec4(screen.x/uAspect,screen.y+.03, .2, 1.);
      gl_PointSize = max(1., (1.6+aSeed.w*1.6)*perspective*uDpr);
      float light = .50 + .50*(cos(theta-.9)*.5+.5);
      float edge = cos(phi)*.2+.8;
      vColor = mix(vec3(.24,.42,.075),vec3(.73,.88,.28), light*edge);
      vColor += vec3(.08,.08,.02)*sin(phi*11.)*aSeed.z;
      vAlpha = (.60+aSeed.z*.30)*(1.-dust*.72)*uIntro;
    }`;
  const fragment = `precision mediump float;varying vec3 vColor;varying float vAlpha;
    void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;
    float a=smoothstep(.5,.16,d)*vAlpha;gl_FragColor=vec4(vColor,a);}`;
  function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const count = window.innerWidth < 700 ? 32000 : 74000;
  const seeds = new Float32Array(count * 4);
  let n = 173;
  function random() { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; }
  for (let i = 0; i < seeds.length; i++) seeds[i] = random();
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'aSeed'); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr, 4, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const uniforms = {}; for (const name of ['uTime','uIntro','uAspect','uDpr','uStir','uScale','uMouse','uRotation']) uniforms[name] = gl.getUniformLocation(program, name);
  let width=1,height=1,dpr=1,frame=0,start=performance.now(),last=0,time=0,visible=true,dragging=false,stirAmount=0;
  const target={x:0,y:0},rotation={x:0,y:0},mouse={x:9,y:9};
  function resize(){ const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);wake(); }
  resize(); new ResizeObserver(resize).observe(canvas);
  function render(now) {
    frame=0;if(!visible||document.hidden)return;
    const dt=Math.min((now-last)||16,50);last=now;if(!reduced.matches)time+=dt/1000;
    rotation.x+=(target.x-rotation.x)*.04;rotation.y+=(target.y-rotation.y)*.04;stirAmount*=.97;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uIntro,reduced.matches?1:Math.min(1,(now-start)/2300));gl.uniform1f(uniforms.uAspect,width/height);gl.uniform1f(uniforms.uDpr,dpr);gl.uniform1f(uniforms.uStir,stirAmount);gl.uniform1f(uniforms.uScale,Math.min(.74,width/height*.73));
    gl.uniform2f(uniforms.uMouse,mouse.x,mouse.y);gl.uniform2f(uniforms.uRotation,rotation.x,rotation.y);gl.drawArrays(gl.POINTS,0,count);
    canvas.dataset.rendered='true';canvas.dataset.rotation=`${rotation.x.toFixed(2)},${rotation.y.toFixed(2)}`;
    if(!reduced.matches||dragging||stirAmount>.01||Math.abs(target.x-rotation.x)>.001||Math.abs(target.y-rotation.y)>.001)frame=requestAnimationFrame(render);
  }
  function wake(){if(!frame&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(render);}}
  function updatePointer(e){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*2-1;const y=-((e.clientY-r.top)/r.height*2-1);mouse.x=x;mouse.y=y;target.x=x*1.7;target.y=y*.9;wake();}
  canvas.addEventListener('pointermove',updatePointer);canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;if(e.pointerType==='mouse')canvas.setPointerCapture(e.pointerId);updatePointer(e);stirAmount=3;wake();});
  canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});canvas.addEventListener('pointerleave',()=>{mouse.x=9;mouse.y=9;if(!dragging){target.x=0;target.y=0;}});
  function stir(){stirAmount=5;wake();}
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key===' ')stir();else if(e.key==='ArrowLeft')target.x-=.4;else if(e.key==='ArrowRight')target.x+=.4;else if(e.key==='ArrowUp')target.y+=.4;else target.y-=.4;wake();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else if(frame){cancelAnimationFrame(frame);frame=0;}},{threshold:.01}).observe(canvas);
  document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);canvas.parentElement.classList.add('no-webgl');});
  wake();return {stir,resize};
}
