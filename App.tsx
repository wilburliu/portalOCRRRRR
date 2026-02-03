
import React, { useEffect, useRef, useState } from 'react';

type EngineType = 'fast' | 'enhanced';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [engine, setEngine] = useState<EngineType>('enhanced');

  /* 
     V5.1 LOGIC GENERATOR 
     Includes advanced filling logic to bypass framework barriers (React/Vue/etc.)
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
          function search(root, s) {
              var el = root.querySelector(s);
              if(el) return el;
              var f = root.querySelectorAll('iframe,frame');
              for(var i=0; i<f.length; i++){
                  try {
                      var d = f[i].contentDocument || f[i].contentWindow.document;
                      if(d) { el = search(d, s); if(el) return el; }
                  } catch(e){}
              }
              return null;
          }
          /* Priority targeting for txtVerifyCode as requested */
          var img = search(document, 'img[id*="Captcha" i], img[id*="Vcode" i], img[src*="Captcha" i], img[src*="code" i], canvas[id*="Captcha" i]');
          var inp = search(document, 'input[id="txtVerifyCode"], input[name="txtVerifyCode"], input[id*="Captcha" i], input[name*="Verify" i]');
          
          if(!inp) inp = search(document, 'input[type="text"]:not([readonly])');
          return { img: img, input: inp };
      }

      /* HYPER-INJECTOR: Bypasses React state tracking */
      function forceFill(input, value) {
        input.focus();
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (setter) {
            setter.call(input, value);
        } else {
            input.value = value;
        }
        // Notify React/Vue trackers
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        // Physical keyboard event simulation
        ['keydown', 'keypress', 'keyup'].forEach(type => {
            input.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: value.slice(-1) }));
        });
        input.blur();
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v5.1 (${engine === 'enhanced' ? 'High Acc' : 'Fast'})...');
          var els = findElements();
          var img = els.img;
          var input = els.input;

          if (!img || !input) {
            if(!img) updateUI('Click CAPTCHA Image...', true);
            else updateUI('Click Target Input...', true);
            var clicked = await new Promise(r => {
                function h(e){ e.preventDefault(); e.stopPropagation(); document.removeEventListener('click',h,true); r(e.target); }
                document.addEventListener('click', h, true);
            });
            if(!img) img = clicked; else input = clicked;
          }

          input.style.border = '2px solid #10b981';
          input.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
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
          
          var scale = ${engine === 'enhanced' ? 4 : 2};
          var w = img.naturalWidth || img.width || 100;
          var h = img.naturalHeight || img.height || 30;
          c.width = w * scale;
          c.height = h * scale;
          
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, c.width, c.height);

          ${engine === 'enhanced' ? 'updateUI("Applying Neural Polish..."); processImage(c);' : ''}

          updateUI('Running OCR...');
          var worker = await Tesseract.createWorker('eng', 1);
          await worker.setParameters({ 
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_pageseg_mode: '7'
          });
          
          var res = await worker.recognize(c);
          await worker.terminate();

          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
          if(!text) throw new Error('OCR Failed to extract text');
          
          forceFill(input, text);
          
          updateUI('SUCCESS: ' + text);
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
          <div className="inline-flex items-center px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold tracking-widest uppercase">
            v5.1 - Hyper-Injector
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className={engine === 'enhanced' ? "text-emerald-500" : "text-slate-500"}>OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Fixed injection for <code className="text-emerald-400">txtVerifyCode</code> fields. 
            Optimized for hospital portal systems.
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
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'enhanced' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:text-white text-slate-500'}`}
                >
                    Neural Polish (High Acc)
                </button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className={`bg-slate-900/40 backdrop-blur-xl border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden transition-colors ${engine === 'enhanced' ? 'border-emerald-500/10' : 'border-slate-500/10'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 ${engine === 'enhanced' ? 'via-emerald-500' : 'via-slate-500'}`}></div>
            
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${engine === 'enhanced' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-slate-700/20 text-slate-400'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className={`group relative px-12 py-6 rounded-2xl text-white font-black text-xl flex items-center space-x-4 shadow-2xl transition-all hover:-translate-y-2 select-none cursor-move z-10 ${engine === 'enhanced' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-slate-600 hover:bg-slate-500'}`}
              onClick={(e) => e.preventDefault()}
            >
              <span>{engine === 'enhanced' ? 'GHOST INJECT v5.1' : 'GHOST FILL v5.1'}</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Target ID: txtVerifyCode &bull; Bypass React State
            </p>
          </div>

          <div className="space-y-6">
              <div className={`bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 ${engine === 'enhanced' ? 'border-emerald-500/20' : 'border-white/5'}`}>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     Updated v5.1 Engine
                  </h3>
                  <p className="text-sm text-slate-400">
                      We added a <code className="text-emerald-400 font-mono">ForceFill</code> mechanism that interacts directly with the input element's prototype. This ensures that even if the hospital portal uses a framework that "hides" the input's value, our ghost script can still inject the code successfully.
                  </p>
              </div>

               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 uppercase">Usage Steps</h4>
                   <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">1.</span> <span>Drag the green button above into your bookmarks bar.</span></li>
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">2.</span> <span>Open your target hospital login page.</span></li>
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">3.</span> <span>Click the bookmark. It will auto-detect the image and the input box.</span></li>
                    </ul>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
