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
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'judges' | 'competition' | 'scoring-table' | 'results'>('overview');
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
  const [competitionCategory, setCompetitionCategory] = useState<'AMATEUR' | 'PRO'>('AMATEUR');
  const [judgeCategory, setJudgeCategory] = useState<'AMATEUR' | 'PRO'>('AMATEUR');
  const [competitionTab, setCompetitionTab] = useState<'setup' | 'progression' | 'management'>('setup');

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
        body: JSON.stringify({ action: 'generate_heats', category: competitionCategory })
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotificationType('success');
        setNotificationTitle('🔥 Heats Generated!');
        setNotificationMessage(`Successfully generated ${data.heats} heat(s) for ${data.totalCouples} couples with random participant distribution. The competition is now ready to begin!`);
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
        setNotificationType('success');
        setNotificationTitle('🧪 Demo Data Added!');
        setNotificationMessage('Demo setup complete. Sample participants, judges, and heats have been added.');
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${data.error || 'Failed to populate demo data'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage('Error: Failed to populate demo data');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const saveJudgeCategory = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_judge_category', category: judgeCategory })
      });
      const data = await response.json();
      
      if (response.ok) {
        // Save to localStorage for fallback
        localStorage.setItem('judgeCategory', judgeCategory);
        
        setNotificationType('success');
        setNotificationTitle('✅ Judge Category Updated!');
        setNotificationMessage(`Judges will now see the ${judgeCategory} competition heats.`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        fetchAdminData(); // Refresh data to show updated category
      } else {
        setNotificationType('error');
        setNotificationTitle('❌ Error');
        setNotificationMessage(`Failed to update judge category: ${data.error}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      setNotificationType('error');
      setNotificationTitle('❌ Error');
      setNotificationMessage('Failed to update judge category. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const exportToExcel = async () => {
    if (!adminData?.detailedScoringBreakdown) {
      setNotificationType('error');
      setNotificationTitle('❌ No Data Available');
      setNotificationMessage('No scoring data available to export.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    try {
      // Dynamically import xlsx to avoid SSR issues
      const XLSX = await import('xlsx');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Helper function to create worksheet data
      const createWorksheetData = (phaseData: any[], phaseName: string) => {
        const data = [];
        
        // Add header row
        const headerRow = ['Role', 'Participant', 'Number'];
        judges.forEach(judge => {
          headerRow.push(`${judge.name} (${judge.role})`);
        });
        headerRow.push('Total Score', 'Number of Scores');
        data.push(headerRow);
        
        // Add data rows
        phaseData.forEach((participant: any) => {
          const row = [
            participant.role === 'leader' ? 'Leader' : 'Follower',
            participant.name,
            participant.number
          ];
          
          // Add judge scores
          judges.forEach(judge => {
            const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
            row.push(judgeScore ? judgeScore.score : '');
          });
          
          // Add totals
          const totalScore = participant.scores.reduce((sum: number, s: any) => sum + s.score, 0);
          row.push(totalScore, participant.scores.length);
          
          data.push(row);
        });
        
        return data;
      };
      
      // Create Heats worksheets
      if (adminData.detailedScoringBreakdown.heats) {
        adminData.detailedScoringBreakdown.heats.forEach((heat: any) => {
          const heatData = createWorksheetData(heat.participants, `Heat ${heat.heatNumber}`);
          const worksheet = XLSX.utils.aoa_to_sheet(heatData);
          
          // Set column widths
          const colWidths = [
            { wch: 10 }, // Role
            { wch: 20 }, // Participant
            { wch: 8 },  // Number
          ];
          judges.forEach(() => colWidths.push({ wch: 12 })); // Judge columns
          colWidths.push({ wch: 12 }, { wch: 15 }); // Total Score, Number of Scores
          worksheet['!cols'] = colWidths;
          
          XLSX.utils.book_append_sheet(workbook, worksheet, `Heat ${heat.heatNumber}`);
        });
      }
      
      // Create Semifinal worksheet
      if (adminData.detailedScoringBreakdown.semifinal) {
        const semifinalData = createWorksheetData(adminData.detailedScoringBreakdown.semifinal, 'Semifinal');
        const semifinalWorksheet = XLSX.utils.aoa_to_sheet(semifinalData);
        
        // Set column widths
        const colWidths = [
          { wch: 10 }, // Role
          { wch: 20 }, // Participant
          { wch: 8 },  // Number
        ];
        judges.forEach(() => colWidths.push({ wch: 12 })); // Judge columns
        colWidths.push({ wch: 12 }, { wch: 15 }); // Total Score, Number of Scores
        semifinalWorksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, semifinalWorksheet, 'Semifinal');
      }
      
      // Create Final worksheet
      if (adminData.detailedScoringBreakdown.final) {
        const finalData = createWorksheetData(adminData.detailedScoringBreakdown.final, 'Final');
        const finalWorksheet = XLSX.utils.aoa_to_sheet(finalData);
        
        // Set column widths
        const colWidths = [
          { wch: 10 }, // Role
          { wch: 20 }, // Participant
          { wch: 8 },  // Number
        ];
        judges.forEach(() => colWidths.push({ wch: 12 })); // Judge columns
        colWidths.push({ wch: 12 }, { wch: 15 }); // Total Score, Number of Scores
        finalWorksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, finalWorksheet, 'Final');
      }
      
      // Create Summary worksheet
      const summaryData = [];
      summaryData.push(['Dance Competition Scoring Summary']);
      summaryData.push(['']);
      summaryData.push(['Generated:', new Date().toLocaleString()]);
      summaryData.push(['']);
      summaryData.push(['Phase', 'Role', 'Participant Count', 'Total Scores']);
      
      let totalParticipants = 0;
      let totalScores = 0;
      
      if (adminData.detailedScoringBreakdown.heats) {
        adminData.detailedScoringBreakdown.heats.forEach((heat: any) => {
          const leaders = heat.participants.filter((p: any) => p.role === 'leader');
          const followers = heat.participants.filter((p: any) => p.role === 'follower');
          
          summaryData.push([`Heat ${heat.heatNumber}`, 'Leaders', leaders.length, leaders.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
          summaryData.push([`Heat ${heat.heatNumber}`, 'Followers', followers.length, followers.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
          
          totalParticipants += leaders.length + followers.length;
          totalScores += leaders.reduce((sum: number, p: any) => sum + p.scores.length, 0) + 
                        followers.reduce((sum: number, p: any) => sum + p.scores.length, 0);
        });
      }
      
      if (adminData.detailedScoringBreakdown.semifinal) {
        const semifinalLeaders = adminData.detailedScoringBreakdown.semifinal.filter((p: any) => p.role === 'leader');
        const semifinalFollowers = adminData.detailedScoringBreakdown.semifinal.filter((p: any) => p.role === 'follower');
        
        summaryData.push(['Semifinal', 'Leaders', semifinalLeaders.length, semifinalLeaders.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
        summaryData.push(['Semifinal', 'Followers', semifinalFollowers.length, semifinalFollowers.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
        
        totalParticipants += semifinalLeaders.length + semifinalFollowers.length;
        totalScores += semifinalLeaders.reduce((sum: number, p: any) => sum + p.scores.length, 0) + 
                      semifinalFollowers.reduce((sum: number, p: any) => sum + p.scores.length, 0);
      }
      
      if (adminData.detailedScoringBreakdown.final) {
        const finalLeaders = adminData.detailedScoringBreakdown.final.filter((p: any) => p.role === 'leader');
        const finalFollowers = adminData.detailedScoringBreakdown.final.filter((p: any) => p.role === 'follower');
        
        summaryData.push(['Final', 'Leaders', finalLeaders.length, finalLeaders.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
        summaryData.push(['Final', 'Followers', finalFollowers.length, finalFollowers.reduce((sum: number, p: any) => sum + p.scores.length, 0)]);
        
        totalParticipants += finalLeaders.length + finalFollowers.length;
        totalScores += finalLeaders.reduce((sum: number, p: any) => sum + p.scores.length, 0) + 
                      finalFollowers.reduce((sum: number, p: any) => sum + p.scores.length, 0);
      }
      
      summaryData.push(['']);
      summaryData.push(['TOTAL', '', totalParticipants, totalScores]);
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [
        { wch: 15 }, // Phase
        { wch: 12 }, // Role
        { wch: 15 }, // Participant Count
        { wch: 15 }  // Total Scores
      ];
      
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
      
      // Generate and download file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dance-competition-scores-${timestamp}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success notification
      setNotificationType('success');
      setNotificationTitle('✅ Export Successful!');
      setNotificationMessage('Scoring data has been exported to Excel file.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);

    } catch (error) {
      console.error('Export error:', error);
      setNotificationType('error');
      setNotificationTitle('❌ Export Failed');
      setNotificationMessage('Failed to export data. Please try again.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
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
              onClick={() => setActiveTab('scoring-table')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'scoring-table' 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              📊 Scoring Table
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Competition Phase */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Competition Phase</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {adminData?.competitionState?.currentPhase ? adminData.competitionState.currentPhase.charAt(0).toUpperCase() + adminData.competitionState.currentPhase.slice(1) : 'Setup'}
                    </p>
                  </div>
                  <div className="text-3xl">
                    {adminData?.competitionState?.currentPhase === 'heats' && '🔥'}
                    {adminData?.competitionState?.currentPhase === 'semifinal' && '⚡'}
                    {adminData?.competitionState?.currentPhase === 'final' && '🏆'}
                    {!adminData?.competitionState?.currentPhase && '⚙️'}
                  </div>
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
                  <span className="text-lg">👥</span>
                  <span>{participants.length} participants registered</span>
                </div>
                <div className="flex items-center space-x-3 text-white/80">
                  <span className="text-lg">⚖️</span>
                  <span>{judges.length} judges active</span>
                </div>
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
            {/* Competition Management with Tabs */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <span className="mr-4 text-4xl">🎯</span>
                Competition Control Center
              </h2>
              
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => setCompetitionTab('setup')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    competitionTab === 'setup'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  🎬 Setup
                </button>
                <button
                  onClick={() => setCompetitionTab('progression')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    competitionTab === 'progression'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  ⚡ Progression
                </button>
                <button
                  onClick={() => setCompetitionTab('management')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    competitionTab === 'management'
                      ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  ⚙️ Management
                </button>
              </div>

              {/* Tab Content */}
              {competitionTab === 'setup' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generate Heats */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                        <div className="text-5xl mb-4 animate-pulse">🔥</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Generate Competition Heats</h4>
                        <div className="bg-black/20 rounded-lg p-4 mb-4">
                          <p className="text-blue-200 text-sm font-medium mb-2">Smart Heat Distribution:</p>
                          <ul className="text-blue-100 text-xs space-y-1">
                            <li>• ≤14 couples → 1 heat</li>
                            <li>• 15-18 couples → 2 heats</li>
                            <li>• &gt;18 couples → 3 heats</li>
                          </ul>
                        </div>
                        
                        {/* Category Selection */}
                        <div className="mb-4">
                          <label htmlFor="competition-category" className="block text-sm font-semibold text-white mb-2 flex items-center justify-center gap-2">
                            <span className="text-lg">🏆</span>
                            Competition Category
                          </label>
                          <select
                            id="competition-category"
                            value={competitionCategory}
                            onChange={e => setCompetitionCategory(e.target.value as 'AMATEUR' | 'PRO')}
                            className="w-full rounded-lg bg-gray-800/80 text-white border-2 border-blue-400/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 px-4 py-3 shadow-lg transition-all duration-200 outline-none text-center font-medium"
                          >
                            <option value="AMATEUR">🥉 Amateur Division</option>
                            <option value="PRO">🥇 Pro Division</option>
                          </select>
                        </div>
                        
                    <button
                      onClick={generateHeats}
                          className="w-full px-6 py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-orange-300/30"
                    >
                          🚀 Launch Competition
                    </button>
                  </div>
                </div>

                    {/* Demo Data */}
                    <div className="bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-xl p-6 border border-green-400/30 hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105">
                      <div className="text-center">
                        <div className="text-5xl mb-4 animate-bounce">🎭</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Quick Setup</h4>
                        <p className="text-green-200 text-sm mb-4">
                          Add sample participants and judges for testing and demonstration
                        </p>
                        <button
                          onClick={populateDemoData}
                          className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-teal-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-green-300/30"
                        >
                          ⚡ Quick Demo Setup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {competitionTab === 'progression' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Advance to Semifinal */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-xl p-6 border border-purple-400/30 hover:bg-purple-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                        <div className="text-5xl mb-4 animate-pulse">🥈</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Semifinal Round</h4>
                        <p className="text-purple-200 text-sm mb-4">
                          Advance top performers to semifinal competition
                        </p>
                        <div className="bg-black/20 rounded-lg p-3 mb-4">
                          <p className="text-purple-200 text-xs">Top 8 Leaders + 8 Followers</p>
                        </div>
                    <button
                      onClick={advanceToSemifinal}
                          className="w-full px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-purple-300/30"
                    >
                          🚀 Advance to Semifinal
                    </button>
                  </div>
                </div>

                {/* Advance to Final */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl p-6 border border-yellow-400/30 hover:bg-yellow-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                        <div className="text-5xl mb-4 animate-pulse">🏆</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Final Round</h4>
                        <p className="text-yellow-200 text-sm mb-4">
                          Move semifinal winners to the grand finale
                        </p>
                        <div className="bg-black/20 rounded-lg p-3 mb-4">
                          <p className="text-yellow-200 text-xs">Top 5 Leaders + 5 Followers</p>
                        </div>
                    <button
                      onClick={advanceToFinal}
                          className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-yellow-300/30"
                    >
                          👑 Advance to Final
                    </button>
                  </div>
                </div>

                {/* Determine Winners */}
                    <div className="bg-gradient-to-br from-pink-500/20 to-red-600/20 rounded-xl p-6 border border-pink-400/30 hover:bg-pink-500/30 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                        <div className="text-5xl mb-4 animate-pulse">👑</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Crown Winners</h4>
                        <p className="text-pink-200 text-sm mb-4">
                          Calculate and announce the competition champions
                        </p>
                        <div className="bg-black/20 rounded-lg p-3 mb-4">
                          <p className="text-pink-200 text-xs">1st, 2nd, 3rd Place</p>
                        </div>
                    <button
                      onClick={determineWinners}
                          className="w-full px-6 py-3 bg-gradient-to-r from-pink-400 to-red-500 text-white font-bold rounded-xl hover:from-pink-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-pink-300/30"
                        >
                          🏅 Determine Winners
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {competitionTab === 'management' && (
                <div className="space-y-6">
                  {/* Judge Scoring Status */}
                  {adminData?.judgeScoringStatus && (
                    <div className="bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-xl p-6 border border-green-400/30">
                      <div className="text-center mb-6">
                        <div className="text-4xl mb-2">📊</div>
                        <h4 className="text-xl font-semibold text-white mb-2">Judge Scoring Status</h4>
                        <p className="text-green-200 text-sm">
                          Heat {adminData.judgeScoringStatus.heatNumber} - {adminData.judgeScoringStatus.totalScores}/{adminData.judgeScoringStatus.expectedScores} scores submitted
                        </p>
                        <div className="mt-3">
                          <div className="inline-flex items-center px-4 py-2 bg-green-500/30 rounded-full text-green-200 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            {adminData.judgeScoringStatus.scoredJudges.length} judges completed
                          </div>
                          {adminData.judgeScoringStatus.pendingJudges.length > 0 && (
                            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/30 rounded-full text-yellow-200 text-sm font-medium ml-3">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                              {adminData.judgeScoringStatus.pendingJudges.length} judges pending
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Judges who have scored */}
                        <div>
                          <h5 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                            <span className="mr-2">✅</span>
                            Completed Scoring
                          </h5>
                          <div className="space-y-2">
                            {adminData.judgeScoringStatus.scoredJudges.length > 0 ? (
                              adminData.judgeScoringStatus.scoredJudges.map((judge: any) => (
                                <div key={judge.id} className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-white">{judge.name}</div>
                                      <div className="text-green-300 text-sm capitalize">{judge.role}</div>
                                    </div>
                                    <div className="text-green-400 text-lg">✓</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-white/10 rounded-lg p-3 border border-white/20 text-center">
                                <div className="text-white/60 text-sm">No judges have scored yet</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Judges who haven't scored */}
                        <div>
                          <h5 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
                            <span className="mr-2">⏳</span>
                            Pending Scoring
                          </h5>
                          <div className="space-y-2">
                            {adminData.judgeScoringStatus.pendingJudges.length > 0 ? (
                              adminData.judgeScoringStatus.pendingJudges.map((judge: any) => (
                                <div key={judge.id} className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-white">{judge.name}</div>
                                      <div className="text-yellow-300 text-sm capitalize">{judge.role}</div>
                                    </div>
                                    <div className="text-yellow-400 text-lg">⏳</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30 text-center">
                                <div className="text-green-300 text-sm font-semibold">All judges have scored! 🎉</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Judge Category Configuration */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-400/30">
                      <div className="text-center">
                        <div className="text-4xl mb-4">⚖️</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Judge Category Setting</h4>
                        <p className="text-blue-200 text-sm mb-6">
                          Choose which competition category judges will see in their dashboard
                        </p>
                        
                        <div className="mb-6 flex flex-col items-center justify-center">
                          <label htmlFor="judge-category-setting" className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <span className="inline-block text-lg">🏆</span>
                            Judge Competition Category
                          </label>
                          <select
                            id="judge-category-setting"
                            value={judgeCategory}
                            onChange={e => setJudgeCategory(e.target.value as 'AMATEUR' | 'PRO')}
                            className="mt-1 block w-56 rounded-lg bg-gray-800 text-white border border-blue-400 focus:border-blue-500 focus:ring-blue-500 px-4 py-2 shadow-sm transition-all duration-200 outline-none appearance-none text-center"
                          >
                            <option value="AMATEUR">🥉 Amateur Division</option>
                            <option value="PRO">🥇 Pro Division</option>
                          </select>
                          <p className="text-xs text-blue-200 mt-1 text-center">
                            Judges will see heats from the {judgeCategory.toLowerCase()} competition
                          </p>
                        </div>
                        
                        <button
                          onClick={saveJudgeCategory}
                          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          💾 Save Judge Category
                        </button>
                      </div>
                    </div>

                    {/* Reset Competition */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-600/10 rounded-xl p-6 border border-red-400/30">
                      <div className="text-center">
                        <div className="text-4xl mb-4">🔄</div>
                        <h4 className="text-lg font-semibold text-white mb-3">Reset Competition</h4>
                        <p className="text-red-200 text-sm mb-4">
                          Clear all competition data and start fresh for a new event
                        </p>
                        <div className="bg-black/20 rounded-lg p-4 mb-4">
                          <p className="text-red-200 text-xs font-medium">⚠️ This action will:</p>
                          <ul className="text-red-100 text-xs space-y-1 mt-2">
                            <li>• Clear all heats and scores</li>
                            <li>• Reset competition phases</li>
                            <li>• Remove all competition data</li>
                          </ul>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm('⚠️ Are you sure you want to reset the competition?\n\nThis will permanently clear all heats, scores, and competition data.')) {
                              try {
                                const response = await fetch('/api/admin', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'reset_competition' })
                                });
                                const data = await response.json();
                                
                                if (response.ok) {
                                  setMessage('✅ Competition reset successfully! Refreshing data...');
                                  setNotificationType('success');
                                  setNotificationTitle('🔄 Competition Reset!');
                                  setNotificationMessage('Competition has been reset. All data cleared and ready for a new event.');
                                  loadData();
                                  setTimeout(() => setMessage(''), 3000);
                                } else {
                                  setMessage(`❌ Error: ${data.error}`);
                                  setTimeout(() => setMessage(''), 5000);
                                }
                              } catch (error) {
                                setMessage('❌ Error: Failed to reset competition');
                                setTimeout(() => setMessage(''), 5000);
                              }
                            }
                          }}
                          className="px-8 py-4 bg-gradient-to-r from-red-400 to-orange-500 text-white font-bold rounded-xl hover:from-red-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-red-300/30"
                        >
                          🔄 Reset Competition
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Current Phase Sections - Show after active heat for logical flow */}
            
            {/* Semifinalists - Show after active heat */}
            {adminData?.competitionState?.semifinalists && adminData.competitionState.semifinalists.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🥈</span>
                  Current Phase: Semifinalists
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-blue-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore || 0}
                                </div>
                                <div className="text-blue-300 text-xs">
                                  {participant.totalScores || 0} scores
                                </div>
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-pink-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore || 0}
                                </div>
                                <div className="text-pink-300 text-xs">
                                  {participant.totalScores || 0} scores
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finalists - Show after semifinalists */}
            {adminData?.competitionState?.finalists && adminData.competitionState.finalists.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🏆</span>
                  Current Phase: Finalists
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-yellow-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-yellow-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore || 0}
                                </div>
                                <div className="text-yellow-300 text-xs">
                                  {participant.totalScores || 0} scores
                                </div>
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-orange-500/50 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-orange-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore || 0}
                                </div>
                                <div className="text-orange-300 text-xs">
                                  {participant.totalScores || 0} scores
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Winners - Show after finalists */}
            {adminData?.competitionState?.winners && 
             (adminData.competitionState.winners.leader?.first || adminData.competitionState.winners.follower?.first) && (
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


            {/* Heat Results */}
            {adminData?.heatResults && adminData.heatResults.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-green-300 mb-4">Individual Heat Results</h4>
                <div className="space-y-6">
                  {adminData.heatResults.map((heat: any, index: number) => (
                    <div key={index} className="bg-white/10 rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xl font-bold text-white">Heat {heat.number}</h5>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-white/60">
                            {heat.totalScores || 0} scores submitted
                          </div>
                          {heat.isActive ? (
                            <div className="inline-flex items-center px-3 py-1 bg-green-500/30 rounded-full text-green-200 text-sm font-medium">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                              Active
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveHeat(heat.id)}
                              className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              🎯 Activate Heat
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Leaders */}
                        <div>
                          <h6 className="text-md font-semibold text-blue-300 mb-3">🕺 Leaders</h6>
                          <div className="space-y-2">
                            {heat.participants
                              .filter((p: any) => p.role === 'leader')
                              .map((participant: any, participantIndex: number) => (
                                <div key={participant.id} className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {participantIndex + 1}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-white">{participant.name}</div>
                                        <div className="text-blue-300 text-sm">#{participant.number}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold text-lg">
                                        {participant.totalScore}
                                      </div>
                                      <div className="text-blue-300 text-xs">
                                        {participant.totalScores} scores
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Followers */}
                        <div>
                          <h6 className="text-md font-semibold text-pink-300 mb-3">💃 Followers</h6>
                          <div className="space-y-2">
                            {heat.participants
                              .filter((p: any) => p.role === 'follower')
                              .map((participant: any, participantIndex: number) => (
                                <div key={participant.id} className="bg-pink-500/10 rounded-lg p-3 border border-pink-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {participantIndex + 1}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-white">{participant.name}</div>
                                        <div className="text-pink-300 text-sm">#{participant.number}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold text-lg">
                                        {participant.totalScore}
                                      </div>
                                      <div className="text-pink-300 text-xs">
                                        {participant.totalScores} scores
                                      </div>
                                    </div>
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

            {/* Judge Scoring Details - Individual Judge Scores */}
            {adminData?.detailedScoringBreakdown && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-purple-300 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Judge Scoring Details - Individual Scores
                </h4>
                <p className="text-purple-200 text-sm mb-4">
                  See exactly what score each judge gave to each participant
                </p>
                
                {/* Heat Scores */}
                {adminData.detailedScoringBreakdown.heats && adminData.detailedScoringBreakdown.heats.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-md font-bold text-green-300 mb-3">🔥 Heat Scores</h5>
                    <div className="space-y-4">
                      {adminData.detailedScoringBreakdown.heats.map((heat: any) => (
                        <div key={heat.heatId} className="bg-white/10 rounded-xl p-4 border border-white/20">
                          <h6 className="text-lg font-semibold text-white mb-3">Heat {heat.heatNumber}</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Leaders */}
                            <div>
                              <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                              <div className="space-y-2">
                                {heat.participants
                                  .filter((p: any) => p.role === 'leader')
                                  .map((participant: any) => (
                                    <div key={participant.id} className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-semibold text-white">{participant.name}</div>
                                          <div className="text-blue-300 text-sm">#{participant.number}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-yellow-300 font-bold">
                                            {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                          </div>
                                          <div className="text-blue-300 text-xs">{participant.scores.length} scores</div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        {participant.scores.map((score: any, index: number) => (
                                          <div key={index} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-2">
                                              <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                              <span className="text-white/80">{score.judgeName}</span>
                                            </div>
                                            <span className="text-yellow-300 font-semibold">{score.score}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            
                            {/* Followers */}
                            <div>
                              <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                              <div className="space-y-2">
                                {heat.participants
                                  .filter((p: any) => p.role === 'follower')
                                  .map((participant: any) => (
                                    <div key={participant.id} className="bg-pink-500/10 rounded-lg p-3 border border-pink-400/30">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-semibold text-white">{participant.name}</div>
                                          <div className="text-pink-300 text-sm">#{participant.number}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-yellow-300 font-bold">
                                            {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                          </div>
                                          <div className="text-pink-300 text-xs">{participant.scores.length} scores</div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        {participant.scores.map((score: any, index: number) => (
                                          <div key={index} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-2">
                                              <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                              <span className="text-white/80">{score.judgeName}</span>
                                            </div>
                                            <span className="text-yellow-300 font-semibold">{score.score}</span>
                                          </div>
                                        ))}
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

                {/* Semifinal Scores */}
                {adminData.detailedScoringBreakdown.semifinal && adminData.detailedScoringBreakdown.semifinal.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-md font-bold text-purple-300 mb-3">🥈 Semifinal Scores</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Leaders */}
                      <div>
                        <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                        <div className="space-y-2">
                          {adminData.detailedScoringBreakdown.semifinal
                            .filter((p: any) => p.role === 'leader')
                            .map((participant: any) => (
                              <div key={participant.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-white">{participant.name}</div>
                                    <div className="text-blue-300 text-sm">#{participant.number}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-300 font-bold">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </div>
                                    <div className="text-purple-300 text-xs">{participant.scores.length} scores</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {participant.scores.map((score: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        <span className="text-white/80">{score.judgeName}</span>
                                      </div>
                                      <span className="text-yellow-300 font-semibold">{score.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Followers */}
                      <div>
                        <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                        <div className="space-y-2">
                          {adminData.detailedScoringBreakdown.semifinal
                            .filter((p: any) => p.role === 'follower')
                            .map((participant: any) => (
                              <div key={participant.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-white">{participant.name}</div>
                                    <div className="text-pink-300 text-sm">#{participant.number}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-300 font-bold">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </div>
                                    <div className="text-purple-300 text-xs">{participant.scores.length} scores</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {participant.scores.map((score: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        <span className="text-white/80">{score.judgeName}</span>
                                      </div>
                                      <span className="text-yellow-300 font-semibold">{score.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Scores */}
                {adminData.detailedScoringBreakdown.final && adminData.detailedScoringBreakdown.final.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-md font-bold text-orange-300 mb-3">🏆 Final Scores</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Leaders */}
                      <div>
                        <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                        <div className="space-y-2">
                          {adminData.detailedScoringBreakdown.final
                            .filter((p: any) => p.role === 'leader')
                            .map((participant: any) => (
                              <div key={participant.id} className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-white">{participant.name}</div>
                                    <div className="text-blue-300 text-sm">#{participant.number}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-300 font-bold">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </div>
                                    <div className="text-orange-300 text-xs">{participant.scores.length} scores</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {participant.scores.map((score: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        <span className="text-white/80">{score.judgeName}</span>
                                      </div>
                                      <span className="text-yellow-300 font-semibold">{score.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Followers */}
                      <div>
                        <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                        <div className="space-y-2">
                          {adminData.detailedScoringBreakdown.final
                            .filter((p: any) => p.role === 'follower')
                            .map((participant: any) => (
                              <div key={participant.id} className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-white">{participant.name}</div>
                                    <div className="text-pink-300 text-sm">#{participant.number}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-300 font-bold">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </div>
                                    <div className="text-orange-300 text-xs">{participant.scores.length} scores</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {participant.scores.map((score: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                        <span className="text-white/80">{score.judgeName}</span>
                                      </div>
                                      <span className="text-yellow-300 font-semibold">{score.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

        {activeTab === 'scoring-table' && (
          <div className="space-y-8">
            {/* Scoring Table Header */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <span className="mr-4 text-4xl">📊</span>
                Scoring Table - All Judges & Participants
              </h2>
              <p className="text-white/80 text-lg mb-6">
                View all scores in a table format with participants as rows and judges as columns
              </p>
              
              {/* Export to Excel Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => exportToExcel()}
                  className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl border border-green-300/30 flex items-center space-x-3"
                >
                  <span className="text-2xl">📊</span>
                  <span>Export to Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Heat Scoring Tables */}
            {adminData?.detailedScoringBreakdown?.heats && adminData.detailedScoringBreakdown.heats.length > 0 && (
              <div className="space-y-8">
                {adminData.detailedScoringBreakdown.heats.map((heat: any) => (
                  <div key={heat.heatId} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <span className="mr-3">🔥</span>
                      Heat {heat.heatNumber} - Scoring Table
                    </h3>
                    
                    {/* Leaders Table */}
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                        <span className="mr-2">🕺</span>
                        Leaders
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white/5 rounded-xl border border-white/20">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                              <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                              {judges.map((judge) => (
                                <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm">{judge.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                      {judge.role}
                                    </span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                              <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heat.participants
                              .filter((p: any) => p.role === 'leader')
                              .map((participant: any) => (
                                <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                                  <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                                  <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                                  {judges.map((judge) => {
                                    const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                    return (
                                      <td key={judge.id} className="px-4 py-3 text-center">
                                        {judgeScore ? (
                                          <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                        ) : (
                                          <span className="text-white/40">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-300 font-bold text-lg">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-white/60 text-sm">{participant.scores.length}</span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Followers Table */}
                    <div>
                      <h4 className="text-xl font-bold text-pink-300 mb-4 flex items-center">
                        <span className="mr-2">💃</span>
                        Followers
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white/5 rounded-xl border border-white/20">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                              <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                              {judges.map((judge) => (
                                <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm">{judge.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                      {judge.role}
                                    </span>
                                  </div>
                                </th>
                              ))}
                              <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                              <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heat.participants
                              .filter((p: any) => p.role === 'follower')
                              .map((participant: any) => (
                                <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                                  <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                                  <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                                  {judges.map((judge) => {
                                    const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                    return (
                                      <td key={judge.id} className="px-4 py-3 text-center">
                                        {judgeScore ? (
                                          <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                        ) : (
                                          <span className="text-white/40">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-300 font-bold text-lg">
                                      {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-white/60 text-sm">{participant.scores.length}</span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Semifinal Scoring Table */}
            {adminData?.detailedScoringBreakdown?.semifinal && adminData.detailedScoringBreakdown.semifinal.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🥈</span>
                  Semifinal - Scoring Table
                </h3>
                
                {/* Leaders Table */}
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                    <span className="mr-2">🕺</span>
                    Leaders
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white/5 rounded-xl border border-white/20">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                          {judges.map((judge) => (
                            <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{judge.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                  {judge.role}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.detailedScoringBreakdown.semifinal
                          .filter((p: any) => p.role === 'leader')
                          .map((participant: any) => (
                            <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                              <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                              {judges.map((judge) => {
                                const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                return (
                                  <td key={judge.id} className="px-4 py-3 text-center">
                                    {judgeScore ? (
                                      <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                    ) : (
                                      <span className="text-white/40">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-center">
                                <span className="text-yellow-300 font-bold text-lg">
                                  {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-white/60 text-sm">{participant.scores.length}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Followers Table */}
                <div>
                  <h4 className="text-xl font-bold text-pink-300 mb-4 flex items-center">
                    <span className="mr-2">💃</span>
                    Followers
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white/5 rounded-xl border border-white/20">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                          {judges.map((judge) => (
                            <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{judge.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                  {judge.role}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.detailedScoringBreakdown.semifinal
                          .filter((p: any) => p.role === 'follower')
                          .map((participant: any) => (
                            <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                              <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                              {judges.map((judge) => {
                                const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                return (
                                  <td key={judge.id} className="px-4 py-3 text-center">
                                    {judgeScore ? (
                                      <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                    ) : (
                                      <span className="text-white/40">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-center">
                                <span className="text-yellow-300 font-bold text-lg">
                                  {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-white/60 text-sm">{participant.scores.length}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Final Scoring Table */}
            {adminData?.detailedScoringBreakdown?.final && adminData.detailedScoringBreakdown.final.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🏆</span>
                  Final - Scoring Table
                </h3>
                
                {/* Leaders Table */}
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                    <span className="mr-2">🕺</span>
                    Leaders
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white/5 rounded-xl border border-white/20">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                          {judges.map((judge) => (
                            <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{judge.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                  {judge.role}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.detailedScoringBreakdown.final
                          .filter((p: any) => p.role === 'leader')
                          .map((participant: any) => (
                            <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                              <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                              {judges.map((judge) => {
                                const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                return (
                                  <td key={judge.id} className="px-4 py-3 text-center">
                                    {judgeScore ? (
                                      <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                    ) : (
                                      <span className="text-white/40">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-center">
                                <span className="text-yellow-300 font-bold text-lg">
                                  {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-white/60 text-sm">{participant.scores.length}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Followers Table */}
                <div>
                  <h4 className="text-xl font-bold text-pink-300 mb-4 flex items-center">
                    <span className="mr-2">💃</span>
                    Followers
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white/5 rounded-xl border border-white/20">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="px-4 py-3 text-left text-white font-semibold">Participant</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">#</th>
                          {judges.map((judge) => (
                            <th key={judge.id} className="px-4 py-3 text-center text-white font-semibold">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{judge.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${judge.role === 'leader' ? 'bg-blue-500/30 text-blue-200' : 'bg-pink-500/30 text-pink-200'}`}>
                                  {judge.role}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-white font-semibold">Total</th>
                          <th className="px-4 py-3 text-center text-white font-semibold">Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.detailedScoringBreakdown.final
                          .filter((p: any) => p.role === 'follower')
                          .map((participant: any) => (
                            <tr key={participant.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="px-4 py-3 text-white font-semibold">{participant.name}</td>
                              <td className="px-4 py-3 text-center text-white/80">#{participant.number}</td>
                              {judges.map((judge) => {
                                const judgeScore = participant.scores.find((s: any) => s.judgeName === judge.name);
                                return (
                                  <td key={judge.id} className="px-4 py-3 text-center">
                                    {judgeScore ? (
                                      <span className="text-yellow-300 font-bold text-lg">{judgeScore.score}</span>
                                    ) : (
                                      <span className="text-white/40">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-center">
                                <span className="text-yellow-300 font-bold text-lg">
                                  {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-white/60 text-sm">{participant.scores.length}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {(!adminData?.detailedScoringBreakdown?.heats || adminData.detailedScoringBreakdown.heats.length === 0) &&
             (!adminData?.detailedScoringBreakdown?.semifinal || adminData.detailedScoringBreakdown.semifinal.length === 0) &&
             (!adminData?.detailedScoringBreakdown?.final || adminData.detailedScoringBreakdown.final.length === 0) && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-white mb-4">No Scoring Data Available</h3>
                <p className="text-white/80 text-lg">
                  Scoring tables will appear here once judges have submitted scores for heats, semifinal, or final phases.
                </p>
              </div>
            )}
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


              {/* Overall Heat Rankings */}
              {adminData?.overallHeatRankings && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-green-300 mb-4 flex items-center">
                    <span className="mr-2">🏆</span>
                    Top 8 Heat Rankings (Sum of All Heats)
                  </h4>
                  <p className="text-green-200 text-sm mb-4">
                    These are the top 8 performers in each role based on total scores across all heats. 
                    They would advance to the semifinal phase.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Leaders */}
                    <div>
                      <h5 className="text-md font-bold text-blue-300 mb-3">🕺 Top 8 Leaders</h5>
                      <div className="space-y-2">
                        {adminData.overallHeatRankings.leaders.map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-3 border border-blue-400/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  index === 0 ? 'bg-yellow-500' : 
                                  index === 1 ? 'bg-gray-400' : 
                                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-blue-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore}
                                </div>
                                <div className="text-blue-300 text-xs">
                                  {participant.totalScores} scores
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Followers */}
                    <div>
                      <h5 className="text-md font-bold text-pink-300 mb-3">💃 Top 8 Followers</h5>
                      <div className="space-y-2">
                        {adminData.overallHeatRankings.followers.map((participant: any, index: number) => (
                          <div key={participant.id} className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-lg p-3 border border-pink-400/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  index === 0 ? 'bg-yellow-500' : 
                                  index === 1 ? 'bg-gray-400' : 
                                  index === 2 ? 'bg-orange-500' : 'bg-pink-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{participant.name}</div>
                                  <div className="text-pink-300 text-sm">#{participant.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-300 font-bold text-lg">
                                  {participant.totalScore}
                                </div>
                                <div className="text-pink-300 text-xs">
                                  {participant.totalScores} scores
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Heat Results */}
              {adminData?.heatResults && adminData.heatResults.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-green-300 mb-4">Individual Heat Results</h4>
                  <div className="space-y-6">
                    {adminData.heatResults.map((heat: any, index: number) => (
                      <div key={index} className="bg-white/10 rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-xl font-bold text-white">Heat {heat.number}</h5>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-white/60">
                              {heat.totalScores || 0} scores submitted
                            </div>
                            {heat.isActive ? (
                              <div className="inline-flex items-center px-3 py-1 bg-green-500/30 rounded-full text-green-200 text-sm font-medium">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                Active
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveHeat(heat.id)}
                                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                🎯 Activate Heat
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Leaders */}
                          <div>
                            <h6 className="text-md font-semibold text-blue-300 mb-3">🕺 Leaders</h6>
                            <div className="space-y-2">
                              {heat.participants
                                .filter((p: any) => p.role === 'leader')
                                .map((participant: any, participantIndex: number) => (
                                  <div key={participant.id} className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-500/50 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                          {participantIndex + 1}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-white">{participant.name}</div>
                                          <div className="text-blue-300 text-sm">#{participant.number}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-yellow-300 font-bold text-lg">
                                          {participant.totalScore}
                                        </div>
                                        <div className="text-blue-300 text-xs">
                                          {participant.totalScores} scores
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          {/* Followers */}
                          <div>
                            <h6 className="text-md font-semibold text-pink-300 mb-3">💃 Followers</h6>
                            <div className="space-y-2">
                              {heat.participants
                                .filter((p: any) => p.role === 'follower')
                                .map((participant: any, participantIndex: number) => (
                                  <div key={participant.id} className="bg-pink-500/10 rounded-lg p-3 border border-pink-400/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-pink-500/50 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                          {participantIndex + 1}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-white">{participant.name}</div>
                                          <div className="text-pink-300 text-sm">#{participant.number}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-yellow-300 font-bold text-lg">
                                          {participant.totalScore}
                                        </div>
                                        <div className="text-pink-300 text-xs">
                                          {participant.totalScores} scores
                                        </div>
                                      </div>
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
                                  {participant.totalScore || 'N/A'}
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
                                  {participant.totalScore || 'N/A'}
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
                                  {participant.totalScore || 'N/A'}
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
                                  {participant.totalScore || 'N/A'}
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

              {/* Detailed Scoring Breakdown */}
              {adminData?.detailedScoringBreakdown && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-purple-300 mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Detailed Scoring Breakdown
                  </h4>
                  
                  {/* Heat Scores */}
                  {adminData.detailedScoringBreakdown.heats && adminData.detailedScoringBreakdown.heats.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-md font-bold text-green-300 mb-3">🔥 Heat Scores</h5>
                      <div className="space-y-4">
                        {adminData.detailedScoringBreakdown.heats.map((heat: any) => (
                          <div key={heat.heatId} className="bg-white/10 rounded-xl p-4 border border-white/20">
                            <h6 className="text-lg font-semibold text-white mb-3">Heat {heat.heatNumber}</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Leaders */}
                              <div>
                                <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                                <div className="space-y-2">
                                  {heat.participants
                                    .filter((p: any) => p.role === 'leader')
                                    .map((participant: any) => (
                                      <div key={participant.id} className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <div className="font-semibold text-white">{participant.name}</div>
                                            <div className="text-blue-300 text-sm">#{participant.number}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-yellow-300 font-bold">
                                              {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                            </div>
                                            <div className="text-blue-300 text-xs">{participant.scores.length} scores</div>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          {participant.scores.map((score: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between text-xs">
                                              <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                                <span className="text-white/80">{score.judgeName}</span>
                                              </div>
                                              <span className="text-yellow-300 font-semibold">{score.score}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                              
                              {/* Followers */}
                              <div>
                                <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                                <div className="space-y-2">
                                  {heat.participants
                                    .filter((p: any) => p.role === 'follower')
                                    .map((participant: any) => (
                                      <div key={participant.id} className="bg-pink-500/10 rounded-lg p-3 border border-pink-400/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <div className="font-semibold text-white">{participant.name}</div>
                                            <div className="text-pink-300 text-sm">#{participant.number}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-yellow-300 font-bold">
                                              {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                            </div>
                                            <div className="text-pink-300 text-xs">{participant.scores.length} scores</div>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          {participant.scores.map((score: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between text-xs">
                                              <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                                <span className="text-white/80">{score.judgeName}</span>
                                              </div>
                                              <span className="text-yellow-300 font-semibold">{score.score}</span>
                                            </div>
                                          ))}
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

                  {/* Semifinal Scores */}
                  {adminData.detailedScoringBreakdown.semifinal && adminData.detailedScoringBreakdown.semifinal.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-md font-bold text-purple-300 mb-3">🥈 Semifinal Scores</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Leaders */}
                        <div>
                          <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                          <div className="space-y-2">
                            {adminData.detailedScoringBreakdown.semifinal
                              .filter((p: any) => p.role === 'leader')
                              .map((participant: any) => (
                                <div key={participant.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-semibold text-white">{participant.name}</div>
                                      <div className="text-blue-300 text-sm">#{participant.number}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold">
                                        {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                      </div>
                                      <div className="text-purple-300 text-xs">{participant.scores.length} scores</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {participant.scores.map((score: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                          <span className="text-white/80">{score.judgeName}</span>
                                        </div>
                                        <span className="text-yellow-300 font-semibold">{score.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Followers */}
                        <div>
                          <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                          <div className="space-y-2">
                            {adminData.detailedScoringBreakdown.semifinal
                              .filter((p: any) => p.role === 'follower')
                              .map((participant: any) => (
                                <div key={participant.id} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-semibold text-white">{participant.name}</div>
                                      <div className="text-pink-300 text-sm">#{participant.number}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold">
                                        {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                      </div>
                                      <div className="text-purple-300 text-xs">{participant.scores.length} scores</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {participant.scores.map((score: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                          <span className="text-white/80">{score.judgeName}</span>
                                        </div>
                                        <span className="text-yellow-300 font-semibold">{score.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Scores */}
                  {adminData.detailedScoringBreakdown.final && adminData.detailedScoringBreakdown.final.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-md font-bold text-orange-300 mb-3">🏆 Final Scores</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Leaders */}
                        <div>
                          <h6 className="text-sm font-semibold text-blue-300 mb-2">🕺 Leaders</h6>
                          <div className="space-y-2">
                            {adminData.detailedScoringBreakdown.final
                              .filter((p: any) => p.role === 'leader')
                              .map((participant: any) => (
                                <div key={participant.id} className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-semibold text-white">{participant.name}</div>
                                      <div className="text-blue-300 text-sm">#{participant.number}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold">
                                        {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                      </div>
                                      <div className="text-orange-300 text-xs">{participant.scores.length} scores</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {participant.scores.map((score: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                          <span className="text-white/80">{score.judgeName}</span>
                                        </div>
                                        <span className="text-yellow-300 font-semibold">{score.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Followers */}
                        <div>
                          <h6 className="text-sm font-semibold text-pink-300 mb-2">💃 Followers</h6>
                          <div className="space-y-2">
                            {adminData.detailedScoringBreakdown.final
                              .filter((p: any) => p.role === 'follower')
                              .map((participant: any) => (
                                <div key={participant.id} className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-semibold text-white">{participant.name}</div>
                                      <div className="text-pink-300 text-sm">#{participant.number}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-yellow-300 font-bold">
                                        {participant.scores.reduce((sum: number, s: any) => sum + s.score, 0)}
                                      </div>
                                      <div className="text-orange-300 text-xs">{participant.scores.length} scores</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {participant.scores.map((score: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className={`w-2 h-2 rounded-full ${score.judgeRole === 'leader' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                          <span className="text-white/80">{score.judgeName}</span>
                                        </div>
                                        <span className="text-yellow-300 font-semibold">{score.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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