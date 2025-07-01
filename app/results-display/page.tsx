'use client';

import { useState, useEffect } from 'react';
import { Participant, CompetitionState, Heat, Score } from '../../types';

interface ResultsDisplayData {
  participants: Participant[];
  competitionState: CompetitionState | null;
  heats: Heat[];
  scores: Score[];
}

export default function ResultsDisplay() {
  const [data, setData] = useState<ResultsDisplayData>({ participants: [], competitionState: null, heats: [], scores: [] });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideInterval, setSlideInterval] = useState(5000);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % getTotalSlides());
      }, slideInterval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, slideInterval, data]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin');
      const adminData = await response.json();
      console.log('Admin data received:', adminData);
      
      // Extract participants from heatResults
      const allParticipants = new Map();
      if (adminData.heatResults) {
        adminData.heatResults.forEach((heat: any) => {
          heat.participants.forEach((participant: any) => {
            allParticipants.set(participant.id, participant);
          });
        });
      }
      
      // Extract scores from heatResults
      const allScores: any[] = [];
      if (adminData.heatResults) {
        adminData.heatResults.forEach((heat: any) => {
          if (heat.scores) {
            heat.scores.forEach((score: any) => {
              allScores.push({
                ...score,
                heatId: heat.id
              });
            });
          }
        });
      }
      
      setData({
        participants: Array.from(allParticipants.values()),
        competitionState: adminData.competitionState,
        heats: adminData.heatResults || [],
        scores: allScores
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getTotalSlides = () => {
    let total = 1; // Welcome slide
    if (data.competitionState?.currentPhase === 'heats' && data.heats.length > 0) total += data.heats.length;
    if (data.competitionState?.currentPhase === 'semifinal' || data.competitionState?.currentPhase === 'final') total += 1;
    if (data.competitionState?.currentPhase === 'final') total += 1;
    if (data.competitionState?.winners) total += 1;
    return total;
  };

  const getParticipantById = (id: string) => {
    return data.participants.find(p => p.id === id);
  };

  const getParticipantImage = (participant: Participant | undefined) => {
    // If participant has a pictureUrl, use it
    if (participant?.pictureUrl) {
      return participant.pictureUrl;
    }
    
    // Fallback to placeholder based on role (handle both cases)
    const role = participant?.role?.toLowerCase();
    return role === 'leader' ? '/leader-placeholder.svg' : '/follower-placeholder.svg';
  };

  // Helper function to handle image loading with better error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, participant: any) => {
    const target = e.target as HTMLImageElement;
    console.log(`Image failed to load for ${participant?.name}:`, participant?.pictureUrl);
    
    // Fallback to placeholder
    target.src = participant?.role === 'leader' || participant?.role === 'LEADER' 
      ? '/leader-placeholder.svg' 
      : '/follower-placeholder.svg';
  };

  const renderWelcomeSlide = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Festival Logo - Top Right */}
      <div className="absolute top-8 right-8 z-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 border border-white/20">
          <img
            src="/logo.png"
            alt="Festival Logo"
            className="w-32 h-32 object-contain opacity-100"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-pink-400/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-blue-400/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-green-400/20 rounded-full animate-spin"></div>
      </div>
      
      <div className="text-center z-10">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 animate-pulse">
            🕺💃
          </h1>
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
            BACHATA COMPETITION
          </h1>
          <p className="text-2xl text-white/80 font-light">
            Live Results & Updates
          </p>
        </div>
        
        <div className="mt-12">
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-yellow-400 text-2xl">🎵</div>
            <div className="text-white">
              <div className="text-lg font-semibold">Current Phase</div>
              <div className="text-3xl font-bold text-yellow-400 capitalize">
                {data.competitionState?.currentPhase || 'Setup'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeatSlide = (heat: any) => {
    // Handle both old and new data structures
    const participants = heat.participants || heat.heatParticipants?.map((hp: any) => getParticipantById(hp.participantId)) || [];
    
    // If participants are already full objects (from heatResults), use them directly
    const heatParticipants = participants.map((p: any) => {
      if (p.id && p.name) {
        // This is already a full participant object
        return p;
      } else if (p.participantId) {
        // This is a heatParticipant object, get the full participant
        return getParticipantById(p.participantId);
      }
      return null;
    }).filter(Boolean);
    
    // Separate leaders and followers
    const leaders = heatParticipants.filter((p: any) => p?.role === 'leader' || p?.role === 'LEADER');
    const followers = heatParticipants.filter((p: any) => p?.role === 'follower' || p?.role === 'FOLLOWER');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Festival Logo - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <img
              src="/logo.png"
              alt="Festival Logo"
              className="w-24 h-24 object-contain opacity-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-blue-400/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/10 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400/5 rounded-full animate-ping"></div>
        </div>
        
        <div className="text-center z-10 max-w-7xl mx-auto px-8 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
              Heat #{heat.number}
            </h1>
            <p className="text-2xl text-white/80">
              Participants
            </p>
            <div className="mt-4 inline-flex items-center space-x-6 bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{leaders.length}</div>
                <div className="text-sm text-white/60">🕺 Leaders</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">{followers.length}</div>
                <div className="text-sm text-white/60">💃 Followers</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{heatParticipants.length}</div>
                <div className="text-sm text-white/60">Total</div>
              </div>
            </div>
          </div>
          
          {/* Participants Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leaders Section */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-blue-400 mb-2">🕺 Leaders</h2>
                <div className="w-32 h-1 bg-blue-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                {leaders.map((participant: any, index: number) => (
                  <div 
                    key={participant?.id} 
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 transform hover:scale-105 hover:bg-white/15"
                  >
                    <div className="flex items-center space-x-6">
                      {/* Position Badge */}
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-white/20 text-white">
                        {index + 1}
                      </div>
                      
                      {/* Participant Image */}
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-400/50">
                          <img
                            src={getParticipantImage(participant || undefined)}
                            alt={participant?.name || 'Participant'}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, participant)}
                          />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-black font-bold text-base">
                          #{participant?.number}
                        </div>
                      </div>
                      
                      {/* Participant Info */}
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-bold text-white mb-1">{participant?.name}</h3>
                        <p className="text-blue-300 text-sm">Leader</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Followers Section */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-pink-400 mb-2">💃 Followers</h2>
                <div className="w-32 h-1 bg-pink-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                {followers.map((participant: any, index: number) => (
                  <div 
                    key={participant?.id} 
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 transform hover:scale-105 hover:bg-white/15"
                  >
                    <div className="flex items-center space-x-6">
                      {/* Position Badge */}
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-white/20 text-white">
                        {index + 1}
                      </div>
                      
                      {/* Participant Image */}
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-pink-400/50">
                          <img
                            src={getParticipantImage(participant || undefined)}
                            alt={participant?.name || 'Participant'}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, participant)}
                          />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center text-black font-bold text-base">
                          #{participant?.number}
                        </div>
                      </div>
                      
                      {/* Participant Info */}
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-bold text-white mb-1">{participant?.name}</h3>
                        <p className="text-pink-300 text-sm">Follower</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSemifinalSlide = () => {
    const semifinalists = data.competitionState?.semifinalists || [];
    
    // Handle both ID arrays and full participant objects
    const participants = semifinalists.map((item: any) => {
      if (typeof item === 'string') {
        // If it's just an ID string, look up the participant
        return getParticipantById(item);
      } else if (item.id && item.name) {
        // If it's already a full participant object, use it directly
        return item;
      }
      return null;
    }).filter(Boolean);
    
    console.log('Semifinalists data:', semifinalists);
    console.log('Processed participants:', participants);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center relative overflow-hidden">
        {/* Festival Logo - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <img
              src="/logo.png"
              alt="Festival Logo"
              className="w-24 h-24 object-contain opacity-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-36 h-36 bg-green-400/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-400/10 rounded-full animate-bounce"></div>
        </div>
        
        <div className="text-center z-10 max-w-6xl mx-auto px-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4">
              🏆 SEMIFINALISTS 🏆
            </h1>
            <p className="text-2xl text-white/80">
              Top {participants.length} Dancers Advance to Final
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {participants.map((participant, index) => (
              <div key={participant?.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-400/50">
                      <img
                        src={getParticipantImage(participant || undefined)}
                        alt={participant?.name || 'Participant'}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, participant)}
                      />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-black font-bold text-base">
                      #{participant?.number}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{participant?.name}</h3>
                <p className="text-green-300 text-sm">
                  {participant?.role === 'leader' ? '🕺 Leader' : '💃 Follower'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFinalSlide = () => {
    const finalists = data.competitionState?.finalists || [];
    
    // Handle both ID arrays and full participant objects
    const participants = finalists.map((item: any) => {
      if (typeof item === 'string') {
        // If it's just an ID string, look up the participant
        return getParticipantById(item);
      } else if (item.id && item.name) {
        // If it's already a full participant object, use it directly
        return item;
      }
      return null;
    }).filter(Boolean);
    
    console.log('Finalists data:', finalists);
    console.log('Processed finalists:', participants);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Festival Logo - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <img
              src="/logo.png"
              alt="Festival Logo"
              className="w-24 h-24 object-contain opacity-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-40 h-40 bg-orange-400/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-red-400/10 rounded-full animate-bounce"></div>
        </div>
        
        <div className="text-center z-10 max-w-6xl mx-auto px-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-4">
              🎭 FINALISTS 🎭
            </h1>
            <p className="text-2xl text-white/80">
              Top {participants.length} Dancers Compete for Victory
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {participants.map((participant, index) => (
              <div key={participant?.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-orange-400/50">
                      <img
                        src={getParticipantImage(participant || undefined)}
                        alt={participant?.name || 'Participant'}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, participant)}
                      />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-black font-bold text-base">
                      #{participant?.number}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{participant?.name}</h3>
                <p className="text-orange-300 text-sm">
                  {participant?.role === 'leader' ? '🕺 Leader' : '💃 Follower'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWinnersSlide = () => {
    const winners = data.competitionState?.winners;
    if (!winners || !winners.leader || !winners.follower) return null;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 flex items-center justify-center relative overflow-hidden">
        {/* Festival Logo - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <img
              src="/logo.png"
              alt="Festival Logo"
              className="w-24 h-24 object-contain opacity-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-44 h-44 bg-yellow-400/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-amber-400/10 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-400/5 rounded-full animate-ping"></div>
        </div>
        
        <div className="text-center z-10 max-w-6xl mx-auto px-8">
          <div className="mb-12">
            <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 mb-6">
              🏆 WINNERS 🏆
            </h1>
            <p className="text-3xl text-white/80">
              Congratulations to Our Champions!
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Leaders */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-blue-400 mb-6">🕺 Leaders</h2>
              <div className="space-y-6">
                {[
                  { participant: winners.leader?.first, place: 1, medal: '🥇', color: 'from-yellow-400 to-amber-400' },
                  { participant: winners.leader?.second, place: 2, medal: '🥈', color: 'from-gray-300 to-gray-400' },
                  { participant: winners.leader?.third, place: 3, medal: '🥉', color: 'from-amber-600 to-orange-600' }
                ].filter(({ participant }) => participant).map(({ participant, place, medal, color }) => (
                  <div key={participant?.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-6">
                      <div className="text-6xl">{medal}</div>
                      <div className="flex items-center space-x-4">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/30">
                          <img
                            src={getParticipantImage(participant || undefined)}
                            alt={participant?.name || 'Participant'}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, participant)}
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-bold text-white">{participant?.name}</h3>
                          <p className="text-blue-300">#{participant?.number}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Followers */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-pink-400 mb-6">💃 Followers</h2>
              <div className="space-y-6">
                {[
                  { participant: winners.follower?.first, place: 1, medal: '🥇', color: 'from-yellow-400 to-amber-400' },
                  { participant: winners.follower?.second, place: 2, medal: '🥈', color: 'from-gray-300 to-gray-400' },
                  { participant: winners.follower?.third, place: 3, medal: '🥉', color: 'from-amber-600 to-orange-600' }
                ].filter(({ participant }) => participant).map(({ participant, place, medal, color }) => (
                  <div key={participant?.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-6">
                      <div className="text-6xl">{medal}</div>
                      <div className="flex items-center space-x-4">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/30">
                          <img
                            src={getParticipantImage(participant || undefined)}
                            alt={participant?.name || 'Participant'}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, participant)}
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-bold text-white">{participant?.name}</h3>
                          <p className="text-pink-300">#{participant?.number}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentSlide = () => {
    let slideIndex = 0;
    
    // Welcome slide
    if (currentSlide === slideIndex++) {
      return renderWelcomeSlide();
    }
    
    // Heat slides
    if (data.competitionState?.currentPhase === 'heats' && data.heats.length > 0) {
      for (const heat of data.heats) {
        if (currentSlide === slideIndex++) {
          return renderHeatSlide(heat);
        }
      }
    }
    
    // Semifinal slide
    if (data.competitionState?.currentPhase === 'semifinal' || data.competitionState?.currentPhase === 'final') {
      if (currentSlide === slideIndex++) {
        return renderSemifinalSlide();
      }
    }
    
    // Final slide
    if (data.competitionState?.currentPhase === 'final') {
      if (currentSlide === slideIndex++) {
        return renderFinalSlide();
      }
    }
    
    // Winners slide
    if (data.competitionState?.winners) {
      if (currentSlide === slideIndex++) {
        return renderWinnersSlide();
      }
    }
    
    // Fallback to welcome slide
    return renderWelcomeSlide();
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="fixed top-4 right-4 z-50 bg-black/50 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center space-x-4 text-white">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-500/50 rounded-lg hover:bg-blue-500/70 transition-colors"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + getTotalSlides()) % getTotalSlides())}
            className="px-3 py-2 bg-gray-500/50 rounded-lg hover:bg-gray-500/70 transition-colors"
          >
            ⏮️
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % getTotalSlides())}
            className="px-3 py-2 bg-gray-500/50 rounded-lg hover:bg-gray-500/70 transition-colors"
          >
            ⏭️
          </button>
          <select
            value={slideInterval}
            onChange={(e) => setSlideInterval(Number(e.target.value))}
            className="px-3 py-2 bg-gray-500/50 rounded-lg text-white border-none"
          >
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={8000}>8s</option>
            <option value={10000}>10s</option>
          </select>
        </div>
        <div className="text-center text-sm text-white/60 mt-2">
          Slide {currentSlide + 1} of {getTotalSlides()}
        </div>
      </div>
      
      {/* Main content */}
      {renderCurrentSlide()}
    </div>
  );
} 