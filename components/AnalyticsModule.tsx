import React, { useState } from 'react';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { ai, MODELS } from '../services/gemini';
import { analyticsSchema, AnalyticsData } from '../types';
import { Button, Input, Card } from './UIComponents';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Type } from '@google/genai';

export const AnalyticsModule: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const generateData = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setData(null);

    try {
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: `Generate a realistic but hypothetical dataset about: ${topic}. Structure it for visualization.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: analyticsSchema,
        },
      });

      const jsonText = response.text || "{}";
      const parsedData = JSON.parse(jsonText) as AnalyticsData;
      setData(parsedData);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-primary" /> Data Insights
            </h2>
            <p className="text-slate-400">Generate and visualize structured data instantly.</p>
          </div>
          
          {data && (
             <div className="flex bg-surface rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded ${chartType === 'bar' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    <BarChart3 size={16} />
                </button>
                <button 
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded ${chartType === 'line' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    <LineIcon size={16} />
                </button>
                <button 
                  onClick={() => setChartType('area')}
                  className={`p-2 rounded ${chartType === 'area' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    <PieIcon size={16} />
                </button>
             </div>
          )}
      </div>

      <Card className="flex gap-2 items-center p-4">
         <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., Global coffee consumption by year, EV sales 2020-2030..."
            onKeyDown={(e) => e.key === 'Enter' && generateData()}
         />
         <Button onClick={generateData} isLoading={isLoading}>Analyze</Button>
      </Card>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart Area */}
         <div className="lg:col-span-2 bg-surface rounded-xl border border-slate-700 p-6 flex flex-col">
            {data ? (
                <>
                    <h3 className="text-lg font-semibold text-white mb-6 text-center">{data.title}</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={data.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" label={{ value: data.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : chartType === 'line' ? (
                                <LineChart data={data.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
                                </LineChart>
                            ) : (
                                <AreaChart data={data.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                                    <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <BarChart3 size={48} className="opacity-50 mb-4" />
                    <p>Enter a topic to generate data visualization</p>
                </div>
            )}
         </div>

         {/* Summary Panel */}
         <div className="lg:col-span-1">
             {data ? (
                 <Card title="AI Summary" className="h-full">
                     <p className="text-slate-300 leading-relaxed">
                         {data.summary}
                     </p>
                     <div className="mt-6 pt-6 border-t border-slate-700">
                         <h4 className="text-sm font-semibold text-slate-400 mb-2">Raw Data</h4>
                         <div className="bg-slate-900 p-3 rounded-lg overflow-auto max-h-[300px]">
                             <pre className="text-xs text-slate-500 font-mono">
                                 {JSON.stringify(data.data, null, 2)}
                             </pre>
                         </div>
                     </div>
                 </Card>
             ) : (
                 <div className="h-full bg-surface/30 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 p-6 text-center">
                     <p>Summary and raw data will appear here</p>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};
