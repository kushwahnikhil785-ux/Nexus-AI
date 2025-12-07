import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { ai, MODELS } from '../services/gemini';
import { Button, Input, Card } from './UIComponents';
import ReactMarkdown from 'react-markdown';

interface LocationResult {
  placeName: string;
  uri: string;
}

export const ScoutModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const getUserLocation = () => {
     if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((position) => {
             setUserLoc({
                 lat: position.coords.latitude,
                 lng: position.coords.longitude
             });
         }, (err) => console.log("Loc error", err));
     }
  };

  // Get location on mount
  React.useEffect(() => {
      getUserLocation();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse(null);
    setLocations([]);

    try {
      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      // Add retrieval config if user location is known
      if (userLoc) {
         config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLoc.lat,
                    longitude: userLoc.lng
                }
            }
         };
      }

      // Maps grounding works best with standard Flash model
      const result = await ai.models.generateContent({
        model: MODELS.TEXT, 
        contents: query,
        config: config
      });

      setResponse(result.text || "No details found.");

      // Extract grounding chunks
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const foundLocations: LocationResult[] = [];

      if (chunks) {
          chunks.forEach((chunk: any) => {
              if (chunk.web?.uri) {
                  // Fallback for search
                  foundLocations.push({ placeName: chunk.web.title || "Link", uri: chunk.web.uri });
              } else if (chunk.maps?.uri) {
                  // Maps uri (undocumented shape in prompt, inferring from typical grounding)
                  // The prompt says: groundingChunks.maps.uri
                  foundLocations.push({ placeName: chunk.maps.title || "Map Location", uri: chunk.maps.uri });
              }
          });
      }
      
      // If we got no chunks but the text has markdown links, we rely on the text. 
      // But typically groundingChunks is where the raw data is.
      setLocations(foundLocations);

    } catch (error) {
      console.error(error);
      setResponse("Failed to scout location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <MapPin className="text-primary" /> Scout
        </h2>
        <p className="text-slate-400">Find real-world places with Google Maps grounding.</p>
      </div>

      <div className="flex gap-2">
        <Input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Where can I find the best coffee nearby?"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} isLoading={isLoading} icon={<Search size={18} />}>
          Scout
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Text Response */}
         <div className="md:col-span-2">
            {response && (
               <Card className="h-full">
                  <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown>{response}</ReactMarkdown>
                  </div>
               </Card>
            )}
            {!response && !isLoading && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                   <Navigation size={48} className="mb-4 opacity-50" />
                   <p>Ask for places, restaurants, or local info.</p>
                   {userLoc && <p className="text-xs text-green-500 mt-2">Location Access Active</p>}
                </div>
            )}
         </div>

         {/* Location Cards */}
         <div className="md:col-span-1 space-y-4">
             <h3 className="font-semibold text-slate-300 mb-2">Found Locations</h3>
             {locations.length === 0 && response && <p className="text-slate-500 text-sm">No specific map data returned.</p>}
             {locations.map((loc, idx) => (
                 <a 
                   key={idx} 
                   href={loc.uri} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="block p-4 bg-surface border border-slate-700 hover:border-primary rounded-lg transition-colors group"
                 >
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2 text-primary font-medium">
                          <MapPin size={16} />
                          <span>{loc.placeName}</span>
                       </div>
                       <ExternalLink size={14} className="text-slate-500 group-hover:text-white" />
                    </div>
                    <div className="mt-2 text-xs text-slate-400 truncate">
                        {loc.uri}
                    </div>
                 </a>
             ))}
         </div>
      </div>
    </div>
  );
};
