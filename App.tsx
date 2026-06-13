
import React, { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  /*
     V8.0 LOGIC GENERATOR
     "Neural Vision" - custom CNN replaces Tesseract
     The CAPTCHA is a fixed format (6 chars, [0-9A-Z], fixed font, colored-line
     noise). A small 6-head CNN trained on synthetic look-alikes (see training/)
     reads it far more reliably than a general OCR engine. Inference runs fully
     client-side via onnxruntime-web — the image never leaves the browser.
       - Model: 3 conv blocks -> 6 softmax heads (one per character)
       - Input: captcha resized to 192x64 RGB, normalized /255 (NCHW)
       - Color is a feature: the net learns to ignore the colored noise lines,
         so no fragile binarization/threshold step is needed.
  */
  const getBookmarkletCode = () => {

    /* ────────────────────────────────────────────────────
       MODEL CONFIG  –  must match training/config.py
    ──────────────────────────────────────────────────── */
    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/wilburliu/portalOCRRRRR@main/model.onnx';
    const ORT_SCRIPT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
    const ORT_WASM_PATH = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
    const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUM_CHARS = 6;
    const IMG_W = 192, IMG_H = 64;

    const commonSetup = `
      if (window.ghostOCRActive) { alert('Ghost OCR v8.0 is already active.'); return; }
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
          updateUI('Ghost v8.0 (Neural)...');
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

          updateUI('Loading Neural Engine...');

          /* Load onnxruntime-web (once) */
          if (typeof ort === 'undefined') {
              await new Promise((resolve, reject) => {
                  var s = document.createElement('script');
                  s.src = '${ORT_SCRIPT}';
                  s.onload = resolve;
                  s.onerror = reject;
                  document.head.appendChild(s);
              });
          }
          ort.env.wasm.wasmPaths = '${ORT_WASM_PATH}';

          /* Wait for image to fully load */
          if(img instanceof HTMLImageElement && !img.complete)
              await new Promise(r => img.onload = r);

          /* Cache the session across runs on the page */
          if(!window.__ghostSession)
              window.__ghostSession = await ort.InferenceSession.create('${MODEL_URL}');
          var session = window.__ghostSession;

          /* ── Preprocess: crop to glyph bbox, resize to ${IMG_W}x${IMG_H} RGB, normalize /255, NCHW ── */
          updateUI('Reading (Neural)...');
          var W = ${IMG_W}, H = ${IMG_H};

          /* Content-aware crop — MUST match crop_to_content() in
             training/generate_synthetic.py. The model is trained on images
             cropped to the dark glyph bounding box then stretched to WxH, so we
             replicate that here (a plain resize misaligns the column-pooling head). */
          var nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
          var sc = document.createElement('canvas');
          sc.width = nw; sc.height = nh;
          var sctx = sc.getContext('2d');
          sctx.drawImage(img, 0, 0, nw, nh);
          var sd = sctx.getImageData(0, 0, nw, nh).data;
          var LUM = 110;                                  /* CROP_LUM_THR */
          var colCnt = new Int32Array(nw), rowCnt = new Int32Array(nh);
          for(var yy = 0; yy < nh; yy++){
              for(var xx = 0; xx < nw; xx++){
                  var o = (yy*nw + xx) * 4;
                  var lum = sd[o]*0.299 + sd[o+1]*0.587 + sd[o+2]*0.114;
                  if(lum < LUM){ colCnt[xx]++; rowCnt[yy]++; }
              }
          }
          var cthr = Math.max(1, Math.floor(0.06*nh));
          var rthr = Math.max(1, Math.floor(0.04*nw));
          var x0 = -1, x1 = -1, y0 = -1, y1 = -1;
          for(var xx = 0; xx < nw; xx++){ if(colCnt[xx] > cthr){ if(x0 < 0) x0 = xx; x1 = xx; } }
          for(var yy = 0; yy < nh; yy++){ if(rowCnt[yy] > rthr){ if(y0 < 0) y0 = yy; y1 = yy; } }
          var pad = 2, sx, sy, sw, sh;                    /* CROP_PAD */
          if(x0 < 0 || y0 < 0){ sx = 0; sy = 0; sw = nw; sh = nh; }   /* nothing found -> whole image */
          else {
              sx = Math.max(0, x0 - pad);
              sy = Math.max(0, y0 - pad);
              sw = Math.min(nw, x1 + 1 + pad) - sx;
              sh = Math.min(nh, y1 + 1 + pad) - sy;
          }

          var pc = document.createElement('canvas');
          pc.width = W; pc.height = H;
          var pctx = pc.getContext('2d');
          pctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);   /* crop + stretch */
          var px = pctx.getImageData(0, 0, W, H).data;   /* RGBA */
          var plane = W * H;
          var f = new Float32Array(3 * plane);
          for(var p = 0; p < plane; p++){
              f[p]           = px[p*4]     / 255;   /* R */
              f[plane + p]   = px[p*4 + 1] / 255;   /* G */
              f[2*plane + p] = px[p*4 + 2] / 255;   /* B */
          }
          var tensor = new ort.Tensor('float32', f, [1, 3, H, W]);
          var out = await session.run({ input: tensor });
          var logits = (out.logits || out[Object.keys(out)[0]]).data;

          /* ── Decode: per-head argmax + softmax confidence ── */
          var CHARSET = '${CHARSET}';
          var NC = CHARSET.length, NUM = ${NUM_CHARS};
          var text = '', confSum = 0;
          for(var ci = 0; ci < NUM; ci++){
              var bestK = 0, bestV = -1e9, mx = -1e9, sum = 0;
              for(var k = 0; k < NC; k++){
                  var v = logits[ci*NC + k];
                  if(v > bestV){ bestV = v; bestK = k; }
                  if(v > mx) mx = v;
              }
              for(var k = 0; k < NC; k++) sum += Math.exp(logits[ci*NC + k] - mx);
              confSum += Math.exp(bestV - mx) / sum;   /* top-1 softmax prob */
              text += CHARSET[bestK];
          }
          var bestConf = (confSum / NUM) * 100;
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
            v8.0 – Neural Vision
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-blue-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Engineered for <code className="text-blue-400">portal.ntuh.gov.tw</code>.
            Custom CNN · On-device inference · Noise-robust · <span className="text-white font-bold">Auto-Login</span>.
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
              <span>GHOST NTUH v8.0</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Neural CNN &bull; On-Device &bull; 6-Head Decode &bull; Auto Login
            </p>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 border-blue-500/20">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Neural Vision v8.0
                  </h3>
                  <p className="text-sm text-slate-400">
                      A custom CNN trained on this CAPTCHA's exact style — far more accurate than general OCR.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Custom CNN:</strong> 6-head model, one softmax per character.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>On-Device:</strong> Runs via onnxruntime-web — the image never leaves your browser.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Noise-Robust:</strong> Trained to ignore the colored noise lines, no thresholding.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Synthetic Training:</strong> Thousands of look-alike CAPTCHAs (see <code className="bg-slate-800 px-1 rounded">training/</code>).
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
