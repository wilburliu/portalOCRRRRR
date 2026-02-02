
import React from 'react';

const App: React.FC = () => {
  // The Ghost OCR script: Uses Tesseract.js for local auto-filling
  const bookmarkletCode = `
    (async function() {
      const UI_ID = 'ghost-ocr-hud';
      
      const updateUI = (text, progress = 0) => {
        let hud = document.getElementById(UI_ID);
        if (!hud) {
          hud = document.createElement('div');
          hud.id = UI_ID;
          hud.style = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9999999;background:#0f172a;color:#a78bfa;padding:10px 20px;border-radius:12px;font-family:sans-serif;font-size:12px;font-weight:bold;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4);border:1px solid #5b21b6;display:flex;align-items:center;gap:12px;';
          document.body.appendChild(hud);
        }
        hud.innerHTML = '<div style="width:12px;height:12px;border:2px solid #a78bfa;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>' + text + ' (' + Math.round(progress * 100) + '%)';
      };

      const injectStyles = () => {
        if (document.getElementById('ghost-styles')) return;
        const style = document.createElement('style');
        style.id = 'ghost-styles';
        style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      };

      try {
        injectStyles();
        updateUI('Locating CAPTCHA...', 0.1);

        const img = document.querySelector('img[src*="Captcha" i], img[id*="Captcha" i], img[id*="Code" i], img[src*="code" i]');
        const input = document.querySelector('input[name*="Captcha" i], input[id*="Captcha" i], input[id*="Verify" i], input[id*="Code" i], input[placeholder*="驗證碼"]') as HTMLInputElement;

        if (!img || !input) throw new Error('Could not find portal elements.');

        updateUI('Waking Ghost Engine...', 0.2);

        // Load Tesseract via CDN
        if (typeof Tesseract === 'undefined') {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load OCR library. Check CSP.'));
            document.head.appendChild(script);
          });
        }

        updateUI('Pre-processing Image...', 0.4);

        // Pre-process image to help OCR (Thresholding)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const val = avg > 128 ? 255 : 0; // Simple threshold
          data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imageData, 0, 0);

        updateUI('Analyzing Characters...', 0.6);

        const worker = await Tesseract.createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') updateUI('Decrypting...', m.progress);
          }
        });

        // Set whitelist to alphanumeric only
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        });

        const { data: { text } } = await worker.recognize(canvas);
        await worker.terminate();

        const cleanText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
        
        if (cleanText) {
          input.value = cleanText;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.style.backgroundColor = '#f5f3ff';
          input.style.border = '2px solid #8b5cf6';
          
          updateUI('Ghost Success: ' + cleanText, 1);
          setTimeout(() => document.getElementById(UI_ID)?.remove(), 3000);
        } else {
          throw new Error('Could not read text.');
        }

      } catch (err) {
        console.error(err);
        updateUI('Ghost Error: ' + err.message, 0);
        setTimeout(() => document.getElementById(UI_ID)?.remove(), 4000);
      }
    })();
  `.replace(/\s+/g, ' ');

  const bookmarkletUrl = `javascript:${encodeURIComponent(bookmarkletCode)}`;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 lg:p-12">
      <div className="max-w-3xl w-full space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-bold tracking-widest uppercase">
            Auto-Fill Utility
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GHOST <span className="text-violet-500">OCR</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            The invisible 1-click solver. Processes CAPTCHAs locally and auto-fills the portal form instantly.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Installer */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-violet-500/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 shadow-2xl">
            <div className="w-20 h-20 bg-violet-600/20 rounded-3xl flex items-center justify-center text-violet-500 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-8.12-4.064m12.445-2.046A10.015 10.015 0 0118 15V9a6 6 0 00-6-6" />
              </svg>
            </div>
            
            <a
              href={bookmarkletUrl}
              className="group relative px-12 py-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xl flex items-center space-x-4 shadow-2xl shadow-violet-900/40 transition-all hover:-translate-y-2 select-none cursor-move"
              onClick={(e) => e.preventDefault()}
            >
              <span>GHOST FILL</span>
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
                Drag to Bookmarks Bar
              </div>
            </a>
            <p className="text-xs text-slate-500 font-medium">No API Key Required &bull; Runs 100% Locally</p>
          </div>

          {/* Guide */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[2.5rem] space-y-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Automatic Workflow</h3>
            <div className="space-y-6">
              {[
                { step: 1, text: "Drag the purple button to your browser's bookmarks bar." },
                { step: 2, text: "Go to your portal login page with the CAPTCHA." },
                { step: 3, text: "Click 'GHOST FILL' in your bookmarks." },
                { step: '✓', text: "The OCR engine wakes up, decrypts the image, and fills the box automatically.", color: 'text-violet-400' }
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-xl ${item.color ? 'bg-violet-500/20' : 'bg-slate-800'} text-xs flex items-center justify-center ${item.color || 'text-slate-400'} flex-shrink-0 font-black shadow-lg`}>
                    {item.step}
                  </div>
                  <p className={`text-sm leading-relaxed ${item.color || 'text-slate-400'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest leading-loose">
                Note: Performance depends on your device CPU. First run may take a moment to load language data.
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center text-slate-700 text-[10px] uppercase tracking-[0.4em] font-medium">
          Zero-Cloud OCR &bull; Privacy Guaranteed &bull; Open Browser Standard
        </footer>
      </div>
    </div>
  );
};

export default App;
