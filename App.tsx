
import React, { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  /* 
     V6.3 LOGIC GENERATOR 
     "Deep Probe" - Specialized for ASP.NET Portals (NTUH)
     Added: Auto-Login targeting 'imgBtnSubmitNew'.
     Fixed: SyntaxError due to single-line comment.
  */
  const getBookmarkletCode = () => {
    
    /* 
       VISION KERNEL 
       Simplified but robust binarization for server-generated CAPTCHAs
    */
    const visionKernel = `
      function processImage(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var idata = ctx.getImageData(0,0,w,h);
        var d = idata.data;
        
        /* 1. Grayscale */
        var gray = new Uint8Array(w*h);
        var totalLum = 0;
        for(var i=0; i<d.length; i+=4){
            var lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
            gray[i/4] = lum;
            totalLum += lum;
        }
        
        /* 2. Auto-Invert (if dark background) */
        var avg = totalLum / (w*h);
        if(avg < 128) {
            for(var i=0; i<gray.length; i++) gray[i] = 255 - gray[i];
        }

        /* 3. Simple Thresholding (High Contrast) */
        for(var i=0; i<d.length; i+=4) {
           var val = gray[i/4] < 135 ? 0 : 255;
           d[i] = d[i+1] = d[i+2] = val; 
           d[i+3] = 255;
        }
        ctx.putImageData(idata, 0, 0);
      }
    `;

    const commonSetup = `
      if (window.ghostOCRActive) { alert('Ghost OCR v6.3 is already active.'); return; }
      window.ghostOCRActive = true;
      var UI_ID = 'ghost-ocr-hud';
      
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
        /* Remove debug borders */
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
             /* 1. Inputs: Fuzzy Search for ASP.NET patterns */
             var inputs = root.querySelectorAll('input[type="text"]:not([readonly]), input[type="tel"], input[type="number"]');
             var targetInput = null;
             
             /* Prioritize exact user request */
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
             
             /* 2. Images: Fuzzy Search */
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

             /* 3. Submit Button: Targeted Search for imgBtnSubmitNew */
             var targetSubmit = null;
             
             /* High Priority: imgBtnSubmitNew (NTUH specific) */
             var specificBtn = root.querySelector('[name="imgBtnSubmitNew"], [id="imgBtnSubmitNew"]');
             if (specificBtn) {
                 targetSubmit = specificBtn;
             } else {
                 /* Low Priority: Fuzzy Search */
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

             /* 4. Iframe Recursion */
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
            
            /* Dispatch key events for listeners */
            var evts = ['keydown', 'keypress', 'input', 'keyup'];
            evts.forEach(function(e){
                input.dispatchEvent(new KeyboardEvent(e, {key: char, bubbles:true}));
            });
            
            /* Human delay 30-70ms */
            await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
         }
         
         input.dispatchEvent(new Event('change', {bubbles:true}));
         input.blur();
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v6.3 (Auto-Login)...');
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

            /* If we found one but not the other, try scanning again or ask again */
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

          var c = document.createElement('canvas');
          var ctx = c.getContext('2d');
          if(img instanceof HTMLImageElement && !img.complete) await new Promise(r => img.onload = r);
          
          /* Upscale for accuracy */
          var scale = 3;
          c.width = (img.naturalWidth || img.width) * scale;
          c.height = (img.naturalHeight || img.height) * scale;
          ctx.drawImage(img, 0, 0, c.width, c.height);

          processImage(c);

          updateUI('Reading...');
          var worker = await Tesseract.createWorker('eng', 1);
          await worker.setParameters({ 
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            tessedit_pageseg_mode: '7'
          });
          
          var res = await worker.recognize(c);
          await worker.terminate();

          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
          if(!text) throw new Error('No text found');
          
          updateUI('Typing: ' + text);
          
          /* TYPEWRITER FILL */
          await typeWriter(input, text);
          
          /* CLIPBOARD BACKUP */
          try { navigator.clipboard.writeText(text); } catch(e){}

          /* AUTO-LOGIN EXECUTION */
          updateUI('Logging In...');
          await new Promise(r => setTimeout(r, 400)); /* Short human delay */
          
          if (submit) {
             submit.click();
             updateUI('DONE! (Clicked Login)');
          } else {
             /* Fallback: Press Enter on the input */
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
            v6.3 - NTUH Auto-Login
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-blue-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Engineered for <code className="text-blue-400">portal.ntuh.gov.tw</code>.
            Features fuzzy ID matching, visual debugging, and <span className="text-white font-bold">Auto-Login</span>.
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
              <span>GHOST NTUH v6.3</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              ASP.NET Compatible &bull; Click Fallback &bull; Auto Login
            </p>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 border-blue-500/20">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Deep Probe Technology
                  </h3>
                  <p className="text-sm text-slate-400">
                      Single-engine dedicated to solving NTUH Portal CAPTCHAs.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Visual Debug:</strong> Draws a <span className="text-red-400">RED BOX</span> around the input it finds.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Typewriter:</strong> Types 1 character at a time to bypass bot detection.
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
