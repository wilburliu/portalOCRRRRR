
import React, { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  /* 
     V7.0 LOGIC GENERATOR 
     "Adaptive Vision" - OCR Accuracy Overhaul
     Improvements over v6.3:
       - Gaussian blur (3x3) before threshold  → kills noise speckles
       - Otsu's auto-threshold               → adapts to each CAPTCHA's brightness
       - 12px white padding                  → prevents edge character clipping
       - Scale 4x (was 3x)                   → higher res for Tesseract
       - Multi-pass OCR (bias 0/+20/-20)     → picks highest-confidence pass
  */
  const getBookmarkletCode = () => {

    /* ────────────────────────────────────────────────────
       VISION KERNEL v2  –  Adaptive multi-pass pipeline
    ──────────────────────────────────────────────────── */
    const visionKernel = `
      /* Convert RGBA pixel array to Float32 grayscale */
      function toGray(d, w, h) {
          var g = new Float32Array(w*h);
          for(var i=0;i<d.length;i+=4)
              g[i>>2] = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
          return g;
      }

      /* 3×3 Gaussian blur – smooths noise before thresholding */
      function gaussBlur(g, w, h) {
          var k=[1,2,1,2,4,2,1,2,1], o=new Float32Array(w*h);
          for(var y=0;y<h;y++) for(var x=0;x<w;x++){
              var s=0,ki=0;
              for(var dy=-1;dy<=1;dy++) for(var dx=-1;dx<=1;dx++){
                  var ny=Math.max(0,Math.min(h-1,y+dy));
                  var nx=Math.max(0,Math.min(w-1,x+dx));
                  s+=g[ny*w+nx]*k[ki++];
              }
              o[y*w+x]=s/16;
          }
          return o;
      }

      /* Otsu's method – finds optimal threshold for bimodal histogram */
      function otsu(g) {
          var n=g.length, hist=new Int32Array(256);
          for(var i=0;i<n;i++) hist[Math.min(255,g[i]|0)]++;
          var sum=0; for(var t=0;t<256;t++) sum+=t*hist[t];
          var sB=0,wB=0,mx=0,T=128;
          for(var t=0;t<256;t++){
              wB+=hist[t]; if(!wB) continue;
              var wF=n-wB; if(!wF) break;
              sB+=t*hist[t];
              var mB=sB/wB, mF=(sum-sB)/wF, v=wB*wF*(mB-mF)*(mB-mF);
              if(v>mx){mx=v;T=t;}
          }
          return T;
      }

      /*
        makeProcessed(srcCanvas, bias)
        Returns a NEW canvas: padded, blurred, binarized.
        bias shifts the Otsu threshold up or down (+20 / 0 / -20).
      */
      function makeProcessed(src, bias) {
          var PAD=12, sw=src.width, sh=src.height;
          var c=document.createElement('canvas');
          c.width=sw+PAD*2; c.height=sh+PAD*2;
          var ctx=c.getContext('2d');

          /* White background then paste source centered */
          ctx.fillStyle='#ffffff';
          ctx.fillRect(0,0,c.width,c.height);
          ctx.drawImage(src,PAD,PAD);

          var id=ctx.getImageData(0,0,c.width,c.height), d=id.data;
          var g=gaussBlur(toGray(d,c.width,c.height),c.width,c.height);

          /* Clamp threshold to a safe range */
          var T=Math.max(60,Math.min(210, otsu(g)+(bias||0)));

          /* Detect dark-on-light vs light-on-dark
             (after padding, most extra pixels are white → ratio < 0.55 is typical) */
          var dark=0;
          for(var i=0;i<g.length;i++) if(g[i]<T) dark++;
          var inv=dark > g.length*0.55;

          /* Binarise */
          for(var i=0;i<d.length;i+=4){
              var fg=inv?(g[i>>2]>=T):(g[i>>2]<T);
              d[i]=d[i+1]=d[i+2]=fg?0:255; d[i+3]=255;
          }
          ctx.putImageData(id,0,0);
          return c;
      }
    `;

    const commonSetup = `
      if (window.ghostOCRActive) { alert('Ghost OCR v7.0 is already active.'); return; }
      window.ghostOCRActive = true;
      var UI_ID = 'ghost-ocr-hud';
      
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
        var debugs = document.querySelectorAll('.ghost-debug-border');
        debugs.forEach(e => e.classList.remove('ghost-debug-border'));
      }

      function updateUI(text, isError) {
        var hud = document.getElementById(UI_ID);
        if (!hud) {
          hud = document.createElement('div');
          hud.id = UI_ID;
          hud.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0f172a;color:#fff;padding:12px 24px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:2px solid #3b82f6;display:flex;align-items:center;gap:10px;pointer-events:none;';
          document.body.appendChild(hud);
        }
        if (isError) {
            hud.style.borderColor = '#ef4444';
            hud.style.background = '#450a0a';
        } else {
            hud.style.borderColor = '#3b82f6';
            hud.style.background = '#0f172a';
        }
        hud.innerHTML = (isError ? '❌ ' : '⚡ ') + text;
      }

      /* DEEP PROBE SELECTOR */
      function findElements() {
          function scan(root) {
             var inputs = root.querySelectorAll('input[type="text"]:not([readonly]), input[type="tel"], input[type="number"]');
             var targetInput = null;
             
             var exact = root.getElementById('txtVerifyCode');
             if(exact) targetInput = exact;
             else {
                 for(var i=0; i<inputs.length; i++) {
                    var id = (inputs[i].id || '').toLowerCase();
                    var name = (inputs[i].name || '').toLowerCase();
                    if(id.indexOf('verify') > -1 || id.indexOf('captcha') > -1 || id.indexOf('code') > -1 ||
                       name.indexOf('verify') > -1 || name.indexOf('captcha') > -1) {
                       targetInput = inputs[i];
                       break;
                    }
                 }
             }
             
             var imgs = root.querySelectorAll('img, canvas');
             var targetImg = null;
             for(var i=0; i<imgs.length; i++) {
                 var src = (imgs[i].src || '').toLowerCase();
                 var id = (imgs[i].id || '').toLowerCase();
                 if(src.indexOf('captcha') > -1 || src.indexOf('validate') > -1 || src.indexOf('verify') > -1 || 
                    id.indexOf('captcha') > -1 || id.indexOf('vcode') > -1) {
                     targetImg = imgs[i];
                     break;
                 }
             }

             var targetSubmit = null;
             var specificBtn = root.querySelector('[name="imgBtnSubmitNew"], [id="imgBtnSubmitNew"]');
             if (specificBtn) {
                 targetSubmit = specificBtn;
             } else {
                 var submits = root.querySelectorAll('input[type="submit"], button, a.button, a[role="button"], input[type="image"]');
                 var exactBtn = root.getElementById('btnLogin');
                 if(exactBtn) targetSubmit = exactBtn;
                 else {
                    for(var i=0; i<submits.length; i++) {
                        var id = (submits[i].id || '').toLowerCase();
                        var name = (submits[i].name || '').toLowerCase();
                        var val = (submits[i].value || submits[i].innerText || '').toLowerCase();
                        if (id.indexOf('login') > -1 || name.indexOf('login') > -1 || id.indexOf('btn') > -1 || 
                            val.indexOf('登入') > -1 || val.indexOf('login') > -1 || val.indexOf('sign in') > -1) {
                            targetSubmit = submits[i];
                            break;
                        }
                    }
                 }
             }

             if(targetInput || targetImg || targetSubmit) return { input: targetInput, img: targetImg, submit: targetSubmit };

             var frames = root.querySelectorAll('iframe, frame');
             for(var i=0; i<frames.length; i++){
                 try {
                    var d = frames[i].contentDocument || frames[i].contentWindow.document;
                    var res = scan(d);
                    if(res.input || res.img) return res; 
                 } catch(e){}
             }
             return { input: null, img: null, submit: null };
          }
          return scan(document);
      }
      
      /* SIMULATE HUMAN TYPING */
      async function typeWriter(input, text) {
         input.focus();
         input.click();
         input.value = '';
         
         for(var i=0; i<text.length; i++) {
            var char = text[i];
            input.value += char;
            var evts = ['keydown', 'keypress', 'input', 'keyup'];
            evts.forEach(function(e){
                input.dispatchEvent(new KeyboardEvent(e, {key: char, bubbles:true}));
            });
            await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
         }
         input.dispatchEvent(new Event('change', {bubbles:true}));
         input.blur();
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v7.0 (Adaptive)...');
          var els = findElements();
          var img = els.img;
          var input = els.input;
          var submit = els.submit;

          /* FALLBACK: Manual Selection */
          if (!img || !input) {
            updateUI(img ? 'Click the Input Box...' : 'Click the Captcha...', true);
            
            var clicked = await new Promise(r => {
                function h(e){ 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    document.removeEventListener('click',h,true); 
                    r(e.target); 
                }
                document.addEventListener('click', h, true);
            });
            
            if(!img) img = clicked; 
            else input = clicked;

            if(!input || !img) {
                 updateUI(input ? 'Now Click the Captcha...' : 'Now Click the Input Box...', true);
                 var clicked2 = await new Promise(r => {
                    function h(e){ e.preventDefault(); e.stopPropagation(); document.removeEventListener('click',h,true); r(e.target); }
                    document.addEventListener('click', h, true);
                 });
                 if(!input) input = clicked2; else img = clicked2;
            }
          }

          /* VISUAL DEBUGGING: Mark what we found */
          if(input) {
              input.style.border = '3px solid #f00'; 
              input.style.boxShadow = '0 0 10px #f00';
              input.classList.add('ghost-debug-border');
          }
          if(img) {
              img.style.border = '3px solid #0f0';
              img.classList.add('ghost-debug-border');
          }
          if(submit) {
              submit.style.border = '3px solid #00f';
              submit.classList.add('ghost-debug-border');
          }

          updateUI('Loading Engine...');
          
          if (typeof Tesseract === 'undefined') {
              await new Promise((resolve, reject) => {
                  var s = document.createElement('script');
                  s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                  s.onload = resolve;
                  s.onerror = reject;
                  document.head.appendChild(s);
              });
          }

          /* Wait for image to fully load */
          if(img instanceof HTMLImageElement && !img.complete)
              await new Promise(r => img.onload = r);
          
          /* ── STEP 1: Upscale raw canvas to 4× ── */
          var scale = 4;
          var rawCanvas = document.createElement('canvas');
          var rawCtx = rawCanvas.getContext('2d');
          rawCanvas.width  = (img.naturalWidth  || img.width)  * scale;
          rawCanvas.height = (img.naturalHeight || img.height) * scale;
          rawCtx.drawImage(img, 0, 0, rawCanvas.width, rawCanvas.height);

          /* ── STEP 2: Multi-pass OCR — Otsu + 3 bias offsets ── */
          updateUI('Reading (Adaptive)...');
          var worker = await Tesseract.createWorker('eng', 1);
          await worker.setParameters({ 
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            tessedit_pageseg_mode: '7',
            tessedit_unrej_any_wd: '1'
          });

          var biases = [0, 20, -20];
          var bestText = '', bestConf = -1;

          for(var bi=0; bi<biases.length; bi++){
              try {
                  var processed = makeProcessed(rawCanvas, biases[bi]);
                  var res = await worker.recognize(processed);
                  var candidate = res.data.text.replace(/[^a-zA-Z0-9]/g,'').trim().toUpperCase();
                  if(candidate.length > 0 && res.data.confidence > bestConf){
                      bestConf = res.data.confidence;
                      bestText = candidate;
                  }
              } catch(e){}
          }

          await worker.terminate();

          var text = bestText;
          if(!text) throw new Error('No text found');
          
          updateUI('Typing: ' + text + '  (conf:' + Math.round(bestConf) + '%)');
          
          /* TYPEWRITER FILL */
          await typeWriter(input, text);
          
          /* CLIPBOARD BACKUP */
          try { navigator.clipboard.writeText(text); } catch(e){}

          /* AUTO-LOGIN EXECUTION */
          updateUI('Logging In...');
          await new Promise(r => setTimeout(r, 400));
          
          if (submit) {
             submit.click();
             updateUI('DONE! (Clicked Login)');
          } else {
             input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
             updateUI('DONE! (Sent Enter Key)');
          }

          setTimeout(cleanup, 4000);
        } catch(e) {
            console.error(e);
            updateUI('Error: ' + e.message, true);
            setTimeout(cleanup, 4000);
        }
      }
    `;

    const fullScript = `(function(){ 
        ${visionKernel}
        ${commonSetup} 
        ${runLogic} 
        run(); 
    })();`.replace(/\s+/g, ' ');
    
    return fullScript;
  };

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.href = `javascript:${encodeURIComponent(getBookmarkletCode())}`;
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 lg:p-12 font-sans">
      <div className="max-w-4xl w-full space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold tracking-widest uppercase">
            v7.0 – Adaptive Vision
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-blue-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Engineered for <code className="text-blue-400">portal.ntuh.gov.tw</code>.
            Adaptive threshold · Noise filtering · Multi-pass · <span className="text-white font-bold">Auto-Login</span>.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-slate-900/40 backdrop-blur-xl border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden transition-colors border-blue-500/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 via-blue-500"></div>
            
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner bg-blue-600/20 text-blue-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className="group relative px-12 py-6 rounded-2xl text-white font-black text-xl flex items-center space-x-4 shadow-2xl transition-all hover:-translate-y-2 select-none cursor-move z-10 bg-blue-600 hover:bg-blue-500 shadow-blue-900/40"
              onClick={(e) => e.preventDefault()}
            >
              <span>GHOST NTUH v7.0</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Adaptive OCR &bull; 4× Scale &bull; Multi-Pass &bull; Auto Login
            </p>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 border-blue-500/20">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Adaptive Vision v7.0
                  </h3>
                  <p className="text-sm text-slate-400">
                      Overhauled OCR pipeline for higher accuracy on NTUH Portal CAPTCHAs.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Otsu Threshold:</strong> Auto-computes optimal binarization per CAPTCHA.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Gaussian Blur:</strong> Smooths noise before thresholding.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>4× Scale + Padding:</strong> More pixels, no edge clipping.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Multi-Pass:</strong> Tries 3 threshold variants, picks highest confidence.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Auto-Login:</strong> Clicks <code className="bg-slate-800 px-1 rounded">imgBtnSubmitNew</code> automatically.
                      </li>
                  </ul>
              </div>

               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 uppercase">Usage</h4>
                   <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">1.</span> <span>Drag button to bookmarks.</span></li>
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">2.</span> <span>Go to NTUH Portal.</span></li>
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">3.</span> <span>Click. It will fill the code and log you in.</span></li>
                    </ul>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
