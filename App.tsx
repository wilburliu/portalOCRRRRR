
import React, { useEffect, useRef, useState } from 'react';

type EngineType = 'fast' | 'enhanced';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [engine, setEngine] = useState<EngineType>('enhanced');

  /* 
     V5.0 LOGIC GENERATOR 
     Includes a pure JS computer vision pipeline to clean images before OCR.
  */
  const getBookmarkletCode = () => {
    
    /* 
      ADVANCED IMAGE PROCESSING KERNEL 
      This runs inside the browser to clean the CAPTCHA.
    */
    const visionKernel = `
      function processImage(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var idata = ctx.getImageData(0,0,w,h);
        var d = idata.data;
        
        /* 1. Grayscale Conversion */
        var gray = new Uint8Array(w*h);
        var totalLum = 0;
        for(var i=0; i<d.length; i+=4){
            // Standard luminance formula
            var lum = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
            gray[i/4] = lum;
            totalLum += lum;
        }
        var avgLum = totalLum / (w*h);
        
        /* 2. Auto-Invert (if dark background) */
        // If average brightness is low, flip to white background
        if(avgLum < 128) {
            for(var i=0; i<gray.length; i++) gray[i] = 255 - gray[i];
        }
        
        /* 3. Median Filter (Noise Removal) */
        // Good for removing random dots (salt-and-pepper noise)
        var cleaned = new Uint8Array(w*h);
        for(var y=1; y<h-1; y++){
            for(var x=1; x<w-1; x++){
                var idx = y*w + x;
                // Get 3x3 neighborhood
                var arr = [
                    gray[idx-w-1], gray[idx-w], gray[idx-w+1],
                    gray[idx-1],   gray[idx],   gray[idx+1],
                    gray[idx+w-1], gray[idx+w], gray[idx+w+1]
                ];
                // Sort to find median
                arr.sort(function(a,b){return a-b});
                cleaned[idx] = arr[4]; // The middle value
            }
        }
        
        /* 4. High Contrast Binarization (Thresholding) */
        // Convert to pure Black/White
        for(var i=0; i<d.length; i+=4) {
            var val = cleaned[i/4] < 145 ? 0 : 255; 
            d[i] = d[i+1] = d[i+2] = val;
            // Remove Alpha
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
          hud.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0f172a;color:#a78bfa;padding:12px 24px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #7c3aed;display:flex;align-items:center;gap:10px;pointer-events:none;';
          document.body.appendChild(hud);
        }
        if (isError) {
            hud.style.borderColor = '#ef4444';
            hud.style.color = '#fca5a5';
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
          var img = search(document, 'img[src*="Captcha" i], img[id*="Captcha" i], img[id*="Vcode" i], img[src*="code" i], canvas[id*="Captcha" i]');
          var inp = search(document, 'input[name="txtVerifyCode"], input[id="txtVerifyCode"], input[name*="Verify" i], input[id*="Captcha" i]');
          if(!inp) inp = search(document, 'input[type="text"]:not([readonly])');
          return { img: img, input: inp };
      }
    `;

    const runLogic = `
      async function run() {
        try {
          updateUI('Ghost v5.0 (${engine === 'enhanced' ? 'High Acc' : 'Fast'})...');
          var els = findElements();
          var img = els.img;
          var input = els.input;

          if (!img || !input) {
            if(!img) updateUI('Click CAPTCHA...', true);
            else updateUI('Click Input...', true);
            var clicked = await new Promise(r => {
                function h(e){ e.preventDefault(); e.stopPropagation(); document.removeEventListener('click',h,true); r(e.target); }
                document.addEventListener('click', h, true);
            });
            if(!img) img = clicked; else input = clicked;
          }

          input.style.border = '2px solid #8b5cf6';
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
          
          /* Upscale Factor: Enhanced uses 4x, Fast uses 2x */
          var scale = ${engine === 'enhanced' ? 4 : 2};
          var w = img.naturalWidth || img.width || 100;
          var h = img.naturalHeight || img.height || 30;
          c.width = w * scale;
          c.height = h * scale;
          
          /* Draw Scaled */
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, c.width, c.height);

          /* Apply Filters if Enhanced */
          ${engine === 'enhanced' ? 'updateUI("De-noising..."); processImage(c);' : ''}

          updateUI('Reading Text...');
          var worker = await Tesseract.createWorker('eng', 1);
          /* Strict Allowlist */
          await worker.setParameters({ 
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_pageseg_mode: '7' // Treat image as a single text line
          });
          
          var res = await worker.recognize(c);
          await worker.terminate();

          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
          if(!text) throw new Error('OCR Failed');
          
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          updateUI('FILLED: ' + text);
          setTimeout(cleanup, 2000);
        } catch(e) {
            console.error(e);
            updateUI('Error: ' + e.message, true);
            setTimeout(cleanup, 4000);
        }
      }
    `;

    // Combine scripts
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
            v5.0 - Neural Polish
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className={engine === 'enhanced' ? "text-emerald-500" : "text-slate-500"}>OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Advanced client-side computer vision. No installation. No API keys.
          </p>
        </header>

        {/* Engine Switcher */}
        <div className="flex justify-center">
            <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/10 flex space-x-2">
                <button 
                    onClick={() => setEngine('fast')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'fast' ? 'bg-slate-700 text-white shadow-lg' : 'hover:text-white text-slate-500'}`}
                >
                    Fast Mode
                </button>
                <button 
                    onClick={() => setEngine('enhanced')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${engine === 'enhanced' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:text-white text-slate-500'}`}
                >
                    High Accuracy (Pre-Process)
                </button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Installer */}
          <div className={`bg-slate-900/40 backdrop-blur-xl border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden transition-colors ${engine === 'enhanced' ? 'border-emerald-500/10' : 'border-slate-500/10'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 ${engine === 'enhanced' ? 'via-emerald-500' : 'via-slate-500'}`}></div>
            
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner ${engine === 'enhanced' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-slate-700/20 text-slate-400'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className={`group relative px-12 py-6 rounded-2xl text-white font-black text-xl flex items-center space-x-4 shadow-2xl transition-all hover:-translate-y-2 select-none cursor-move z-10 ${engine === 'enhanced' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-slate-600 hover:bg-slate-500'}`}
              onClick={(e) => e.preventDefault()}
            >
              <span>{engine === 'enhanced' ? 'GHOST VISION v5.0' : 'GHOST LITE v5.0'}</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              {engine === 'enhanced' ? 'Median Filter + Auto-Invert + 4x Scale' : '2x Scale Only'}
            </p>
          </div>

          {/* Right: Instructions */}
          <div className="space-y-6">
              <div className={`bg-slate-900/40 backdrop-blur-xl border p-8 rounded-[2rem] space-y-6 ${engine === 'enhanced' ? 'border-emerald-500/20' : 'border-white/5'}`}>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     {engine === 'enhanced' ? 'Enhancement Pipeline' : 'Fast Mode'}
                  </h3>
                  <p className="text-sm text-slate-400">
                      {engine === 'enhanced' 
                        ? 'Runs a pure JavaScript computer vision pipeline in your browser. It removes noise dots (Median Filter), detects dark backgrounds (Auto-Invert), and sharpens text (Binarization) before reading.' 
                        : 'Quickly upscales the image and reads it. Good for clean, large text.'}
                  </p>
                  
                  {engine === 'enhanced' && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <div className="text-emerald-400 font-bold text-lg">4x</div>
                              <div className="text-[10px] text-slate-500 uppercase">Upscale</div>
                          </div>
                          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <div className="text-emerald-400 font-bold text-lg">NOISE</div>
                              <div className="text-[10px] text-slate-500 uppercase">Removal</div>
                          </div>
                          <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <div className="text-emerald-400 font-bold text-lg">BW</div>
                              <div className="text-[10px] text-slate-500 uppercase">Binary</div>
                          </div>
                      </div>
                  )}
              </div>

               <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 uppercase">Deployment</h4>
                   <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">1.</span> <span>Drag button to bookmarks bar.</span></li>
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">2.</span> <span>Go to Hospital Portal.</span></li>
                        <li className="flex gap-3"><span className="text-emerald-400 font-bold">3.</span> <span>Click to Auto-Fill.</span></li>
                    </ul>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
