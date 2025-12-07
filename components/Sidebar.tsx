import React from 'react';
import { MessageSquare, Mic, Image as ImageIcon, MapPin, BarChart3, Menu, X } from 'lucide-react';
import { AppModule } from '../types';

interface SidebarProps {
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: AppModule.CHAT, label: 'Chat & Think', icon: <MessageSquare size={20} /> },
    { id: AppModule.LIVE, label: 'Live Voice', icon: <Mic size={20} /> },
    { id: AppModule.IMAGES, label: 'Visual Studio', icon: <ImageIcon size={20} /> },
    { id: AppModule.SCOUT, label: 'Maps Scout', icon: <MapPin size={20} /> },
    { id: AppModule.ANALYTICS, label: 'Data Insights', icon: <BarChart3 size={20} /> },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-md border border-slate-700 text-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-surface border-r border-slate-700 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static flex flex-col
      `}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Nexus
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-2">AI Workspace v2.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${activeModule === item.id 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center">
            Powered by Gemini API
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
