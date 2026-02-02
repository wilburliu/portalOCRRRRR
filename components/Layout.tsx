
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center py-8 px-4">
      <header className="w-full max-w-4xl mb-8">
        <div className="bg-[#b6cebc] p-4 rounded-t-lg shadow-sm border-b border-white">
          <h1 className="text-2xl font-bold text-[#3d5a45] text-center">
            正式環境 (Portal) 介面 智能輔助系統
          </h1>
        </div>
        <div className="bg-[#807a65] text-white text-xs px-4 py-2 flex justify-between">
          <div className="space-x-4">
            <a href="#" className="hover:underline">院外網</a>
            <a href="#" className="hover:underline">院內網</a>
            <a href="#" className="hover:underline">數位學習</a>
          </div>
          <div>AI-Powered Automation Tools</div>
        </div>
      </header>
      
      <main className="w-full max-w-4xl bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200">
        <div className="flex flex-col md:flex-row">
          {/* Left Side: Information/Branding */}
          <div className="md:w-1/2 bg-[#e7e1c1] p-8 flex flex-col items-center justify-center space-y-6">
            <img 
              src="https://picsum.photos/seed/ntuh/400/300" 
              alt="Hospital Building" 
              className="rounded shadow-md w-full object-cover h-48"
            />
            <div className="text-[#736d56] text-center">
              <p className="font-bold text-lg mb-2">國立臺灣大學醫學院附設醫院</p>
              <p className="text-sm">National Taiwan University Hospital</p>
            </div>
            <div className="bg-white/50 p-4 rounded-md w-full border border-[#d1cda2]">
              <h3 className="text-xs font-bold text-red-800 mb-2">注意事項說明:</h3>
              <ul className="text-[10px] space-y-1 text-gray-700">
                <li>1. 兼任醫師及代訓醫師需經報備後，方可執行看診作業。</li>
                <li>2. 其他相關登入問題，請洽總院資訊服務台(261120)。</li>
              </ul>
            </div>
          </div>

          {/* Right Side: Logic Input */}
          <div className="md:w-1/2 p-8">
            {children}
          </div>
        </div>
      </main>

      <footer className="mt-8 text-center text-gray-500 text-[10px] space-y-1">
        <p>National Taiwan University Hospital - No.7, Chung San South Road, Taipei City 100, Taiwan (R.O.C.)</p>
        <p>國立臺灣大學醫學院附設醫院 - 台北市中山南路7號</p>
      </footer>
    </div>
  );
};
