import React, { useState } from 'react';
import { Image as ImageIcon, Download, Sparkles } from 'lucide-react';
import { ai, MODELS } from '../services/gemini';
import { Button, TextArea } from './UIComponents';

export const ImageModule: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedImage(null);
    setStatus('Generating image...');

    try {
      // Using standard 2.5 Flash Image model as per defaults
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: prompt,
      });

      let foundImage = false;
      // Iterate through parts to find image
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64 = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                setGeneratedImage(`data:${mimeType};base64,${base64}`);
                foundImage = true;
                break;
            }
        }
      }

      if (!foundImage) {
        setStatus("No image was generated. The model might have refused the prompt.");
      } else {
        setStatus("Generation complete!");
      }

    } catch (error) {
      console.error(error);
      setStatus("Error generating image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <ImageIcon className="text-primary" /> Visual Studio
        </h2>
        <p className="text-slate-400">Generate creative visuals using Gemini 2.5 Flash Image.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
         {/* Controls */}
         <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-surface p-4 rounded-xl border border-slate-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
                <TextArea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city with flying cars at sunset, cyberpunk style..."
                    rows={6}
                    className="mb-4"
                />
                <Button 
                    onClick={handleGenerate} 
                    isLoading={isLoading} 
                    className="w-full"
                    icon={<Sparkles size={16} />}
                >
                    Generate
                </Button>
                {status && <p className="mt-3 text-xs text-slate-500 text-center">{status}</p>}
            </div>
         </div>

         {/* Canvas */}
         <div className="w-full md:w-2/3 bg-black/20 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group">
            {generatedImage ? (
                <>
                    <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                           href={generatedImage} 
                           download={`nexus-gen-${Date.now()}.png`}
                           className="flex items-center gap-2 bg-surface/80 backdrop-blur text-white px-3 py-2 rounded-lg hover:bg-surface border border-slate-600"
                        >
                            <Download size={16} /> Save
                        </a>
                    </div>
                </>
            ) : (
                <div className="text-center text-slate-600">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                             <p>Dreaming...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon size={48} className="opacity-50" />
                            <p>Image preview will appear here</p>
                        </div>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
