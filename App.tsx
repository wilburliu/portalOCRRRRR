
import React, { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  /* 
     UPDATED: Specific Target Support
     Added 'input#txtVerifyCode' as the primary selector for the portal.
  */
  const bookmarkletCode = `
    (function() {
      /* Prevent multiple instances */
      if (window.ghostOCRActive) {
        alert('Ghost OCR is already running. Please reload the page if stuck.');
        return;
      }
      window.ghostOCRActive = true;

      /* UI Constants */
      var UI_ID = 'ghost-ocr-hud';
      
      /* Cleanup function */
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
      }

      /* Helper: Update UI */
      function updateUI(text, progress, isError) {
        var hud = document.getElementById(UI_ID);
        if (!hud) {
          hud = document.createElement('div');
          hud.id = UI_ID;
          /* Force high z-index and fixed positioning to ensure visibility */
          hud.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0f172a;color:#a78bfa;padding:12px 24px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #7c3aed;display:flex;align-items:center;gap:10px;pointer-events:none;';
          document.body.appendChild(hud);
        }
        
        if (isError) {
          hud.style.borderColor = '#ef4444';
          hud.style.color = '#fca5a5';
        }

        var icon = isError ? '❌' : '⚡';
        var progText = (progress && progress < 1) ? Math.round(progress * 100) + '%' : '';
        hud.innerHTML = icon + ' <span style="margin-left:5px">' + text + ' ' + progText + '</span>';
      }

      /* Helper: Load Script */
      function loadScript(src) {
        return new Promise(function(resolve, reject) {
          if (typeof Tesseract !== 'undefined') return resolve();
          var s = document.createElement('script');
          s.src = src;
          s.onload = resolve;
          s.onerror = function() { reject(new Error('Failed to load OCR engine. Site might block external scripts (CSP).')); };
          document.head.appendChild(s);
        });
      }

      /* Main Logic */
      async function run() {
        try {
          updateUI('Ghost OCR Initializing...');

          /* 1. Find Elements */
          /* Added input#txtVerifyCode as primary target */
          var img = document.querySelector('img[src*="Captcha" i], img[id*="Captcha" i], img[id*="Vcode" i], img[src*="code" i], img[src*="Verify" i], canvas[id*="Captcha" i]');
          var input = document.querySelector('input#txtVerifyCode, input[name*="Captcha" i], input[id*="Captcha" i], input[id*="Verify" i], input[id*="Vcode" i], input[placeholder*="驗證碼"], input[id*="Validate" i]');

          /* 2. Manual Fallback if detection fails */
          if (!img) {
            updateUI('Select CAPTCHA image (Click it)...');
            img = await new Promise(function(resolve) {
              function h(e) {
                e.preventDefault();
                e.stopPropagation();
                document.removeEventListener('click', h, true);
                resolve(e.target);
              }
              document.addEventListener('click', h, true);
            });
          }

          if (!input) {
             /* Try to find input near the image or generic text inputs */
             input = document.querySelector('input[type="text"]:not([readonly]), input:not([type])');
             if (!input) {
               updateUI('Select Input Box (Click it)...');
               input = await new Promise(function(resolve) {
                function h(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  document.removeEventListener('click', h, true);
                  resolve(e.target);
                }
                document.addEventListener('click', h, true);
              });
             }
          }

          updateUI('Loading Engine (approx 3s)...');
          await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

          updateUI('Processing...');
          
          /* Canvas Setup for OCR */
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          
          /* Handle Cross Origin - Try anonymous first */
          if (img instanceof HTMLImageElement) {
             if (!img.complete) {
                await new Promise((r) => img.onload = r);
             }
             
             try {
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0);
             } catch(e) {
                /* If tainted, we can't do anything easily without proxy, but we proceed to try standard logic */
                throw new Error('Security Error: Browser blocked reading this image.');
             }
          } else {
             canvas.width = img.width;
             canvas.height = img.height;
             ctx.drawImage(img, 0, 0);
          }

          /* Image Pre-processing (Binarization) */
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var d = imageData.data;
          for (var i=0; i<d.length; i+=4) {
             var r=d[i], g=d[i+1], b=d[i+2];
             var v = (r+g+b)/3;
             var bin = v > 130 ? 255 : 0;
             d[i] = d[i+1] = d[i+2] = bin;
          }
          ctx.putImageData(imageData, 0, 0);

          /* Run OCR */
          var worker = await Tesseract.createWorker('eng', 1, {
            logger: function(m) {
              if (m.status === 'recognizing text') updateUI('Solving...', m.progress);
            }
          });
          
          await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
          });

          var res = await worker.recognize(canvas);
          await worker.terminate();
          
          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();

          if (!text) throw new Error('OCR returned empty. Image too noisy?');

          /* ROBUST FILL: Bypass React/Angular state protection */
          var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, text);
          } else {
            input.value = text;
          }
          
          /* Dispatch all possible events to ensure site registers the input */
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
          input.focus();
          
          /* Visual Confirm */
          input.style.backgroundColor = '#dbeafe'; 
          input.style.boxShadow = '0 0 0 4px rgba(167, 139, 250, 0.5)';
          
          updateUI('FILLED: ' + text);
          setTimeout(cleanup, 2000);

        } catch (e) {
          console.error(e);
          updateUI('Error: ' + (e.message || e), 0, true);
          setTimeout(cleanup, 5000);
        }
      }

      run();

    })();
  `.replace(/\s+/g, ' ');

  const bookmarkletUrl = `javascript:${encodeURIComponent(bookmarkletCode)}`;

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.href = bookmarkletUrl;
    }
  }, [bookmarkletUrl]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="max-w-3xl w-full space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-bold tracking-widest uppercase">
            v2.4 - Target Update
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-violet-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Optimized for <code>#txtVerifyCode</code> targeting.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Installer */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-violet-500/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
            
            <div className="w-20 h-20 bg-violet-600/20 rounded-3xl flex items-center justify-center text-violet-500 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <a
              ref={linkRef}
              href="#"
              className="group relative px-12 py-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xl flex items-center space-x-4 shadow-2xl shadow-violet-900/40 transition-all hover:-translate-y-2 select-none cursor-move z-10"
              onClick={(e) => e.preventDefault()}
            >
              <span>GHOST FILL v2.4</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Target: #txtVerifyCode
            </p>
          </div>

          {/* Guide */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Installation</h3>
            <div className="space-y-4">
               <div className="flex items-start space-x-3">
                 <div className="text-red-400 font-bold">1.</div>
                 <p className="text-sm text-slate-400">Right-click your old "Ghost Fill" bookmark and select <strong>Delete</strong>.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="text-violet-400 font-bold">2.</div>
                 <p className="text-sm text-slate-400">Drag the new <strong>GHOST FILL v2.4</strong> button to your bookmarks bar.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="text-violet-400 font-bold">3.</div>
                 <p className="text-sm text-slate-400">Go to the portal. Click the bookmark. It will auto-fill <code>#txtVerifyCode</code>.</p>
               </div>
               <div className="p-3 bg-violet-900/20 border border-violet-500/20 rounded-xl mt-2">
                 <p className="text-[10px] text-violet-300">
                   <strong>Tech Note:</strong> The script now prioritizes elements with the ID <code>txtVerifyCode</code> for immediate filling.
                 </p>
               </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-slate-700 text-[10px] uppercase tracking-[0.4em] font-medium">
          Refactored for Stability &bull; v2.4
        </footer>
      </div>
    </div>
  );
};

export default App;
