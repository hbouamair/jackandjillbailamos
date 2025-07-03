'use client';

import { useState, useEffect } from 'react';
import { Participant, CompetitionState, Heat } from '../../types';

interface ResultsDisplayData {
  participants: Participant[];
  competitionState: CompetitionState | null;
  heats: Heat[];
  category?: 'AMATEUR' | 'PRO';
}

function getParticipantImage(participant: Participant | undefined) {
  if (participant?.pictureUrl) return participant.pictureUrl;
  const role = participant?.role?.toLowerCase();
  return role === 'leader' ? '/leader-placeholder.svg' : '/follower-placeholder.svg';
}

function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, participant: any) {
  const target = e.target as HTMLImageElement;
  target.src = participant?.role === 'leader' || participant?.role === 'LEADER'
    ? '/leader-placeholder.svg'
    : '/follower-placeholder.svg';
}

function Card({ participant, medal }: { participant: any, medal?: string }) {
  return (
    <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border-2 border-white/20 flex flex-col shadow-lg transition-all duration-300 hover:scale-105">
      {medal && (
        <div className="absolute top-2 left-2 text-3xl drop-shadow-lg z-10">{medal}</div>
      )}
      <div className="w-full h-48 bg-black/20">
        <img
          src={getParticipantImage(participant)}
          alt={participant?.name || 'Participant'}
          className="w-full h-full object-cover"
          onError={(e) => handleImageError(e, participant)}
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 bg-black/60 text-yellow-300 rounded-full px-3 py-1 text-xs font-bold">
          #{participant?.number}
        </div>
        <h3 className="text-lg font-bold text-white mb-1 mt-2">{participant?.name}</h3>
        <p className="text-yellow-200 text-sm">{participant?.role === 'leader' ? '🕺 Leader' : '💃 Follower'}</p>
      </div>
    </div>
  );
}

export default function ResultsDisplay() {
  const [data, setData] = useState<ResultsDisplayData>({ participants: [], competitionState: null, heats: [] });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin');
      const adminData = await response.json();
      const allParticipants = new Map();
      if (adminData.heatResults) {
        adminData.heatResults.forEach((heat: any) => {
          heat.participants.forEach((participant: any) => {
            allParticipants.set(participant.id, participant);
          });
        });
      }
      setData({
        participants: Array.from(allParticipants.values()),
        competitionState: adminData.competitionState,
        heats: adminData.heatResults || [],
        category: adminData.competitionState?.category || 'AMATEUR'
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // --- Unified Card Grid Split by Role ---
  function renderCardGridSplit({ title, participants, bgClass }: { title: string, participants: any[], bgClass: string }) {
    const leaders = participants.filter((p: any) => p?.role === 'leader' || p?.role === 'LEADER');
    const followers = participants.filter((p: any) => p?.role === 'follower' || p?.role === 'FOLLOWER');
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center relative overflow-hidden`}>
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-10 drop-shadow-lg">{title}</h1>
        <div className="flex flex-col lg:flex-row gap-12 w-full max-w-7xl px-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">🕺 Leaders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {leaders.map((participant: any) => (
                <Card key={participant?.id} participant={participant} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-pink-300 mb-6 text-center">💃 Followers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {followers.map((participant: any) => (
                <Card key={participant?.id} participant={participant} />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <img src="/logo.png" alt="Jack & Jill Logo" className="w-32 h-32 object-contain opacity-100 drop-shadow-lg" />
        </div>
      </div>
    );
  }

  // --- Winners Slide ---
  function renderWinnersSlide() {
    const winners = data.competitionState?.winners;
    if (!winners) return null;
    const leaderWinners = [
      { ...winners.leader?.first, medal: '🥇' },
      { ...winners.leader?.second, medal: '🥈' },
      { ...winners.leader?.third, medal: '🥉' },
    ].filter(Boolean);
    const followerWinners = [
      { ...winners.follower?.first, medal: '🥇' },
      { ...winners.follower?.second, medal: '🥈' },
      { ...winners.follower?.third, medal: '🥉' },
    ].filter(Boolean);
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 flex flex-col items-center justify-center relative overflow-hidden">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-10 drop-shadow-lg">WINNERS</h1>
        <div className="flex flex-col lg:flex-row gap-12 w-full max-w-5xl px-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">🕺 Leaders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {leaderWinners.map((participant: any) => (
                <Card key={participant?.id} participant={participant} medal={participant.medal} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-pink-300 mb-6 text-center">💃 Followers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {followerWinners.map((participant: any) => (
                <Card key={participant?.id} participant={participant} medal={participant.medal} />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <img src="/logo.png" alt="Jack & Jill Logo" className="w-32 h-32 object-contain opacity-100 drop-shadow-lg" />
        </div>
      </div>
    );
  }

  // --- Main Render ---
  if (!data.competitionState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">
        Loading...
      </div>
    );
  }

  if (data.competitionState.currentPhase === 'final' && data.competitionState.winners) {
    return renderWinnersSlide();
  }

  // Show only the current phase
  const phase = data.competitionState.currentPhase;

  if (phase === 'heats') {
    // Show only the current/active heat
    const activeHeat = data.heats[data.heats.length - 1];
    if (activeHeat) {
      const participants = (activeHeat.participants || []).map((p: any) => p);
      return renderCardGridSplit({
        title: `HEAT ${activeHeat.number}`,
        participants,
        bgClass: 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'
      });
    }
    // If no active heat, show a waiting message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-5xl font-bold mb-6">No Active Heat</h1>
        <p className="text-2xl">Waiting for the next heat to start...</p>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <img src="/logo.png" alt="Jack & Jill Logo" className="w-32 h-32 object-contain opacity-100 drop-shadow-lg" />
        </div>
      </div>
    );
  }

  if (phase === 'semifinal') {
    const participants = (data.competitionState.semifinalists || []).map((item: any) =>
      typeof item === 'string'
        ? data.participants.find((p) => p.id === item)
        : item
    ).filter(Boolean);
    return renderCardGridSplit({
      title: 'SEMIFINALISTS',
      participants,
      bgClass: 'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900'
    });
  }

  if (phase === 'final') {
    const participants = (data.competitionState.finalists || []).map((item: any) =>
      typeof item === 'string'
        ? data.participants.find((p) => p.id === item)
        : item
    ).filter(Boolean);
    return renderCardGridSplit({
      title: 'FINALISTS',
      participants,
      bgClass: 'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900'
    });
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">
      Waiting for competition phase...
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <img src="/logo.png" alt="Jack & Jill Logo" className="w-32 h-32 object-contain opacity-100 drop-shadow-lg" />
      </div>
    </div>
  );
}