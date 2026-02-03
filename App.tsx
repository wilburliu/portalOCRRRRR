
import React, { useEffect, useRef, useState } from 'react';

type EngineType = 'fast' | 'enhanced';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [engine, setEngine] = useState<EngineType>('enhanced');

  /* 
     V5.2 LOGIC GENERATOR 
     "Omni-Inject" - Fixes specific ASP.NET/jQuery input resistance
  */
  const getBookmarkletCode = () => {
    
    const visionKernel = `
      function processImage(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var idata = ctx.getImageData(0,0,w,h);
        var d = idata.data;
        
        var gray = new Uint8Array(w*h);
        var totalLum = 0;
        for(var i=0; i<d.length; i+=4){
            var lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
            gray[i/4] = lum;
            totalLum += lum;
        }
        var avgLum = totalLum / (w*h);
        
        if(avgLum < 128) {
            for(var i=0; i<gray.length; i++) gray[i] = 255 - gray[i];
        }
        
        var cleaned = new Uint8Array(w*h);
        for(var y=1; y<h-1; y++){
            for(var x=1; x<w-1; x++){
                var idx = y*w + x;
                var arr = [
                    gray[idx-w-1], gray[idx-w], gray[idx-w+1],
                    gray[idx-1],   gray[idx],   gray[idx+1],
                    gray[idx+w-1], gray[idx+w], gray[idx+w+1]
                ];
                arr.sort(function(a,b){return a-b});
                cleaned[idx] = arr[4];
            }
        }
        
        for(var i=0; i<d.length; i+=4) {
            var val = cleaned[i/4] < 145 ? 0 : 255; 
            d[i] = d[i+1] = d[i+2] = val;
            d[i+3] = 255;
        }
        
        ctx.putImageData(idata, 0, 0);
      }
    `;

    const commonSetup = `
      if (window.ghostOCRActive) { alert('Ghost OCR running.'); return; }
      window.ghostOCRActive = true;
      var UI_ID = 'ghost-ocr-hud';
      
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
      }

      function updateUI(text, isError) {
        var hud = document.getElementById(UI_ID);
        if (!hud) {
          hud = document.createElement('div');
          hud.id = UI_ID;
          hud.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#064e3b;color:#10b981;padding:12px 24px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #10b981;display:flex;align-items:center;gap:10px;pointer-events:none;';
          document.body.appendChild(hud);
        }
        if (isError) {
            hud.style.borderColor = '#ef4444';
            hud.style.color = '#fca5a5';
            hud.style.backgroundColor = '#450a0a';
        }
        hud.innerHTML = (isError ? '❌ ' : '⚡ ') + text;
      }

      function findElements() {
          function searchInput(root) {
              /* 1. Strict ID Match (User Requested) */
              var el = root.getElementById('txtVerifyCode');
              if(el) return el;
              
              /* 2. Strict Name Match */
              el = root.querySelector('input[name="txtVerifyCode"]');
              if(el) return el;

              /* 3. Recursive Frame Search */
              var f = root.querySelectorAll('iframe,frame');
              for(var i=0; i<f.length; i++){
                  try {
                      var d = f[i].contentDocument || f[i].contentWindow.document;
                      if(d) { 
                         el = searchInput(d);
                         if(el) return el; 
                      }
                  } catch(e){}
              }
              return null;
          }
          
          /* Separate Image Search to allow cross-frame references */
          function searchImg(root) {
               var el = root.querySelector('img[src*="Captcha" i], img[id*="Captcha" i], img[id*="Vcode" i], img[src*="code" i]');
               if(el) return el;
               var f = root.querySelectorAll('iframe,frame');
               for(var i=0; i<f.length; i++){
                  try {
                      var d = f[i].contentDocument || f[i].contentWindow.document;
                      if(d) { el = searchImg(d); if(el) return el; }
                  } catch(e){}
              }
              return null;
          }

          var input = searchInput(document);
          /* Fallback if exact ID not found */
          if(!input) {
             console.warn('txtVerifyCode not found, falling back to generic search');
             // Reuse generic search from previous version if specific fails
             function genericSearch(root) {
                 var el = root.querySelector('input[id*="Captcha" i], input[name*="Verify" i]');
                 if(el) return el;
                 var f = root.querySelectorAll('iframe,frame');
                 for(var i=0; i<f.length; i++){ try{ var d=f[i].contentDocument||f[i].contentWindow.document; if(d){el=genericSearch(d);if(el)return el;}}catch(e){} }
                 return null;
             }
             input = genericSearch(document);
          }

          var img = searchImg(document);
          return { img: img, input: input };
      }

      /* OMNI-INJECTOR v5.2: Targets jQuery, React, and Legacy DOM events */
      function forceFill(input, value) {
        input.focus();
        input.click();

        /* 1. Prototype Setter (React/Vue Bypass) */
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (setter) setter.call(input, value);
        else input.value = value;
        
        /* 2. jQuery Trigger (Legacy Hospital Portals) */
        if (window.jQuery && typeof window.jQuery === 'function') {
            try {
                window.jQuery(input).val(value).trigger('change').trigger('input').trigger('blur');
            } catch(e) {}
        }

        /* 3. Legacy Attribute Setter */
        input.setAttribute('value', value);

        /* 4. Comprehensive Event Dispatch Sequence */
        var events = [
            new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value.slice(-1), charCode: 0, keyCode: 0 }),
            new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: value.slice(-1), charCode: 0, keyCode: 0 }),
            new InputEvent('textInput', { bubbles: true, cancelable: true, data: value }), /* Critical for legacy WebKit */
            new Event('input', { bubbles: true, cancelable: true }),
            new Event('change', { bubbles: true, cancelable: true }),
            new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: value.slice(-1), charCode: 0, keyCode: 0 }),
            new Event('blur', { bubbles: true, cancelable: true })
        ];

        events.forEach(function(evt) {
            input.dispatchEvent(evt);
        });
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v5.2 (Omni-Inject)...');
          var els = findElements();
          var img = els.img;
          var input = els.input;

          if (!img || !input) {
            if(!img) updateUI('Missing CAPTCHA Image...', true);
            else updateUI('Missing txtVerifyCode...', true);
            
            /* Manual Click Fallback */
            var clicked = await new Promise(r => {
                function h(e){ e.preventDefault(); e.stopPropagation(); document.removeEventListener('click',h,true); r(e.target); }
                document.addEventListener('click', h, true);
            });
            if(!img) img = clicked; else input = clicked;
          }

          /* Highlight Target */
          input.style.border = '2px solid #f59e0b'; // Amber for attention
          input.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.6)';
          updateUI('Processing...');
          
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
          
          var scale = ${engine === 'enhanced' ? 4 : 2};
          var w = img.naturalWidth || img.width || 100;
          var h = img.naturalHeight || img.height || 30;
          c.width = w * scale;
          c.height = h * scale;
          
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, c.width, c.height);

          ${engine === 'enhanced' ? 'processImage(c);' : ''}

          updateUI('Reading...');
          var worker = await Tesseract.createWorker('eng', 1);
          await worker.setParameters({ 
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_pageseg_mode: '7'
          });
          
          var res = await worker.recognize(c);
          await worker.terminate();

          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
          if(!text) throw new Error('Empty Result');
          
          forceFill(input, text);
          
          updateUI('INJECTED: ' + text);
          setTimeout(cleanup, 2500);
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
          <div className="inline-flex items-center px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold tracking-widest uppercase">
            v5.2 - Omni-Inject
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className={engine === 'enhanced' ? "text-amber-500" : "text-slate-500"}>OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Prioritizes <code className="text-amber-400">txtVerifyCode</code> with jQuery support.
            Ensures compatibility with legacy hospital frameworks.
          </p>
        </header>

        <div className="flex justify-center">
            <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/10 flex space-x-2">
                <button 
                    onClick={() => setEngine('fast')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'fast' ? 'bg-slate-700 text-white shadow-lg' : 'hover:text-white text-slate-500'}`}
                >
                    Standard Fill
                </button>
                <button 
                    onClick={() => setEngine('enhanced')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'enhanced' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'hover:text-white text-slate-500'}`}
                >
                    Omni-Inject (High Acc)
                </button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className={`bg-slate-900/40 backdrop-blur-xl border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden transition-colors ${engine === 'enhanced' ? 'border-amber-500/10' : 'border-slate-500/10'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 ${engine === 'enhanced' ? 'via-amber-500' : 'via-slate-500'}`}></div>
            
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${engine === 'enhanced' ? 'bg-amber-600/20 text-amber-500' : 'bg-slate-700/20 text-slate-400'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.578-4.18M7.5 21H6M10 21h3m-5 0h1" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className={`group relative px-12 py-6 rounded-2xl text-white font-black text-xl flex items-center space-x-4 shadow-2xl transition-all hover:-translate-y-2 select-none cursor-move z-10 ${engine === 'enhanced' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' : 'bg-slate-600 hover:bg-slate-500'}`}
              onClick={(e) => e.preventDefault()}
            >
              <span>{engine === 'enhanced' ? 'GHOST OMNI v5.2' : 'GHOST FILL v5.2'}</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Target: #txtVerifyCode &bull; jQuery + React + Native
            </p>
          </div>

          <div className="space-y-6">
              <div className={`bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 ${engine === 'enhanced' ? 'border-amber-500/20' : 'border-white/5'}`}>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Omni-Inject Technology
                  </h3>
                  <p className="text-sm text-slate-400">
                      Specifically engineered for stubborn hospital forms.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Scans recursively for <code>id="txtVerifyCode"</code> inside iFrames.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Triggers <code>window.jQuery(el).val().trigger('change')</code> if detected.
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Dispatches legacy <code>textInput</code> events for older WebKit browsers.
                      </li>
                  </ul>
              </div>

               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 uppercase">Usage</h4>
                   <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-3"><span className="text-amber-400 font-bold">1.</span> <span>Update bookmark with the button above.</span></li>
                        <li className="flex gap-3"><span className="text-amber-400 font-bold">2.</span> <span>Go to Hospital Portal.</span></li>
                        <li className="flex gap-3"><span className="text-amber-400 font-bold">3.</span> <span>Click to fill.</span></li>
                    </ul>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
