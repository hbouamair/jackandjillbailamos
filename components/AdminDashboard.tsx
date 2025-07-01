'use client';

import { useState, useEffect } from 'react';
import { User, Participant, Judge, Role } from '@/types';
import { competitionStore } from '@/lib/store';
import { Plus, Users, Award, Settings, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'judges' | 'competition' | 'results'>('overview');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', role: 'leader' as Role, number: 1, pictureUrl: '' });
  const [newJudge, setNewJudge] = useState({ name: '', role: 'leader' as Role, username: '', password: '' });
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState('');
  const [editParticipantId, setEditParticipantId] = useState<string | null>(null);
  const [editParticipant, setEditParticipant] = useState({ name: '', role: 'leader' as Role, number: 1 });
  const [loadingJudges, setLoadingJudges] = useState(false);
  const [judgeError, setJudgeError] = useState('');
  const [editJudgeId, setEditJudgeId] = useState<string | null>(null);
  const [editJudge, setEditJudge] = useState({ name: '', role: 'leader' as Role, username: '', password: '' });
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [showResultsDisplay, setShowResultsDisplay] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchParticipants();
    fetchJudges();
    fetchAdminData();
  };

  const fetchAdminData = async () => {
    setLoadingAdminData(true);
    try {
      const response = await fetch('/api/admin');
      const data = await response.json();
      if (response.ok) {
        setAdminData(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoadingAdminData(false);
  };

  const fetchParticipants = async () => {
    setLoadingParticipants(true);
    setParticipantError("");
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setParticipants(data);
    } catch (e) {
      setParticipantError("Failed to load participants");
    }
    setLoadingParticipants(false);
  };

  const fetchJudges = async () => {
    setLoadingJudges(true);
    setJudgeError("");
    try {
      const res = await fetch("/api/judges");
      const data = await res.json();
      setJudges(data);
    } catch (e) {
      setJudgeError("Failed to load judges");
    }
    setLoadingJudges(false);
  };

  const getCompetitionState = () => {
    return adminData?.competitionState || null;
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setParticipantError("");
    setUploadingImage(true);
    
    try {
      let pictureUrl = '';
      if (selectedImage) {
        pictureUrl = await uploadImage(selectedImage);
      }

      await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newParticipant, pictureUrl }),
      });
      
      setNewParticipant({ name: '', role: 'leader' as Role, number: 1, pictureUrl: '' });
      setSelectedImage(null);
      setImagePreview('');
      setMessage('Participant added successfully!');
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add participant";
      setParticipantError(errorMessage);
      console.error('Error adding participant:', e);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setJudgeError("");
    try {
      await fetch("/api/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJudge),
      });
      setNewJudge({ name: '', role: 'leader' as Role, username: '', password: '' });
      setMessage('Judge added successfully!');
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setJudgeError("Failed to add judge");
    }
  };

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParticipantId) return;
    setParticipantError("");
    try {
      await fetch(`/api/participants/${editParticipantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editParticipant),
      });
      setEditParticipantId(null);
      fetchParticipants();
    } catch (e) {
      setParticipantError("Failed to update participant");
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    setParticipantError("");
    try {
      await fetch(`/api/participants/${id}`, { method: "DELETE" });
      fetchParticipants();
    } catch (e) {
      setParticipantError("Failed to delete participant");
    }
  };

  const handleUpdateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJudgeId) return;
    setJudgeError("");
    try {
      await fetch(`/api/judges/${editJudgeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editJudge),
      });
      setEditJudgeId(null);
      fetchJudges();
    } catch (e) {
      setJudgeError("Failed to update judge");
    }
  };

  const handleDeleteJudge = async (id: string) => {
    setJudgeError("");
    try {
      await fetch(`/api/judges/${id}`, { method: "DELETE" });
      fetchJudges();
    } catch (e) {
      setJudgeError("Failed to delete judge");
    }
  };

  const startEditParticipant = (p: Participant) => {
    setEditParticipantId(p.id);
    setEditParticipant({ name: p.name, role: p.role, number: p.number });
  };

  const startEditJudge = (j: Judge) => {
    setEditJudgeId(j.id);
    setEditJudge({ name: j.name, role: j.role, username: j.username, password: j.password });
  };

  const generateHeats = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_heats' })
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotificationType('success');
        setNotificationTitle('🔥 Heats Generated!');
        setNotificationMessage(`Successfully generated ${data.heats} heats with random participant distribution. The competition is now ready to begin!`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
        fetchAdminData(); // Refresh data to show the new heats
      } else {
        setNotificationType('error');
        setNotificationTitle('❌ Error');
        setNotificationMessage(`Failed to generate heats: ${data.error}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      setNotificationType('error');
      setNotificationTitle('❌ Error');
      setNotificationMessage('Failed to generate heats. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const advanceToSemifinal = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_semifinal' })
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotificationType('success');
        setNotificationTitle('🎉 Advanced to Semifinal!');
        setNotificationMessage(`Successfully advanced to semifinal phase with ${data.semifinalists} participants. The top 8 leaders and 8 followers have been selected based on their heat scores.`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
        fetchAdminData(); // Refresh data to show semifinalists
      } else {
        setNotificationType('error');
        setNotificationTitle('❌ Error');
        setNotificationMessage(`Failed to advance to semifinal: ${data.error}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      setNotificationType('error');
      setNotificationTitle('❌ Error');
      setNotificationMessage('Failed to advance to semifinal. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const advanceToFinal = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_final' })
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotificationType('success');
        setNotificationTitle('🏆 Advanced to Final!');
        setNotificationMessage(`Successfully advanced to final phase with ${data.finalists} participants. The top 5 leaders and 5 followers have been selected based on their semifinal scores.`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
        fetchAdminData(); // Refresh data to show finalists
      } else {
        setNotificationType('error');
        setNotificationTitle('❌ Error');
        setNotificationMessage(`Failed to advance to final: ${data.error}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      setNotificationType('error');
      setNotificationTitle('❌ Error');
      setNotificationMessage('Failed to advance to final. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const determineWinners = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'determine_winners' })
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotificationType('success');
        setNotificationTitle('👑 Winners Determined!');
        setNotificationMessage(data.message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
        fetchAdminData(); // Refresh data to show winners
      } else {
        setNotificationType('error');
        setNotificationTitle('❌ Error');
        setNotificationMessage(`Failed to determine winners: ${data.error}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      setNotificationType('error');
      setNotificationTitle('❌ Error');
      setNotificationMessage('Failed to determine winners. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const setActiveHeat = async (heatId: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active_heat', heatId })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
        fetchAdminData();
      } else {
        setMessage(`Error: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Error: Failed to set active heat');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const populateDemoData = async () => {
    try {
      const response = await fetch('/api/demo', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage('Demo data populated successfully!');
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error: Failed to populate demo data');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Error: Failed to populate demo data');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const leaders = participants.filter(p => p.role === 'leader');
  const followers = participants.filter(p => p.role === 'follower');
  const state = getCompetitionState();

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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl animate-bounce">👑</div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/80">
                  {user.name} - Competition Administrator
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-6 rounded-xl backdrop-blur-lg border-2 shadow-lg transform transition-all duration-500 ${
            notificationType === 'success' 
              ? 'bg-green-500/20 text-green-200 border-green-400/50' 
              : notificationType === 'error'
              ? 'bg-red-500/20 text-red-200 border-red-400/50'
              : 'bg-blue-500/20 text-blue-200 border-blue-400/50'
          }`}>
            <div className="flex items-start space-x-4">
              <div className="text-2xl">
                {notificationType === 'success' ? '✅' : notificationType === 'error' ? '❌' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{notificationTitle}</h3>
                <p className="text-sm leading-relaxed">{notificationMessage}</p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 py-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'overview' 
                  ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'participants' 
                  ? 'bg-green-500/30 text-green-200 border border-green-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              👥 Participants
            </button>
            <button
              onClick={() => setActiveTab('judges')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'judges' 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              ⚖️ Judges
            </button>
            <button
              onClick={() => setActiveTab('competition')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'competition' 
                  ? 'bg-orange-500/30 text-orange-200 border border-orange-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              🏆 Competition
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'results' 
                  ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              📺 Results Display
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Competition Status */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Competition Phase</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {adminData?.competition?.phase || 'Not Started'}
                    </p>
                  </div>
                  <div className="text-3xl">
                    {adminData?.competition?.phase === 'heats' && '🔥'}
                    {adminData?.competition?.phase === 'semifinal' && '⚡'}
                    {adminData?.competition?.phase === 'final' && '🏆'}
                    {adminData?.competition?.phase === 'winners' && '👑'}
                  </div>
                </div>
              </div>

              {/* Participants Count */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Participants</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {participants.length}
                    </p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>

              {/* Judges Count */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Active Judges</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {judges.length}
                    </p>
                  </div>
                  <div className="text-3xl">⚖️</div>
                </div>
              </div>

              {/* Current Heat */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Current Heat</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {adminData?.competition?.currentHeat || 'N/A'}
                    </p>
                  </div>
                  <div className="text-3xl">🎵</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('participants')}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-4 py-3 rounded-xl border border-green-400/30 transition-all duration-300"
                >
                  Manage Participants
                </button>
                <button
                  onClick={() => setActiveTab('judges')}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-4 py-3 rounded-xl border border-purple-400/30 transition-all duration-300"
                >
                  Manage Judges
                </button>
                <button
                  onClick={() => setActiveTab('competition')}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 px-4 py-3 rounded-xl border border-orange-400/30 transition-all duration-300"
                >
                  Competition Control
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-white/80">
                  <span className="text-lg">📊</span>
                  <span>Competition phase: {adminData?.competition?.phase || 'Not started'}</span>
                </div>
                <div className="flex items-center space-x-3 text-white/80">
                  <span className="text-lg">👥</span>
                  <span>{participants.length} participants registered</span>
                </div>
                <div className="flex items-center space-x-3 text-white/80">
                  <span className="text-lg">⚖️</span>
                  <span>{judges.length} judges active</span>
                </div>
                {adminData?.competition?.currentHeat && (
                  <div className="flex items-center space-x-3 text-white/80">
                    <span className="text-lg">🎵</span>
                    <span>Current heat: {adminData.competition.currentHeat}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "participants" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Participants</p>
                    <p className="text-3xl font-bold text-white">{participants.length}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Leaders</p>
                    <p className="text-3xl font-bold text-blue-300">{leaders.length}</p>
                  </div>
                  <div className="text-4xl">🕺</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Followers</p>
                    <p className="text-3xl font-bold text-pink-300">{followers.length}</p>
                  </div>
                  <div className="text-4xl">💃</div>
                </div>
              </div>
            </div>

            {/* Add Participant Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">✨</span>
                Add New Participant
              </h2>
              <form onSubmit={handleAddParticipant} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newParticipant.name}
                    onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="Participant name"
                    className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                    required
                  />
                  <select
                    value={newParticipant.role}
                    onChange={e => setNewParticipant({ ...newParticipant, role: e.target.value as "leader" | "follower" })}
                    className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="leader">🕺 Leader</option>
                    <option value="follower">💃 Follower</option>
                  </select>
                  <input
                    type="number"
                    value={newParticipant.number}
                    onChange={e => setNewParticipant({ ...newParticipant, number: Number(e.target.value) })}
                    min={1}
                    className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <label className="block text-white font-medium">📸 Participant Photo</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="participant-image"
                    />
                    <label
                      htmlFor="participant-image"
                      className="px-6 py-3 bg-white/20 border border-white/30 rounded-xl text-white cursor-pointer hover:bg-white/30 transition-colors"
                    >
                      📁 Choose Image
                    </label>
                    {selectedImage && (
                      <span className="text-green-300 text-sm">
                        ✓ {selectedImage.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-white/30">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? '⏳ Adding Participant...' : '✨ Add Participant'}
                </button>
              </form>
            </div>

            {participantError && (
              <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-4 border border-red-400/30 text-red-200">
                {participantError}
              </div>
            )}

            {/* Participants List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🎭</span>
                Participants List
              </h3>
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leaders */}
                  <div>
                    <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                      <span className="mr-2">🕺</span>
                      Leaders ({leaders.length})
                    </h4>
                    <div className="space-y-3">
                      {leaders.map(p =>
                        editParticipantId === p.id ? (
                          <form key={p.id} onSubmit={handleUpdateParticipant} className="bg-white/10 rounded-xl p-4 border border-white/20">
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                value={editParticipant.name}
                                onChange={e => setEditParticipant({ ...editParticipant, name: e.target.value })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              />
                              <select
                                value={editParticipant.role}
                                onChange={e => setEditParticipant({ ...editParticipant, role: e.target.value as "leader" | "follower" })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              >
                                <option value="leader">🕺 Leader</option>
                                <option value="follower">💃 Follower</option>
                              </select>
                              <input
                                type="number"
                                value={editParticipant.number}
                                onChange={e => setEditParticipant({ ...editParticipant, number: Number(e.target.value) })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm">Save</button>
                              <button type="button" onClick={() => setEditParticipantId(null)} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div key={p.id} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {p.pictureUrl ? (
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400/50">
                                    <img
                                      src={p.pictureUrl}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center text-blue-300 font-bold">
                                    #{p.number}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{p.name}</p>
                                  <p className="text-blue-300 text-sm">🕺 Leader</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => startEditParticipant(p)} className="px-3 py-1 bg-blue-500/50 text-blue-200 rounded-lg text-sm hover:bg-blue-500/70 transition-colors">
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteParticipant(p.id)} className="px-3 py-1 bg-red-500/50 text-red-200 rounded-lg text-sm hover:bg-red-500/70 transition-colors">
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Followers */}
                  <div>
                    <h4 className="text-lg font-semibold text-pink-300 mb-4 flex items-center">
                      <span className="mr-2">💃</span>
                      Followers ({followers.length})
                    </h4>
                    <div className="space-y-3">
                      {followers.map(p =>
                        editParticipantId === p.id ? (
                          <form key={p.id} onSubmit={handleUpdateParticipant} className="bg-white/10 rounded-xl p-4 border border-white/20">
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                value={editParticipant.name}
                                onChange={e => setEditParticipant({ ...editParticipant, name: e.target.value })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              />
                              <select
                                value={editParticipant.role}
                                onChange={e => setEditParticipant({ ...editParticipant, role: e.target.value as "leader" | "follower" })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              >
                                <option value="leader">🕺 Leader</option>
                                <option value="follower">💃 Follower</option>
                              </select>
                              <input
                                type="number"
                                value={editParticipant.number}
                                onChange={e => setEditParticipant({ ...editParticipant, number: Number(e.target.value) })}
                                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm">Save</button>
                              <button type="button" onClick={() => setEditParticipantId(null)} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div key={p.id} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {p.pictureUrl ? (
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-400/50">
                                    <img
                                      src={p.pictureUrl}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-pink-500/30 rounded-full flex items-center justify-center text-pink-300 font-bold">
                                    #{p.number}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{p.name}</p>
                                  <p className="text-pink-300 text-sm">💃 Follower</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => startEditParticipant(p)} className="px-3 py-1 bg-pink-500/50 text-pink-200 rounded-lg text-sm hover:bg-pink-500/70 transition-colors">
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteParticipant(p.id)} className="px-3 py-1 bg-red-500/50 text-red-200 rounded-lg text-sm hover:bg-red-500/70 transition-colors">
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "judges" && (
          <div className="space-y-8">
            {/* Add Judge Form */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">⚖️</span>
                Add New Judge
              </h2>
              <form onSubmit={handleAddJudge} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  value={newJudge.name}
                  onChange={e => setNewJudge({ ...newJudge, name: e.target.value })}
                  placeholder="Judge name"
                  className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  required
                />
                <select
                  value={newJudge.role}
                  onChange={e => setNewJudge({ ...newJudge, role: e.target.value as "leader" | "follower" })}
                  className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="leader">🕺 Leader Judge</option>
                  <option value="follower">💃 Follower Judge</option>
                </select>
                <input
                  type="text"
                  value={newJudge.username}
                  onChange={e => setNewJudge({ ...newJudge, username: e.target.value })}
                  placeholder="Username"
                  className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  required
                />
                <input
                  type="password"
                  value={newJudge.password}
                  onChange={e => setNewJudge({ ...newJudge, password: e.target.value })}
                  placeholder="Password"
                  className="px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Judge
                </button>
              </form>
            </div>

            {judgeError && (
              <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-4 border border-red-400/30 text-red-200">
                {judgeError}
              </div>
            )}

            {/* Judges List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">👨‍⚖️</span>
                Judges List ({judges.length})
              </h3>
              {loadingJudges ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {judges.map(j =>
                    editJudgeId === j.id ? (
                      <form key={j.id} onSubmit={handleUpdateJudge} className="bg-white/10 rounded-xl p-6 border border-white/20">
                        <div className="space-y-3">
                          <input
                            value={editJudge.name}
                            onChange={e => setEditJudge({ ...editJudge, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                          />
                          <select
                            value={editJudge.role}
                            onChange={e => setEditJudge({ ...editJudge, role: e.target.value as "leader" | "follower" })}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                          >
                            <option value="leader">🕺 Leader Judge</option>
                            <option value="follower">💃 Follower Judge</option>
                          </select>
                          <input
                            value={editJudge.username}
                            onChange={e => setEditJudge({ ...editJudge, username: e.target.value })}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                          />
                          <input
                            type="password"
                            value={editJudge.password}
                            onChange={e => setEditJudge({ ...editJudge, password: e.target.value })}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm">Save</button>
                          <button type="button" onClick={() => setEditJudgeId(null)} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div key={j.id} className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            j.role === "leader" ? "bg-blue-500/30" : "bg-pink-500/30"
                          }`}>
                            <span className="text-2xl">{j.role === "leader" ? "🕺" : "💃"}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{j.name}</p>
                            <p className={`text-sm ${j.role === "leader" ? "text-blue-300" : "text-pink-300"}`}>
                              {j.role === "leader" ? "🕺 Leader Judge" : "💃 Follower Judge"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p className="text-white/80 text-sm">Username: <span className="text-white">{j.username}</span></p>
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button onClick={() => startEditJudge(j)} className="px-3 py-1 bg-purple-500/50 text-purple-200 rounded-lg text-sm hover:bg-purple-500/70 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteJudge(j.id)} className="px-3 py-1 bg-red-500/50 text-red-200 rounded-lg text-sm hover:bg-red-500/70 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "competition" && (
          <div className="space-y-8">
            {/* Competition Management */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🏆</span>
                Competition Management
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Generate Heats */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔥</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Generate Heats</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Create 3 heats with 5 couples each from 15 leaders and 15 followers
                    </p>
                    <button
                      onClick={generateHeats}
                      className="px-6 py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Generate Heats
                    </button>
                  </div>
                </div>

                {/* Advance to Semifinal */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🥈</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Advance to Semifinal</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Move top performers to semifinal round
                    </p>
                    <button
                      onClick={advanceToSemifinal}
                      className="px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Advance to Semifinal
                    </button>
                  </div>
                </div>

                {/* Advance to Final */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Advance to Final</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Move semifinal winners to final round
                    </p>
                    <button
                      onClick={advanceToFinal}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Advance to Final
                    </button>
                  </div>
                </div>

                {/* Determine Winners */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">👑</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Determine Winners</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Calculate final winners based on scores
                    </p>
                    <button
                      onClick={determineWinners}
                      className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Determine Winners
                    </button>
                  </div>
                </div>

                {/* Reset Competition */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔄</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Reset Competition</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Clear all competition data and start fresh
                    </p>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to reset the competition? This will clear all heats and scores.')) {
                          try {
                            const response = await fetch('/api/admin', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'reset_competition' })
                            });
                            const data = await response.json();
                            
                            if (response.ok) {
                              setMessage('Competition reset successfully!');
                              setTimeout(() => setMessage(''), 3000);
                            } else {
                              setMessage(`Error: ${data.error}`);
                              setTimeout(() => setMessage(''), 5000);
                            }
                          } catch (error) {
                            setMessage('Error: Failed to reset competition');
                            setTimeout(() => setMessage(''), 5000);
                          }
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-400 to-pink-500 text-white font-semibold rounded-xl hover:from-red-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Reset Competition
                    </button>
                  </div>
                </div>

                {/* Populate Demo Data */}
                <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎭</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Populate Demo Data</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Add sample participants and judges for testing
                    </p>
                    <button
                      onClick={populateDemoData}
                      className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Add Demo Data
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Heat Status */}
            {adminData?.competitionState?.activeHeat && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🎯</span>
                  Active Heat on Dance Floor
                </h3>
                <div className="bg-green-500/20 rounded-xl p-6 border border-green-400/30">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-300 mb-2">Heat {adminData.competitionState.activeHeat.number}</div>
                    <div className="text-green-200">
                      {adminData.competitionState.activeHeat.participants.length} participants currently dancing
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Heat Results */}
            {adminData?.heatResults && adminData.heatResults.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">📊</span>
                  Heat Results
                </h3>
                <div className="space-y-6">
                  {adminData.heatResults.map((heat: any) => (
                    <div key={heat.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">🔥</span>
                          Heat {heat.number}
                          {heat.isActive && (
                            <span className="ml-3 px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-sm border border-green-400/50">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                        <div className="flex space-x-2">
                          {!heat.isActive && (
                            <button
                              onClick={() => setActiveHeat(heat.id)}
                              className="px-4 py-2 bg-blue-500/50 text-blue-200 rounded-lg text-sm hover:bg-blue-500/70 transition-colors"
                            >
                              Activate Heat
                            </button>
                          )}
                          <div className="text-white/60 text-sm">
                            {heat.totalScores} scores submitted
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Leaders */}
                        <div>
                          <h5 className="text-lg font-semibold text-blue-300 mb-3">🕺 Leaders</h5>
                          <div className="space-y-2">
                            {heat.participants
                              .filter((p: any) => p.role === 'leader')
                              .map((participant: any, index: number) => (
                                <div key={participant.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center text-blue-300 font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className="text-white font-medium">{participant.name}</div>
                                      <div className="text-white/60 text-sm">#{participant.number}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-bold">{participant.averageScore}</div>
                                    <div className="text-white/60 text-xs">{participant.totalScores} scores</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Followers */}
                        <div>
                          <h5 className="text-lg font-semibold text-pink-300 mb-3">💃 Followers</h5>
                          <div className="space-y-2">
                            {heat.participants
                              .filter((p: any) => p.role === 'follower')
                              .map((participant: any, index: number) => (
                                <div key={participant.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-pink-500/30 rounded-full flex items-center justify-center text-pink-300 font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className="text-white font-medium">{participant.name}</div>
                                      <div className="text-white/60 text-sm">#{participant.number}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-bold">{participant.averageScore}</div>
                                    <div className="text-white/60 text-xs">{participant.totalScores} scores</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semifinalists */}
            {adminData?.competitionState?.semifinalists && adminData.competitionState.semifinalists.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🥈</span>
                  Semifinalists
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                      <span className="mr-2">🕺</span>
                      Leaders
                    </h4>
                    <div className="space-y-3">
                      {adminData.competitionState.semifinalists
                        .filter((p: any) => p.role === 'leader')
                        .map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-white">{participant.name}</div>
                                <div className="text-blue-300 text-sm">#{participant.number}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-pink-300 mb-4 flex items-center">
                      <span className="mr-2">💃</span>
                      Followers
                    </h4>
                    <div className="space-y-3">
                      {adminData.competitionState.semifinalists
                        .filter((p: any) => p.role === 'follower')
                        .map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-xl p-4 border border-pink-400/30">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-white">{participant.name}</div>
                                <div className="text-pink-300 text-sm">#{participant.number}</div>
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
            {adminData?.competitionState?.finalists && adminData.competitionState.finalists.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🏆</span>
                  Finalists
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                      <span className="mr-2">🕺</span>
                      Leaders
                    </h4>
                    <div className="space-y-3">
                      {adminData.competitionState.finalists
                        .filter((p: any) => p.role === 'leader')
                        .map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-xl p-4 border border-yellow-400/30">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-yellow-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-white">{participant.name}</div>
                                <div className="text-yellow-300 text-sm">#{participant.number}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-orange-300 mb-4 flex items-center">
                      <span className="mr-2">💃</span>
                      Followers
                    </h4>
                    <div className="space-y-3">
                      {adminData.competitionState.finalists
                        .filter((p: any) => p.role === 'follower')
                        .map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-xl p-4 border border-orange-400/30">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-orange-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-white">{participant.name}</div>
                                <div className="text-orange-300 text-sm">#{participant.number}</div>
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
            {adminData?.competitionState?.winners && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">👑</span>
                  Competition Winners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                      <span className="mr-2">🕺</span>
                      Leaders
                    </h4>
                    <div className="space-y-4">
                      {/* 1st Place */}
                      {adminData.competitionState.winners.leader?.first ? (
                        <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-4 border border-yellow-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥇
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.leader.first.name}</div>
                              <div className="text-yellow-300 text-sm">#{adminData.competitionState.winners.leader.first.number}</div>
                              <div className="text-yellow-200 text-xs">1st Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* 2nd Place */}
                      {adminData.competitionState.winners.leader?.second ? (
                        <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-4 border border-gray-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥈
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.leader.second.name}</div>
                              <div className="text-gray-300 text-sm">#{adminData.competitionState.winners.leader.second.number}</div>
                              <div className="text-gray-200 text-xs">2nd Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* 3rd Place */}
                      {adminData.competitionState.winners.leader?.third ? (
                        <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-4 border border-orange-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥉
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.leader.third.name}</div>
                              <div className="text-orange-300 text-sm">#{adminData.competitionState.winners.leader.third.number}</div>
                              <div className="text-orange-200 text-xs">3rd Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {!adminData.competitionState.winners.leader?.first && (
                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-center">
                          <div className="text-white/60">No winners determined yet</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-orange-300 mb-4 flex items-center">
                      <span className="mr-2">💃</span>
                      Followers
                    </h4>
                    <div className="space-y-4">
                      {/* 1st Place */}
                      {adminData.competitionState.winners.follower?.first ? (
                        <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-4 border border-yellow-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥇
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.follower.first.name}</div>
                              <div className="text-yellow-300 text-sm">#{adminData.competitionState.winners.follower.first.number}</div>
                              <div className="text-yellow-200 text-xs">1st Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* 2nd Place */}
                      {adminData.competitionState.winners.follower?.second ? (
                        <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-4 border border-gray-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥈
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.follower.second.name}</div>
                              <div className="text-gray-300 text-sm">#{adminData.competitionState.winners.follower.second.number}</div>
                              <div className="text-gray-200 text-xs">2nd Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* 3rd Place */}
                      {adminData.competitionState.winners.follower?.third ? (
                        <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-4 border border-orange-400/50">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-500/70 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              🥉
                            </div>
                            <div>
                              <div className="font-bold text-white text-lg">{adminData.competitionState.winners.follower.third.name}</div>
                              <div className="text-orange-300 text-sm">#{adminData.competitionState.winners.follower.third.number}</div>
                              <div className="text-orange-200 text-xs">3rd Place</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {!adminData.competitionState.winners.follower?.first && (
                        <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-center">
                          <div className="text-white/60">No winners determined yet</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Competition Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📊</span>
                Competition Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">{participants.filter(p => p.role === 'leader').length}</div>
                    <div className="text-white/60">Leaders</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-300">{participants.filter(p => p.role === 'follower').length}</div>
                    <div className="text-white/60">Followers</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-300">{judges.length}</div>
                    <div className="text-white/60">Judges</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-300">{adminData?.heatResults?.length || 0}</div>
                    <div className="text-white/60">Heats</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-8">
            {/* Results Display Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📺</span>
                Results Display Control
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Display Options</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowResultsDisplay(true)}
                      className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🎬 Start Results Slideshow
                    </button>
                    <button
                      onClick={() => setShowResultsDisplay(false)}
                      className="w-full px-6 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold rounded-xl hover:from-red-500 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      ⏹️ Stop Slideshow
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Display URL</h3>
                  <div className="bg-white/20 rounded-xl p-4 border border-white/30">
                    <p className="text-white/80 text-sm mb-2">Share this URL for the results display:</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/results-display`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/results-display`)}
                        className="px-4 py-2 bg-blue-500/30 text-blue-200 rounded-lg hover:bg-blue-500/40 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Results Preview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">👀</span>
                Current Results Preview
              </h3>
              
              {/* Competition Phase */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-yellow-300 mb-4">Competition Phase</h4>
                <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-xl p-6 border border-blue-400/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {adminData?.competition?.phase?.toUpperCase() || 'NOT STARTED'}
                      </div>
                      <div className="text-blue-200 text-sm mt-1">
                        Current competition phase
                      </div>
                    </div>
                    <div className="text-4xl">
                      {adminData?.competition?.phase === 'heats' && '🔥'}
                      {adminData?.competition?.phase === 'semifinal' && '⚡'}
                      {adminData?.competition?.phase === 'final' && '🏆'}
                      {adminData?.competition?.phase === 'winners' && '👑'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Heat Results */}
              {adminData?.heatResults && adminData.heatResults.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-green-300 mb-4">Heat Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminData.heatResults.map((heat: any, index: number) => (
                      <div key={index} className="bg-white/10 rounded-xl p-4 border border-white/20">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white mb-2">Heat {index + 1}</div>
                          <div className="text-sm text-white/60">
                            {heat.participants?.length || 0} participants
                          </div>
                          {heat.averageScore && (
                            <div className="text-yellow-300 font-bold mt-2">
                              Avg: {heat.averageScore.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Semifinalists */}
              {adminData?.competitionState?.semifinalists && adminData.competitionState.semifinalists.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-purple-300 mb-4">Semifinalists</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-md font-bold text-blue-300 mb-3">Leaders</h5>
                      <div className="space-y-2">
                        {adminData.competitionState.semifinalists
                          .filter((p: any) => p.role === 'leader')
                          .map((participant: any, index: number) => (
                            <div key={participant.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-blue-300 text-sm">#{participant.number}</div>
                                </div>
                                <div className="text-yellow-300 font-bold">
                                  {participant.averageScore?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-md font-bold text-pink-300 mb-3">Followers</h5>
                      <div className="space-y-2">
                        {adminData.competitionState.semifinalists
                          .filter((p: any) => p.role === 'follower')
                          .map((participant: any, index: number) => (
                            <div key={participant.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-pink-300 text-sm">#{participant.number}</div>
                                </div>
                                <div className="text-yellow-300 font-bold">
                                  {participant.averageScore?.toFixed(2) || 'N/A'}
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
              {adminData?.competitionState?.finalists && adminData.competitionState.finalists.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-orange-300 mb-4">Finalists</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-md font-bold text-blue-300 mb-3">Leaders</h5>
                      <div className="space-y-2">
                        {adminData.competitionState.finalists
                          .filter((p: any) => p.role === 'leader')
                          .map((participant: any, index: number) => (
                            <div key={participant.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-blue-300 text-sm">#{participant.number}</div>
                                </div>
                                <div className="text-yellow-300 font-bold">
                                  {participant.averageScore?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-md font-bold text-pink-300 mb-3">Followers</h5>
                      <div className="space-y-2">
                        {adminData.competitionState.finalists
                          .filter((p: any) => p.role === 'follower')
                          .map((participant: any, index: number) => (
                            <div key={participant.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-pink-300 text-sm">#{participant.number}</div>
                                </div>
                                <div className="text-yellow-300 font-bold">
                                  {participant.averageScore?.toFixed(2) || 'N/A'}
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
              {adminData?.competitionState?.winners && (
                <div>
                  <h4 className="text-lg font-bold text-yellow-300 mb-4">Winners</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-md font-bold text-blue-300 mb-3">Leaders</h5>
                      <div className="space-y-3">
                        {adminData.competitionState.winners.leader?.first && (
                          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-4 border border-yellow-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥇</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.leader.first.name}</div>
                                <div className="text-yellow-300 text-sm">#{adminData.competitionState.winners.leader.first.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {adminData.competitionState.winners.leader?.second && (
                          <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-4 border border-gray-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥈</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.leader.second.name}</div>
                                <div className="text-gray-300 text-sm">#{adminData.competitionState.winners.leader.second.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {adminData.competitionState.winners.leader?.third && (
                          <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-4 border border-orange-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥉</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.leader.third.name}</div>
                                <div className="text-orange-300 text-sm">#{adminData.competitionState.winners.leader.third.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-md font-bold text-pink-300 mb-3">Followers</h5>
                      <div className="space-y-3">
                        {adminData.competitionState.winners.follower?.first && (
                          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-xl p-4 border border-yellow-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥇</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.follower.first.name}</div>
                                <div className="text-yellow-300 text-sm">#{adminData.competitionState.winners.follower.first.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {adminData.competitionState.winners.follower?.second && (
                          <div className="bg-gradient-to-r from-gray-500/30 to-gray-600/30 rounded-xl p-4 border border-gray-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥈</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.follower.second.name}</div>
                                <div className="text-gray-300 text-sm">#{adminData.competitionState.winners.follower.second.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {adminData.competitionState.winners.follower?.third && (
                          <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-xl p-4 border border-orange-400/50">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🥉</div>
                              <div>
                                <div className="font-bold text-white">{adminData.competitionState.winners.follower.third.name}</div>
                                <div className="text-orange-300 text-sm">#{adminData.competitionState.winners.follower.third.number}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Display Modal */}
      {showResultsDisplay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Results Display</h2>
              <button
                onClick={() => setShowResultsDisplay(false)}
                className="text-white/60 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="bg-black/50 rounded-xl p-6 border border-white/20">
              <div className="text-center text-white/80 mb-4">
                <p className="text-lg">Results display is now active!</p>
                <p className="text-sm">Share the display URL with your audience.</p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.open('/results-display', '_blank')}
                  className="px-6 py-3 bg-blue-500/30 text-blue-200 rounded-xl hover:bg-blue-500/40 transition-colors"
                >
                  Open Display
                </button>
                <button
                  onClick={() => setShowResultsDisplay(false)}
                  className="px-6 py-3 bg-red-500/30 text-red-200 rounded-xl hover:bg-red-500/40 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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