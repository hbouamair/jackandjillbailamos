'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Participant, Heat, Rotation, Score } from '@/types';

interface JudgeDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function JudgeDashboard({ user, onLogout }: JudgeDashboardProps) {
  const [activeHeat, setActiveHeat] = useState<any | null>(null);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'heats' | 'semifinal' | 'final'>('heats');
  const [loading, setLoading] = useState(true);
  const [hasActiveHeat, setHasActiveHeat] = useState(false);
  const [hasScoredForHeat, setHasScoredForHeat] = useState(false);
  const [hasScoredForPhase, setHasScoredForPhase] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isUserActive, setIsUserActive] = useState(true);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity to pause auto-refresh when they're scoring
  useEffect(() => {
    const handleUserActivity = () => {
      setIsUserActive(true);
      setShowRefreshButton(false);
      
      // Clear existing timeout
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
      
      // Set timeout to mark user as inactive after 30 seconds of no activity
      userActivityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 30000);
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
    };
  }, []);

  // Smart refresh system
  useEffect(() => {
    const startRefreshTimer = () => {
      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Only auto-refresh if user is not active and there's no active heat to score
      const shouldAutoRefresh = !isUserActive && (!hasActiveHeat || hasScoredForHeat);
      const refreshInterval = shouldAutoRefresh ? 15000 : 30000; // 15s if inactive, 30s if active

      refreshTimeoutRef.current = setTimeout(() => {
        // Show refresh button if user is active and we haven't refreshed recently
        if (isUserActive && !hasActiveHeat) {
          setShowRefreshButton(true);
        } else {
          loadData();
        }
      }, refreshInterval);
    };

    startRefreshTimer();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isUserActive, hasActiveHeat, hasScoredForHeat, lastRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/judges/scoring?userId=${user.id}&role=${user.role}`);
      const data = await response.json();
      
      if (response.ok) {
        setPhase(data.phase);
        setActiveHeat(data.activeHeat);
        setParticipants(data.participants || []);
        setHasActiveHeat(data.hasActiveHeat);
        setHasScoredForHeat(data.hasScoredForHeat || false);
        setHasScoredForPhase(data.hasScoredForPhase || false);
        setMessage(data.message || '');
        setLastRefresh(new Date());
        setShowRefreshButton(false);
      } else {
        setMessage(`Error: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Failed to load scoring data');
      setTimeout(() => setMessage(''), 5000);
    }
    setLoading(false);
  };

  const handleManualRefresh = () => {
    loadData();
  };

  const getParticipantsToJudge = (): any[] => {
    if (phase === 'heats' && activeHeat) {
      return activeHeat.participants.filter((p: any) => p.role === user.role);
    } else if (phase === 'semifinal' || phase === 'final') {
      return participants;
    }
    return [];
  };

  const handleScoreChange = (participantId: string, score: number) => {
    const newScores = new Map(scores);
    newScores.set(participantId, score);
    setScores(newScores);
    // Mark user as active when they're scoring
    setIsUserActive(true);
    setShowRefreshButton(false);
  };

  const submitScores = async () => {
    const participantsToJudge = getParticipantsToJudge();
    const scoresToSubmit = participantsToJudge
      .map(participant => {
        const score = scores.get(participant.id);
        if (score && score >= 1 && score <= 10) {
          return {
            participantId: participant.id,
            score: score
          };
        }
        return null;
      })
      .filter(Boolean);

    if (scoresToSubmit.length === 0) {
      setMessage('Please enter valid scores (1-10) for all participants');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch('/api/judges/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          scores: scoresToSubmit,
          phase: phase,
          heatId: activeHeat?.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Scores submitted successfully for ${scoresToSubmit.length} participants!`);
        setScores(new Map());
        setTimeout(() => setMessage(''), 3000);
        // Reload data to update progress
        loadData();
      } else {
        setMessage(`Error: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Failed to submit scores');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const participantsToJudge = getParticipantsToJudge();

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
          <div className="text-6xl mb-4 animate-bounce">⚖️</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading scoring data...</p>
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
              <div className="text-3xl sm:text-4xl animate-bounce">⚖️</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Judge Dashboard</h1>
                <p className="text-white/80 text-sm sm:text-base">
                  {user.name} - {user.role} Judge
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Manual Refresh Button */}
              {showRefreshButton && (
                <button
                  onClick={handleManualRefresh}
                  className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full hover:bg-blue-500/30 transition-all duration-300 backdrop-blur-sm border border-blue-400/30 text-sm"
                >
                  🔄 Refresh
                </button>
              )}
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30 text-base sm:text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-refresh Status */}
      <div className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isUserActive ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span>
                {isUserActive ? 'Auto-refresh paused (you are active)' : 'Auto-refresh active'}
              </span>
            </div>
            <div className="text-right">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-medium transition-all duration-300 w-full sm:w-auto text-center ${
              phase === 'heats' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' : 'bg-white/10 text-white/60'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <span>🔥</span>
                <span>Heats</span>
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

      {/* Message */}
      {message && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-3 sm:p-4 rounded-xl backdrop-blur-lg text-sm sm:text-base ${
            message.includes('Error') ? 'bg-red-500/20 text-red-200 border border-red-400/30' : 'bg-green-500/20 text-green-200 border border-green-400/30'
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {phase === 'heats' && !hasActiveHeat && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-12 border border-white/20 text-center">
            <div className="text-4xl sm:text-6xl mb-4">⏳</div>
            <p className="text-white/80 text-lg sm:text-xl mb-4">Waiting for active heat...</p>
            <p className="text-white/60 text-base sm:text-lg">The admin will activate a heat on the dance floor when ready.</p>
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <p className="text-blue-200 text-xs sm:text-sm">
                💡 This page will automatically refresh when a heat becomes active, or you can manually refresh using the button above.
              </p>
            </div>
          </div>
        )}

        {/* Scoring Interface for Active Heat */}
        {phase === 'heats' && hasActiveHeat && activeHeat && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Score {user.role}s - Heat {activeHeat.number}
            </h2>
            {hasScoredForHeat ? (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <p className="text-blue-200 text-center text-sm sm:text-base">
                  ✅ You have already scored for Heat {activeHeat.number}. Please wait for the admin to activate the next heat.
                </p>
              </div>
            ) : (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-500/20 rounded-xl border border-green-400/30">
              <p className="text-green-200 text-center text-sm sm:text-base">
                🎯 Heat {activeHeat.number} is now active on the dance floor! Score the {user.role}s in this heat.
              </p>
            </div>
            )}
            
            <div className="space-y-4 sm:space-y-6">
              {participantsToJudge.map((participant) => (
                <div key={participant.id} className="bg-white/10 rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                        #{participant.number}
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-white">{participant.name}</div>
                        <div className="text-white/60 text-sm sm:text-base">#{participant.number}</div>
                        {participant.scored && (
                          <div className="text-green-400 text-xs sm:text-sm">✓ Already scored</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(participant.id, score)}
                          disabled={hasScoredForHeat}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-110 ${
                            hasScoredForHeat
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : scores.get(participant.id) === score
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                              : 'bg-white/20 text-white/80 hover:bg-white/30 border border-white/30'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={submitScores}
                disabled={hasScoredForHeat}
                className={`px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform text-sm sm:text-base ${
                  hasScoredForHeat
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 focus:ring-green-400 hover:scale-105 shadow-lg'
                }`}
              >
                {hasScoredForHeat ? 'Already Scored' : 'Submit Scores'}
              </button>
            </div>
          </div>
        )}

        {/* Scoring Interface for Semifinal/Final */}
        {(phase === 'semifinal' || phase === 'final') && participants.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Score {user.role}s - {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </h2>
            {hasScoredForPhase ? (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <p className="text-blue-200 text-center text-sm sm:text-base">
                  ✅ You have already scored for the {phase}. Please wait for the next phase.
                </p>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <p className="text-purple-200 text-center text-sm sm:text-base">
                  🎯 {phase.charAt(0).toUpperCase() + phase.slice(1)} is now active! Score the {user.role}s in this phase.
                </p>
              </div>
            )}
            
            <div className="space-y-4 sm:space-y-6">
              {participants.map((participant) => (
                <div key={participant.id} className="bg-white/10 rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                        #{participant.number}
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-white">{participant.name}</div>
                        <div className="text-white/60 text-sm sm:text-base">#{participant.number}</div>
                        {participant.scored && (
                          <div className="text-green-400 text-xs sm:text-sm">✓ Already scored</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(participant.id, score)}
                          disabled={hasScoredForPhase}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-110 ${
                            hasScoredForPhase
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : scores.get(participant.id) === score
                              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                              : 'bg-white/20 text-white/80 hover:bg-white/30 border border-white/30'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={submitScores}
                disabled={hasScoredForPhase}
                className={`px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform text-sm sm:text-base ${
                  hasScoredForPhase
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:from-purple-500 hover:to-pink-600 focus:ring-purple-400 hover:scale-105 shadow-lg'
                }`}
              >
                {hasScoredForPhase ? 'Already Scored' : 'Submit Scores'}
              </button>
            </div>
          </div>
        )}


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