
import React, { useEffect, useRef, useState } from 'react';

type EngineType = 'standard' | 'deep_probe';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [engine, setEngine] = useState<EngineType>('deep_probe');

  /* 
     V6.0 LOGIC GENERATOR 
     "Deep Probe" - Specialized for ASP.NET Portals (NTUH)
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
        
        // 1. Grayscale
        var gray = new Uint8Array(w*h);
        var totalLum = 0;
        for(var i=0; i<d.length; i+=4){
            var lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
            gray[i/4] = lum;
            totalLum += lum;
        }
        
        // 2. Auto-Invert (if dark background)
        var avg = totalLum / (w*h);
        if(avg < 128) {
            for(var i=0; i<gray.length; i++) gray[i] = 255 - gray[i];
        }

        // 3. Simple Thresholding (High Contrast)
        for(var i=0; i<d.length; i+=4) {
           var val = gray[i/4] < 135 ? 0 : 255;
           d[i] = d[i+1] = d[i+2] = val; 
           d[i+3] = 255;
        }
        ctx.putImageData(idata, 0, 0);
      }
    `;

    const commonSetup = `
      if (window.ghostOCRActive) { alert('Ghost OCR v6.0 is already active.'); return; }
      window.ghostOCRActive = true;
      var UI_ID = 'ghost-ocr-hud';
      
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
        // Remove debug borders
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
             // 1. Inputs: Fuzzy Search for ASP.NET patterns (ctl00$txtVerifyCode, etc.)
             var inputs = root.querySelectorAll('input[type="text"]:not([readonly]), input[type="tel"], input[type="number"]');
             var targetInput = null;
             
             // Prioritize exact user request
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
             
             // 2. Images: Fuzzy Search
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

             if(targetInput || targetImg) return { input: targetInput, img: targetImg };

             // 3. Iframe Recursion
             var frames = root.querySelectorAll('iframe, frame');
             for(var i=0; i<frames.length; i++){
                 try {
                    var d = frames[i].contentDocument || frames[i].contentWindow.document;
                    var res = scan(d);
                    if(res.input || res.img) return res; 
                 } catch(e){}
             }
             return { input: null, img: null };
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
            
            // Dispatch key events for listeners
            var evts = ['keydown', 'keypress', 'input', 'keyup'];
            evts.forEach(function(e){
                input.dispatchEvent(new KeyboardEvent(e, {key: char, bubbles:true}));
            });
            
            // Human delay (30-70ms)
            await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
         }
         
         input.dispatchEvent(new Event('change', {bubbles:true}));
         input.blur();
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v6.0 (Deep Probe)...');
          var els = findElements();
          var img = els.img;
          var input = els.input;

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

            // If we found one but not the other, try scanning again or ask again
            if(!input || !img) {
                 // Try one last scan relative to the clicked element? 
                 // Simple approach: Ask for the second element.
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
          
          // Upscale for accuracy
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

          updateUI('DONE! (Code Copied)');
          setTimeout(cleanup, 3000);
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
  }, [engine]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 lg:p-12 font-sans">
      <div className="max-w-4xl w-full space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold tracking-widest uppercase">
            v6.0 - NTUH Deep Probe
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className={engine === 'deep_probe' ? "text-blue-500" : "text-slate-500"}>OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Engineered for <code className="text-blue-400">portal.ntuh.gov.tw</code>.
            Features fuzzy ID matching, visual debugging, and human typing simulation.
          </p>
        </header>

        <div className="flex justify-center">
            <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/10 flex space-x-2">
                <button 
                    onClick={() => setEngine('standard')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'standard' ? 'bg-slate-700 text-white shadow-lg' : 'hover:text-white text-slate-500'}`}
                >
                    Standard
                </button>
                <button 
                    onClick={() => setEngine('deep_probe')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'deep_probe' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:text-white text-slate-500'}`}
                >
                    Deep Probe (NTUH)
                </button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className={`bg-slate-900/40 backdrop-blur-xl border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden transition-colors ${engine === 'deep_probe' ? 'border-blue-500/10' : 'border-slate-500/10'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 ${engine === 'deep_probe' ? 'via-blue-500' : 'via-slate-500'}`}></div>
            
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${engine === 'deep_probe' ? 'bg-blue-600/20 text-blue-500' : 'bg-slate-700/20 text-slate-400'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className={`group relative px-12 py-6 rounded-2xl text-white font-black text-xl flex items-center space-x-4 shadow-2xl transition-all hover:-translate-y-2 select-none cursor-move z-10 ${engine === 'deep_probe' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' : 'bg-slate-600 hover:bg-slate-500'}`}
              onClick={(e) => e.preventDefault()}
            >
              <span>{engine === 'deep_probe' ? 'GHOST NTUH v6.0' : 'GHOST FILL v6.0'}</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              ASP.NET Compatible &bull; Click Fallback Support
            </p>
          </div>

          <div className="space-y-6">
              <div className={`bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 ${engine === 'deep_probe' ? 'border-blue-500/20' : 'border-white/5'}`}>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Deep Probe Technology
                  </h3>
                  <p className="text-sm text-slate-400">
                      Specifically designed for the NTUH portal. 
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
                        <strong>Clipboard:</strong> Copies code to clipboard as backup.
                      </li>
                  </ul>
              </div>

               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 uppercase">Usage</h4>
                   <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">1.</span> <span>Drag button to bookmarks.</span></li>
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">2.</span> <span>Go to NTUH Portal.</span></li>
                        <li className="flex gap-3"><span className="text-blue-400 font-bold">3.</span> <span>Click. If it fails to find the box, it will ask you to click it.</span></li>
                    </ul>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
