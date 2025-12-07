import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatModule } from './components/ChatModule';
import { LiveModule } from './components/LiveModule';
import { ImageModule } from './components/ImageModule';
import { ScoutModule } from './components/ScoutModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AppModule } from './types';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AppModule>(AppModule.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case AppModule.CHAT:
        return <ChatModule />;
      case AppModule.LIVE:
        return <LiveModule />;
      case AppModule.IMAGES:
        return <ImageModule />;
      case AppModule.SCOUT:
        return <ScoutModule />;
      case AppModule.ANALYTICS:
        return <AnalyticsModule />;
      default:
        return <ChatModule />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden w-full lg:w-auto transition-all">
        {renderModule()}
      </main>
    </div>
  );
};

export default App;
