
import React, { useEffect, useRef } from 'react';

const App: React.FC = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  /* 
     UPDATED v2.5:
     1. Added 'input[name="txtVerifyCode"]' selector (user confirmed it is a name, not just ID).
     2. Added Recursive Iframe Search: Many portals put login forms inside iframes/frames.
     3. Added _valueTracker hack for React 16+ inputs.
  */
  const bookmarkletCode = `
    (function() {
      /* Prevent multiple instances */
      if (window.ghostOCRActive) {
        alert('Ghost OCR is already running. Please reload the page if stuck.');
        return;
      }
      window.ghostOCRActive = true;

      var UI_ID = 'ghost-ocr-hud';
      
      function cleanup() {
        window.ghostOCRActive = false;
        var el = document.getElementById(UI_ID);
        if (el) el.remove();
      }

      function updateUI(text, progress, isError) {
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
        var icon = isError ? '❌' : '⚡';
        var progText = (progress && progress < 1) ? Math.round(progress * 100) + '%' : '';
        hud.innerHTML = icon + ' <span style="margin-left:5px">' + text + ' ' + progText + '</span>';
      }

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

      /* Helper: Search inside Iframes/Frames as well as main document */
      function findElement(selectors) {
        /* 1. Main Document */
        var el = document.querySelector(selectors);
        if (el) return el;
        
        /* 2. Iframes (Same Origin only) */
        var frames = document.querySelectorAll('iframe, frame');
        for (var i = 0; i < frames.length; i++) {
          try {
            var doc = frames[i].contentDocument || frames[i].contentWindow.document;
            if (doc) {
                el = doc.querySelector(selectors);
                if (el) return el;
            }
          } catch(e) { /* Ignore Cross-Origin blocks */ }
        }
        return null;
      }

      async function run() {
        try {
          updateUI('Ghost OCR Initializing...');

          /* 1. Define Selectors */
          var imgSelectors = 'img[src*="Captcha" i], img[id*="Captcha" i], img[id*="Vcode" i], img[src*="code" i], img[src*="Verify" i], canvas[id*="Captcha" i]';
          
          /* Updated: Prioritize name="txtVerifyCode" */
          var inputSelectors = [
            'input[name="txtVerifyCode"]',      /* High Priority: Name attribute */
            'input[id="txtVerifyCode"]',        /* High Priority: ID attribute */
            'input[name*="VerifyCode" i]',
            'input[id*="VerifyCode" i]',
            'input[name*="Captcha" i]',
            'input[id*="Captcha" i]',
            'input[name="checkCode"]',
            'input[placeholder*="驗證碼"]'
          ].join(',');

          var img = findElement(imgSelectors);
          var input = findElement(inputSelectors);

          /* 2. Manual Fallback */
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
             /* Try generous search for any text input */
             input = findElement('input[type="text"]:not([readonly]), input:not([type])');
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

          /* Highlight found input */
          input.style.border = '2px solid #8b5cf6';

          updateUI('Loading Engine...');
          await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
          updateUI('Processing...');
          
          /* Canvas Setup */
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          
          if (img instanceof HTMLImageElement) {
             if (!img.complete) await new Promise((r) => img.onload = r);
             try {
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                ctx.drawImage(img, 0, 0);
             } catch(e) { throw new Error('Security Error: Browser blocked reading image.'); }
          } else {
             canvas.width = img.width;
             canvas.height = img.height;
             ctx.drawImage(img, 0, 0);
          }

          /* Image Binarization */
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
            logger: function(m) { if (m.status === 'recognizing text') updateUI('Solving...', m.progress); }
          });
          await worker.setParameters({ tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' });
          var res = await worker.recognize(canvas);
          await worker.terminate();
          
          var text = res.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
          if (!text) throw new Error('OCR empty. Try again.');

          /* SUPER ROBUST FILL */
          input.focus();
          
          /* 1. Try React Tracker Hack */
          var tracker = input._valueTracker;
          if (tracker) { tracker.setValue(text); }
          
          /* 2. Try Native Setter */
          var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          if (nativeSetter) {
            nativeSetter.call(input, text);
          } else {
            input.value = text;
          }

          /* 3. Dispatch Events */
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: text[0], char: text[0], keyCode: text.charCodeAt(0) }));
          input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: text[0], char: text[0], keyCode: text.charCodeAt(0) }));
          input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: text[0], char: text[0], keyCode: text.charCodeAt(0) }));
          
          /* 4. Blur and Refocus (often triggers validation) */
          input.blur();
          setTimeout(function() { input.focus(); }, 50);

          updateUI('FILLED: ' + text);
          input.style.backgroundColor = '#dbeafe';
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
            v2.5 - Name & Iframe Support
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-violet-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Now targeting <code>name="txtVerifyCode"</code> and searching inside Iframes.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
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
              <span>GHOST FILL v2.5</span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Target: name="txtVerifyCode"
            </p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Instructions</h3>
            <div className="space-y-4">
               <div className="flex items-start space-x-3">
                 <div className="text-red-400 font-bold">1.</div>
                 <p className="text-sm text-slate-400"><strong>Delete</strong> your old bookmark.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="text-violet-400 font-bold">2.</div>
                 <p className="text-sm text-slate-400">Drag <strong>v2.5</strong> to bookmarks.</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="text-violet-400 font-bold">3.</div>
                 <p className="text-sm text-slate-400">Click it on the login page.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
