"use client";
import { useEffect, useState } from "react";
import { Search, GitCompare, LayoutDashboard, ChevronDown, X } from "lucide-react";

// Import Charts (Scatter Plot removed)
import SentimentBarChart from "@/components/SentimentBarChart";
import SentimentPieChart from "@/components/SentimentPieChart";
import SentimentFunnelChart from "@/components/SentimentFunnelChart";
import SentimentLineChart from "@/components/SentimentLineChart";
import SentimentColumnChart from "@/components/SentimentColumnChart";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  
  // STATE UPDATES: arrays for both dimensions
  const [availablePostIds, setAvailablePostIds] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // "none" | "platform" | "post"
  const [compareType, setCompareType] = useState<"none" | "platform" | "post">("none");

  // Combo-box UI State
  const [postSearch, setPostSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Data State (scatterData removed)
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  // 1. Fetch available Post IDs on mount
  useEffect(() => {
    const fetchPostIds = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/posts`);
        const data = await res.json();
        setAvailablePostIds(data.post_ids || []);
      } catch (error) {
        console.error("Failed to fetch post IDs", error);
      }
    };
    fetchPostIds();
  }, []);

  // 2. Fetch Platforms when Post IDs are selected
  useEffect(() => {
    if (selectedPostIds.length === 0) {
      setAvailablePlatforms([]);
      setSelectedPlatforms([]);
      return;
    }
    const fetchPlatforms = async () => {
      try {
        const postsQuery = selectedPostIds.map(id => `post_id=${id}`).join("&");
        const res = await fetch(`http://127.0.0.1:8000/api/platforms?${postsQuery}`);
        const data = await res.json();
        setAvailablePlatforms(data.platforms || []);
        
        // Auto-select first platform if none is selected
        if (data.platforms.length > 0 && selectedPlatforms.length === 0) {
          setSelectedPlatforms([data.platforms[0]]);
        }
      } catch (error) {
        console.error("Failed to fetch platforms", error);
      }
    };
    fetchPlatforms();
  }, [selectedPostIds]);

  // 3. Fetch Chart Data
  useEffect(() => {
    if (selectedPostIds.length === 0 || selectedPlatforms.length === 0) return;

    const fetchAnalytics = async () => {
      try {
        const postsQuery = selectedPostIds.map(id => `post_id=${id}`).join("&");
        const platformsQuery = selectedPlatforms.map(p => `platform=${p}`).join("&");
        
        const url = `http://127.0.0.1:8000/api/analytics?${postsQuery}&${platformsQuery}&compare_by=${compareType}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        setSentimentData(data.aggregate_sentiment || []);
        setTimeSeriesData(data.time_series || []);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      }
    };

    setLoading(true);
    fetchAnalytics().finally(() => setLoading(false));
    const intervalId = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(intervalId);
  }, [selectedPostIds, selectedPlatforms, compareType]);


  // HANDLERS FOR LOGICAL CONSTRAINTS
  const handlePostSelect = (id: string) => {
    if (compareType === "post") {
      if (!selectedPostIds.includes(id)) setSelectedPostIds([...selectedPostIds, id]);
    } else {
      // Single selection mode
      setSelectedPostIds([id]);
      setShowDropdown(false);
    }
    setPostSearch("");
  };

  const removePost = (id: string) => {
    setSelectedPostIds(selectedPostIds.filter(pid => pid !== id));
  };

  const handlePlatformToggle = (platform: string) => {
    if (compareType === "platform") {
      if (selectedPlatforms.includes(platform)) {
        // Prevent deselecting the last platform
        if (selectedPlatforms.length > 1) setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      } else {
        setSelectedPlatforms([...selectedPlatforms, platform]);
      }
    } else {
      setSelectedPlatforms([platform]);
    }
  };

  // Enforce clean state when switching compare modes
  const handleModeChange = (mode: "none" | "platform" | "post") => {
    setCompareType(mode);
    if (mode === "none" || mode === "platform") {
      if (selectedPostIds.length > 1) setSelectedPostIds([selectedPostIds[0]]);
    }
    if (mode === "none" || mode === "post") {
      if (selectedPlatforms.length > 1) setSelectedPlatforms([selectedPlatforms[0]]);
    }
  };

  const filteredPosts = availablePostIds.filter(id => 
    id.toLowerCase().includes(postSearch.toLowerCase()) && !selectedPostIds.includes(id)
  );

  // Dynamic keys passed to charts so they know what columns/lines to draw
  const compareKeys = compareType === "post" ? selectedPostIds : selectedPlatforms;

  return (
    <main className="flex min-h-screen bg-black text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-gray-950 border-r border-gray-900 p-5 flex flex-col gap-6 z-20 shadow-2xl">
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-500 w-5 h-5" /> SENTIMENT
          </h1>
          <div className="h-1 w-8 bg-blue-600 mt-2 rounded-full"></div>
        </div>

        {/* COMPARE MODE TOGGLE */}
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => handleModeChange("none")}
            className={`flex-1 text-[9px] font-black uppercase py-1.5 rounded transition-all ${compareType === "none" ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            Single
          </button>
          <button 
            onClick={() => handleModeChange("platform")}
            className={`flex-1 text-[9px] font-black uppercase py-1.5 rounded transition-all flex items-center justify-center gap-1 ${compareType === "platform" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            <GitCompare className="w-3 h-3" /> Platf.
          </button>
          <button 
            onClick={() => handleModeChange("post")}
            className={`flex-1 text-[9px] font-black uppercase py-1.5 rounded transition-all flex items-center justify-center gap-1 ${compareType === "post" ? "bg-purple-600 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            <GitCompare className="w-3 h-3" /> Posts
          </button>
        </div>

        {/* MULTI-SELECT SEARCHABLE DROPDOWN */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Target Post IDs</label>
          
          {/* Selected Chips */}
          {selectedPostIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {selectedPostIds.map(id => (
                <div key={id} className="flex items-center gap-1 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-gray-700">
                  {id}
                  {compareType === "post" && selectedPostIds.length > 1 && (
                    <button onClick={() => removePost(id)} className="text-gray-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text"
              placeholder={compareType === "post" ? "Add another post..." : "Search ID..."}
              value={postSearch}
              onChange={(e) => {
                setPostSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-black border-2 border-gray-800 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all"
            />
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 text-gray-500 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {showDropdown && (
            <div className="absolute top-[100%] mt-1 left-0 w-full bg-gray-900 border border-gray-800 rounded-xl max-h-48 overflow-y-auto shadow-2xl z-50 custom-scrollbar">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(id => (
                  <div
                    key={id}
                    onClick={() => handlePostSelect(id)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    {id}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-600 italic text-center">No posts found</div>
              )}
            </div>
          )}
        </div>

        {/* Platform Controls */}
        {availablePlatforms.length > 0 && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Platforms</label>
            </div>

            <div className="flex flex-col gap-2">
              {availablePlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => handlePlatformToggle(platform)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                    selectedPlatforms.includes(platform)
                      ? "bg-blue-900/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "bg-black border-gray-800 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider capitalize">{platform}</span>
                  {selectedPlatforms.includes(platform) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* MAIN VIEWPORT */}
      <section 
        className="flex-1 p-8 h-screen overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_#111,_#000)]"
        onClick={() => showDropdown && setShowDropdown(false)} 
      >
        {selectedPostIds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-black tracking-widest uppercase">Select a Post ID to begin</h2>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center text-blue-500 font-black tracking-widest animate-pulse">
            ANALYZING SENTIMENT DATA...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {compareType === "none" ? (
              <>
                <div className="h-[400px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl">
                  <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Sentiment Distribution (Bar)</h3>
                  <SentimentBarChart data={sentimentData} />
                </div>
                <div className="h-[400px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl">
                  <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Sentiment Ratio (Pie)</h3>
                  <SentimentPieChart data={sentimentData} />
                </div>
                <div className="h-[400px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl xl:col-span-2 relative overflow-hidden">
                   <div className="absolute top-4 right-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
                  </div>
                  <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Sentiment Over Time (Line)</h3>
                  <SentimentLineChart data={timeSeriesData} compareMode={false} platforms={compareKeys} />
                </div>
                <div className="h-[400px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl xl:col-span-2">
                  <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Engagement Funnel</h3>
                  <SentimentFunnelChart data={sentimentData} />
                </div>
              </>
            ) : (
              <>
                <div className="h-[450px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl xl:col-span-2">
                  <h3 className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em] mb-4">Comparative Sentiment (Column)</h3>
                  <SentimentColumnChart data={sentimentData} platforms={compareKeys} />
                </div>
                <div className="h-[450px] bg-gray-950/50 border border-gray-800 p-6 rounded-[2rem] shadow-xl xl:col-span-2 relative overflow-hidden">
                  <div className="absolute top-4 right-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
                  </div>
                  <h3 className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em] mb-4">Sentiment Velocity (Line)</h3>
                  <SentimentLineChart data={timeSeriesData} compareMode={true} platforms={compareKeys} />
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}