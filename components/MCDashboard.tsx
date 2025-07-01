'use client';

import { useState, useEffect } from 'react';
import { User, Participant, Heat } from '@/types';

interface MCDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function MCDashboard({ user, onLogout }: MCDashboardProps) {
  const [heats, setHeats] = useState<any[]>([]);
  const [phase, setPhase] = useState<'heats' | 'semifinal' | 'final'>('heats');
  const [semifinalists, setSemifinalists] = useState<Participant[]>([]);
  const [finalists, setFinalists] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<{
    leader: { first: any; second: any; third: any } | null;
    follower: { first: any; second: any; third: any } | null;
  }>({
    leader: { first: null, second: null, third: null },
    follower: { first: null, second: null, third: null }
  });
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showPhaseNotification, setShowPhaseNotification] = useState(false);
  const [phaseNotification, setPhaseNotification] = useState('');
  const [previousPhase, setPreviousPhase] = useState<string>('');

  useEffect(() => {
    loadData();
    // Refresh data every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/mc');
      const data = await response.json();
      
      if (response.ok) {
        // Access data from the correct structure
        const competitionState = data.competitionState || {};
        const newPhase = competitionState.currentPhase || 'heats';
        
        // Check for phase transition
        if (previousPhase && previousPhase !== newPhase) {
          let notificationMessage = '';
          if (newPhase === 'semifinal') {
            notificationMessage = '🎉 The competition has advanced to the Semifinal phase! The top 8 leaders and 8 followers have been selected based on their heat scores.';
          } else if (newPhase === 'final') {
            notificationMessage = '🏆 The competition has advanced to the Final phase! The top 5 leaders and 5 followers have been selected based on their semifinal scores.';
          }
          
          if (notificationMessage) {
            setPhaseNotification(notificationMessage);
            setShowPhaseNotification(true);
            setTimeout(() => setShowPhaseNotification(false), 8000);
          }
        }
        
        setPreviousPhase(newPhase);
        setPhase(newPhase);
        setHeats(data.heatResults || []);
        setSemifinalists(competitionState.semifinalists || []);
        setFinalists(competitionState.finalists || []);
        setWinners(competitionState.winners || { 
          leader: { first: null, second: null, third: null }, 
          follower: { first: null, second: null, third: null } 
        });
        setStats(data.stats || {});
      } else {
        console.error('Failed to load MC data:', data.error);
      }
    } catch (error) {
      console.error('Failed to load MC data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-600 relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="text-6xl mb-4 animate-bounce">🎤</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading competition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-3xl sm:text-4xl animate-bounce">🎤</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">MC Dashboard</h1>
                <p className="text-white/80 text-sm sm:text-base">Welcome, {user.name}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30 text-base sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Phase Notification */}
      {showPhaseNotification && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 sm:p-6 rounded-xl backdrop-blur-lg border-2 shadow-lg transform transition-all duration-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/50">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="text-xl sm:text-2xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold mb-2">Phase Transition!</h3>
                <p className="text-xs sm:text-sm leading-relaxed">{phaseNotification}</p>
              </div>
              <button
                onClick={() => setShowPhaseNotification(false)}
                className="text-white/60 hover:text-white transition-colors text-lg sm:text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase Indicator */}
      <div className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium transition-all duration-300 w-full sm:w-auto text-center ${
              phase === 'heats' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' : 'bg-white/10 text-white/60'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <span>🔥</span>
                <span>Heats Phase</span>
              </div>
            </div>
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium transition-all duration-300 w-full sm:w-auto text-center ${
              phase === 'semifinal' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50' : 'bg-white/10 text-white/60'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <span>🥈</span>
                <span>Semifinal</span>
              </div>
            </div>
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium transition-all duration-300 w-full sm:w-auto text-center ${
              phase === 'final' ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50' : 'bg-white/10 text-white/60'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <span>🏆</span>
                <span>Final</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Current Phase Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Competition Status
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-3 sm:p-6 border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-300 mb-1 sm:mb-2">{stats.totalHeats || 0}</div>
                <div className="text-blue-200 text-xs sm:text-sm">Total Heats</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-3 sm:p-6 border border-purple-400/30 hover:bg-purple-500/30 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-300 mb-1 sm:mb-2">{semifinalists.length}</div>
                <div className="text-purple-200 text-xs sm:text-sm">Semifinalists</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-3 sm:p-6 border border-yellow-400/30 hover:bg-yellow-500/30 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">{finalists.length}</div>
                <div className="text-yellow-200 text-xs sm:text-sm">Finalists</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-3 sm:p-6 border border-green-400/30 hover:bg-green-500/30 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-300 mb-1 sm:mb-2">
                  {(() => {
                    const leaderWinners = [winners.leader?.first, winners.leader?.second, winners.leader?.third].filter(Boolean).length;
                    const followerWinners = [winners.follower?.first, winners.follower?.second, winners.follower?.third].filter(Boolean).length;
                    return leaderWinners + followerWinners;
                  })()}
                </div>
                <div className="text-green-200 text-xs sm:text-sm">Winners</div>
              </div>
            </div>
          </div>
        </div>

        {/* Heats Progress */}
        {phase === 'heats' && heats.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <span className="mr-3">🔥</span>
              Heats Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {heats.map((heat) => (
                <div key={heat.id} className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white">Heat {heat.number}</h3>
                    <div className="text-right">
                      <div className="text-white/60 text-xs sm:text-sm">
                        {heat.participants.filter((p: any) => p.averageScore > 0).length}/{heat.participants.length} scored
                      </div>
                      <div className="text-white/40 text-xs">
                        {heat.isActive ? '🟢 Active' : '⚪ Inactive'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 mb-3 sm:mb-4">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${heat.participants.length > 0 ? (heat.participants.filter((p: any) => p.averageScore > 0).length / heat.participants.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Participant counts */}
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                      <div className="text-blue-300 font-bold">{heat.participants.filter((p: any) => p.role === 'leader').length}</div>
                      <div className="text-blue-200 text-xs">Leaders</div>
                    </div>
                    <div className="bg-pink-500/20 rounded-lg p-2 text-center">
                      <div className="text-pink-300 font-bold">{heat.participants.filter((p: any) => p.role === 'follower').length}</div>
                      <div className="text-pink-200 text-xs">Followers</div>
                    </div>
                  </div>
                  
                  {/* Participants List */}
                  <div className="space-y-2">
                    <h4 className="text-white/80 text-xs sm:text-sm font-medium mb-2">Participants:</h4>
                    
                    {/* Leaders */}
                    <div className="space-y-1">
                      <div className="text-blue-300 text-xs font-medium">🕺 Leaders:</div>
                      {heat.participants
                        .filter((p: any) => p.role === 'leader')
                        .map((participant: any) => (
                          <div key={participant.id} className="flex justify-between items-center bg-blue-500/10 rounded px-2 py-1">
                            <span className="text-white text-xs">
                              #{participant.number} {participant.name}
                            </span>
                            {participant.averageScore > 0 && (
                              <span className="text-blue-300 text-xs font-medium">
                                {participant.averageScore}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                    
                    {/* Followers */}
                    <div className="space-y-1">
                      <div className="text-pink-300 text-xs font-medium">💃 Followers:</div>
                      {heat.participants
                        .filter((p: any) => p.role === 'follower')
                        .map((participant: any) => (
                          <div key={participant.id} className="flex justify-between items-center bg-pink-500/10 rounded px-2 py-1">
                            <span className="text-white text-xs">
                              #{participant.number} {participant.name}
                            </span>
                            {participant.averageScore > 0 && (
                              <span className="text-pink-300 text-xs font-medium">
                                {participant.averageScore}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Semifinalists */}
        {semifinalists.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <span className="mr-3">🥈</span>
              Semifinalists
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">🕺</span>
                  Leaders
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {semifinalists
                    .filter(p => p.role === 'leader')
                    .map((participant, index) => (
                      <div key={participant.id} className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-3 sm:p-4 border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base">{participant.name}</div>
                            <div className="text-blue-300 text-xs sm:text-sm">#{participant.number}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-pink-300 mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">💃</span>
                  Followers
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {semifinalists
                    .filter(p => p.role === 'follower')
                    .map((participant, index) => (
                      <div key={participant.id} className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-xl p-3 sm:p-4 border border-pink-400/30 hover:bg-pink-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base">{participant.name}</div>
                            <div className="text-pink-300 text-xs sm:text-sm">#{participant.number}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finalists */}
        {finalists.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <span className="mr-3">🥇</span>
              Finalists
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">🕺</span>
                  Leaders
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {finalists
                    .filter(p => p.role === 'leader')
                    .map((participant, index) => (
                      <div key={participant.id} className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-3 sm:p-4 border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base">{participant.name}</div>
                            <div className="text-blue-300 text-xs sm:text-sm">#{participant.number}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-pink-300 mb-3 sm:mb-4 flex items-center">
                  <span className="mr-2">💃</span>
                  Followers
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {finalists
                    .filter(p => p.role === 'follower')
                    .map((participant, index) => (
                      <div key={participant.id} className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-xl p-3 sm:p-4 border border-pink-400/30 hover:bg-pink-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base">{participant.name}</div>
                            <div className="text-pink-300 text-xs sm:text-sm">#{participant.number}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Winners */}
        {winners && (winners.leader?.first || winners.follower?.first) && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-yellow-400/30">
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-4 sm:mb-6 flex items-center justify-center">
              <span className="mr-3">🏆</span>
              Competition Winners
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-3 sm:mb-4 flex items-center justify-center">
                  <span className="mr-2">🕺</span>
                  Leaders
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* 1st Place */}
                  {winners.leader?.first && (
                    <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-3 sm:p-4 border border-yellow-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥇
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.leader.first.name}</div>
                          <div className="text-yellow-300 text-xs sm:text-sm">#{winners.leader.first.number}</div>
                          <div className="text-yellow-200 text-xs">1st Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 2nd Place */}
                  {winners.leader?.second && (
                    <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-3 sm:p-4 border border-gray-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥈
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.leader.second.name}</div>
                          <div className="text-gray-300 text-xs sm:text-sm">#{winners.leader.second.number}</div>
                          <div className="text-gray-200 text-xs">2nd Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 3rd Place */}
                  {winners.leader?.third && (
                    <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-3 sm:p-4 border border-orange-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥉
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.leader.third.name}</div>
                          <div className="text-orange-300 text-xs sm:text-sm">#{winners.leader.third.number}</div>
                          <div className="text-orange-200 text-xs">3rd Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-orange-300 mb-3 sm:mb-4 flex items-center justify-center">
                  <span className="mr-2">💃</span>
                  Followers
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* 1st Place */}
                  {winners.follower?.first && (
                    <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-3 sm:p-4 border border-yellow-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥇
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.follower.first.name}</div>
                          <div className="text-yellow-300 text-xs sm:text-sm">#{winners.follower.first.number}</div>
                          <div className="text-yellow-200 text-xs">1st Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 2nd Place */}
                  {winners.follower?.second && (
                    <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-3 sm:p-4 border border-gray-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥈
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.follower.second.name}</div>
                          <div className="text-gray-300 text-xs sm:text-sm">#{winners.follower.second.number}</div>
                          <div className="text-gray-200 text-xs">2nd Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 3rd Place */}
                  {winners.follower?.third && (
                    <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-3 sm:p-4 border border-orange-400/50">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/70 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                          🥉
                        </div>
                        <div>
                          <div className="font-bold text-white text-base sm:text-lg">{winners.follower.third.name}</div>
                          <div className="text-orange-300 text-xs sm:text-sm">#{winners.follower.third.number}</div>
                          <div className="text-orange-200 text-xs">3rd Place</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Updates Notice */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white/20">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-white/80 text-xs sm:text-sm">🔄 This dashboard updates automatically every 5 seconds</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 