import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MONTH_NAMES, cn, compressImage } from '@/lib/utils';
import { generatePlantInfo, generatePlantImage, identifyPlant } from '@/services/gemini';
import { ArrowLeft, Calendar, Camera, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PruningTaskDefinition } from '@/types';

export const AddPlant = () => {
  const navigate = useNavigate();
  const { addPlant, settings, plants } = useStore();
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  // Get unique existing locations
  const existingLocations = Array.from(new Set(plants.map(p => p.location).filter(Boolean))).sort();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [careInstructions, setCareInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pruningTasks, setPruningTasks] = useState<PruningTaskDefinition[] | undefined>();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          setCameraError("Unable to access camera. Please check permissions.");
        });
    }
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    setShowCamera(false);
    setIsGenerating(true);
    setError('');
    
    try {
      const results = await identifyPlant(dataUrl, settings.geminiApiKey);
      if (results.matches && results.matches.length > 0) {
        setSearchResults(results.matches);
        
        // Generate images in background
        Promise.all(results.matches.map(async (match: any) => {
          try {
            const imageUrl = await generatePlantImage(match.name, settings.geminiApiKey);
            return { ...match, imageUrl };
          } catch (e) {
            console.error(`Failed to generate image for ${match.name}`, e);
            return match;
          }
        })).then(matchesWithImages => {
          setSearchResults(matchesWithImages);
        });
        
      } else {
        setError("No plants identified.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to identify plant.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (plantName = name) => {
    if (!plantName) return;
    if (!settings.geminiApiKey) {
      setError("Please add a Gemini API Key in Settings first.");
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Parallel requests
      const [info, image] = await Promise.allSettled([
        generatePlantInfo(plantName, settings.geminiApiKey),
        generatePlantImage(plantName, settings.geminiApiKey)
      ]);

      if (info.status === 'fulfilled') {
        const generated = info.value;
        setCareInstructions(generated.careInstructions || '');
        setPruningTasks(generated.tasks);
        
        // Extract flat list of months for UI grid selection
        if (generated.tasks) {
          const months = Array.from(new Set(generated.tasks.flatMap((t: any) => t.months))) as number[];
          setSelectedMonths(months);
        }
      } else {
        console.error("Plant info generation failed:", info.reason);
        let errorMessage = "Failed to generate plant info.";
        if (info.reason instanceof Error) {
          errorMessage = info.reason.message;
        } else if (typeof info.reason === 'string') {
          errorMessage = info.reason;
        }
        setError(errorMessage);
      }

      if (image.status === 'fulfilled') {
        setImageUrl(image.value);
      } else {
        console.warn("Image generation failed:", image.reason);
        // Fallback to Unsplash if AI image fails
        setImageUrl(`https://source.unsplash.com/featured/?${encodeURIComponent(plantName)},plant`);
        // We don't set a blocking error for image failure since we have a fallback
      }

    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectMatch = async (match: any) => {
    setSelectedMatch(match);
    if (!match.tasks) {
      try {
        const info = await generatePlantInfo(match.name, settings.geminiApiKey);
        setSelectedMatch((prev: any) => ({ ...prev, ...info }));
        
        // Update in searchResults to cache it
        setSearchResults(prev => prev.map(p => p.name === match.name ? { ...p, ...info } : p));
      } catch (e) {
        console.error("Failed to generate plant info on selection", e);
      }
    }
  };

  const toggleMonth = (index: number) => {
    // If we have generated tasks, clear them to fallback to manual flat list editing mode
    if (pruningTasks) {
       setPruningTasks(undefined);
    }
    
    setSelectedMonths(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    let finalImageUrl = imageUrl || `https://source.unsplash.com/featured/?${encodeURIComponent(name)},plant`;
    
    // Compress if it's a base64 image
    if (finalImageUrl.startsWith('data:image')) {
      try {
        finalImageUrl = await compressImage(finalImageUrl);
      } catch (e) {
        console.error("Compression failed", e);
      }
    }

    const success = addPlant({
      id: crypto.randomUUID(),
      name,
      location,
      pruningMonths: selectedMonths,
      pruningTasks: pruningTasks, // Include grouped tasks
      imageUrl: finalImageUrl,
      careInstructions
    });

    if (success) {
      navigate('/');
    } else {
      setError("Storage full! Unable to save plant. Please delete some plants or clear data.");
    }
  };

  if (searchResults.length > 0) {
    if (selectedMatch) {
      // Detail View (Harmonized with PlantDetail.tsx)
      return (
        <div className="bg-white min-h-screen pb-32">
          {/* Hero Image */}
          <div className="relative h-72 w-full">
            <img 
              src={selectedMatch.imageUrl || `https://loremflickr.com/600/400/${encodeURIComponent(selectedMatch.name)},plant`} 
              alt={selectedMatch.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop";
              }}
            />
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMatch(null)} 
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft />
              </Button>
            </div>
          </div>

          <div className="p-6 -mt-6 bg-white rounded-t-3xl relative z-10 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedMatch.name}</h1>
              <p className="text-sm text-slate-600 mt-2">{selectedMatch.description}</p>
            </div>

            {/* Pruning Schedule */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} className="text-emerald-600" />
                Pruning Schedule
              </h2>

              {selectedMatch.tasks ? (
                <div className="space-y-3">
                  {selectedMatch.tasks.map((task: any) => (
                    <div key={task.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 text-sm">{task.name}</h3>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                          task.type === 'once' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        )}>
                          {task.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {task.months.map((m: number) => (
                          <span
                            key={m}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200"
                          >
                            {MONTH_NAMES[m]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center h-24">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="ml-2 text-sm text-slate-600">Generating schedule...</span>
                </div>
              )}
            </div>

            {/* Care Instructions */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Care Instructions</h2>
              {selectedMatch.careInstructions ? (
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown>{selectedMatch.careInstructions}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3"></div>
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 flex gap-4 z-50">
            <Button 
              variant="ghost" 
              className="flex-1 border border-slate-200"
              onClick={() => setSelectedMatch(null)}
            >
              Back
            </Button>
            <Button 
              variant="default"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!selectedMatch.tasks}
              onClick={() => {
                setName(selectedMatch.name);
                setCareInstructions(selectedMatch.careInstructions || '');
                setPruningTasks(selectedMatch.tasks);
                if (selectedMatch.tasks) {
                  const months = Array.from(new Set(selectedMatch.tasks.flatMap((t: any) => t.months))) as number[];
                  setSelectedMonths(months);
                }
                if (selectedMatch.imageUrl) {
                  setImageUrl(selectedMatch.imageUrl);
                }
                setSearchResults([]);
                setSelectedMatch(null);
              }}
            >
              Use this one
            </Button>
          </div>
        </div>
      );
    }

    // List View
    return (
      <div className="p-6 max-w-2xl mx-auto pb-32">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => { setSearchResults([]); setSelectedMatch(null); }}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Select Your Plant</h1>
        </header>

        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div 
              key={index} 
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors flex gap-4 items-center"
              onClick={() => handleSelectMatch(result)}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                {result.imageUrl ? (
                  <img 
                    src={result.imageUrl} 
                    alt={result.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150&h=150&fit=crop";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-slate-900 truncate">{result.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{result.description}</p>
              </div>
              <div className="shrink-0 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 flex gap-4 z-50">
          <Button 
            variant="ghost" 
            className="w-full border border-slate-200"
            onClick={() => {
              setSearchResults([]);
              setSelectedMatch(null);
              setShowCamera(true);
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-32">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Add New Plant</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name Input with AI Trigger */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Plant Name</label>
          <div className="flex gap-2">
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Rose, Hydrangea"
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowCamera(true)}
              className="shrink-0"
              title="Identify with Camera"
            >
              <Camera className="text-slate-600" />
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              disabled={isGenerating || !name}
              onClick={handleGenerate}
              className="shrink-0"
              title="Generate Info"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles className="text-brand-600" />}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Image</label>
            <div className="relative aspect-square w-full max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 group">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/90 hover:bg-white shadow-sm"
                  onClick={async () => {
                    if (!name || !settings.geminiApiKey) return;
                    setIsGenerating(true);
                    try {
                      const image = await generatePlantImage(name, settings.geminiApiKey);
                      setImageUrl(image);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Location</label>
          <Input 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
            placeholder="e.g. Front Bed, Patio Pot"
            list="location-suggestions"
            onKeyDown={handleKeyDown}
          />
          <datalist id="location-suggestions">
            {existingLocations.map(loc => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Pruning Months */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Pruning Months</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMonth(i)}
                className={cn(
                  "px-2 py-2 text-sm rounded-xl border transition-all",
                  selectedMonths.includes(i)
                    ? "bg-brand-600 text-white border-brand-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
                )}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Care Instructions */}
        {careInstructions && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Care Instructions</label>
            <div className="min-h-[150px] p-4 rounded-xl border border-slate-200 bg-white text-sm">
              <div className="prose prose-sm prose-green max-w-none">
                <ReactMarkdown>{careInstructions}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            size="lg" 
            className="flex-1 h-14 text-lg rounded-2xl border border-slate-200"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="flex-1 h-14 text-lg rounded-2xl"
            disabled={!careInstructions || isGenerating}
          >
            Save Plant
          </Button>
        </div>
      </form>

      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 flex items-center justify-center">
            {cameraError ? (
              <div className="text-white text-center p-4">
                <p>{cameraError}</p>
                <Button 
                  variant="secondary" 
                  className="mt-4"
                  onClick={() => setShowCamera(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-6">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full w-16 h-16 flex items-center justify-center bg-white/20 backdrop-blur-md border-white/30 text-white"
                    onClick={() => setShowCamera(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="lg" 
                    className="rounded-full w-20 h-20 flex items-center justify-center bg-brand-600 hover:bg-brand-700 shadow-lg text-white"
                    onClick={handleCapture}
                  >
                    <Camera size={32} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
