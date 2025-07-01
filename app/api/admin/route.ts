import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/admin - Get admin dashboard data
export async function GET() {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get counts and basic stats
    const participantCount = await prisma.participant.count();
    const judgeCount = await prisma.judge.count();
    const heatCount = await prisma.heat.count();
    
    // Get competition state
    const competitionState = await prisma.competitionState.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        activeHeat: {
          include: {
            participants: {
              include: {
                participant: true
              }
            }
          }
        }
      }
    });
    
    // Get participants by role
    const leaders = await prisma.participant.count({
      where: { role: 'LEADER' }
    });
    
    const followers = await prisma.participant.count({
      where: { role: 'FOLLOWER' }
    });

    // Get all heats with scores
    const heats = await prisma.heat.findMany({
      include: {
        participants: {
          include: {
            participant: true
          }
        },
        scores: {
          include: {
            judge: true,
            participant: true
          }
        }
      },
      orderBy: { number: 'asc' }
    });

    // Calculate results for each heat
    const heatResults = heats.map(heat => {
      const participants = heat.participants.map(hp => hp.participant);
      const scores = heat.scores;
      
      // Calculate average scores for each participant
      const participantScores = participants.map(participant => {
        const participantScores = scores.filter(s => s.participantId === participant.id);
        const averageScore = participantScores.length > 0 
          ? participantScores.reduce((sum, s) => sum + s.score, 0) / participantScores.length 
          : 0;
        
        return {
          ...participant,
          role: participant.role.toLowerCase(),
          averageScore: Math.round(averageScore * 10) / 10,
          totalScores: participantScores.length
        };
      });

      // Sort by average score (highest first)
      participantScores.sort((a, b) => b.averageScore - a.averageScore);

      return {
        id: heat.id,
        number: heat.number,
        isActive: competitionState?.activeHeatId === heat.id,
        participants: participantScores,
        totalScores: scores.length
      };
    });
    
    return NextResponse.json({
      stats: {
        participants: participantCount,
        judges: judgeCount,
        heats: heatCount,
        leaders,
        followers
      },
      competitionState: competitionState ? {
        currentPhase: competitionState.currentPhase.toLowerCase(),
        activeHeatId: competitionState.activeHeatId,
        activeHeat: competitionState.activeHeat ? {
          id: competitionState.activeHeat.id,
          number: competitionState.activeHeat.number,
          participants: competitionState.activeHeat.participants.map(hp => ({
            ...hp.participant,
            role: hp.participant.role.toLowerCase()
          }))
        } : null,
        semifinalists: JSON.parse(competitionState.semifinalists),
        finalists: JSON.parse(competitionState.finalists),
        winners: JSON.parse(competitionState.winners)
      } : null,
      heatResults
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}

// POST /api/admin - Admin actions
export async function POST(req: NextRequest) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.participant) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const data = await req.json();
    const { action, ...params } = data;
    
    switch (action) {
      case 'generate_heats':
        return await generateHeats();
      case 'set_active_heat':
        return await setActiveHeat(params.heatId);
      case 'advance_semifinal':
        return await advanceToSemifinal();
      case 'advance_final':
        return await advanceToFinal();
      case 'determine_winners':
        return await determineWinners();
      case 'reset_competition':
        return await resetCompetition();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Admin action failed' }, { status: 500 });
  }
}

async function generateHeats() {
  try {
    // Get all participants
    const participants = await prisma.participant.findMany({
      orderBy: { number: 'asc' }
    });
  
  const leaders = participants.filter(p => p.role === 'LEADER');
  const followers = participants.filter(p => p.role === 'FOLLOWER');
  
  // Check if we have participants
  if (leaders.length === 0 || followers.length === 0) {
    return NextResponse.json({ 
      error: 'Need at least 1 leader and 1 follower to generate heats' 
    }, { status: 400 });
  }
  
  // Calculate optimal number of heats
  // Target: 4-6 participants per heat (2-3 couples)
  const totalParticipants = leaders.length + followers.length;
  const participantsPerHeat = 6; // Target 6 participants per heat (3 couples)
  const numberOfHeats = Math.ceil(totalParticipants / participantsPerHeat);
  
  // Ensure we have at least 2 heats for a proper competition
  const finalNumberOfHeats = Math.max(2, numberOfHeats);
  
  // Calculate participants per heat
  const leadersPerHeat = Math.ceil(leaders.length / finalNumberOfHeats);
  const followersPerHeat = Math.ceil(followers.length / finalNumberOfHeats);
  
  // Clear existing heats
  await prisma.heat.deleteMany();
  
  // Shuffle participants randomly
  const shuffledLeaders = [...leaders].sort(() => Math.random() - 0.5);
  const shuffledFollowers = [...followers].sort(() => Math.random() - 0.5);
  
  // Create heats dynamically
  const heats = [];
  for (let i = 1; i <= finalNumberOfHeats; i++) {
    const heat = await prisma.heat.create({
      data: { number: i }
    });
    
    // Calculate start and end indices for this heat
    const leaderStart = (i - 1) * leadersPerHeat;
    const leaderEnd = Math.min(i * leadersPerHeat, leaders.length);
    const followerStart = (i - 1) * followersPerHeat;
    const followerEnd = Math.min(i * followersPerHeat, followers.length);
    
    // Assign participants to this heat
    const heatLeaders = shuffledLeaders.slice(leaderStart, leaderEnd);
    const heatFollowers = shuffledFollowers.slice(followerStart, followerEnd);
    
    // Create heat participants
    for (const participant of [...heatLeaders, ...heatFollowers]) {
      await prisma.heatParticipant.create({
        data: {
          heatId: heat.id,
          participantId: participant.id
        }
      });
    }
    
    // Create rotations for this heat
    const songTypes = ['URBAN', 'SENSUAL', 'TRADITIONAL'];
    for (let j = 1; j <= 3; j++) {
      await prisma.rotation.create({
        data: {
          number: j,
          songType: songTypes[j - 1] as any,
          duration: 90,
          heatId: heat.id
        }
      });
    }
    
    heats.push(heat);
  }
  
  // Update competition state
  await prisma.competitionState.create({
    data: {
      currentPhase: 'HEATS',
      semifinalists: '[]',
      finalists: '[]',
      winners: '{}'
    }
  });
  
  return NextResponse.json({ 
    message: 'Heats generated successfully with random participant distribution', 
    heats: heats.length 
  });
  } catch (error) {
    console.error('Error generating heats:', error);
    return NextResponse.json({ error: 'Failed to generate heats' }, { status: 500 });
  }
}

async function setActiveHeat(heatId: string) {
  try {
    if (!heatId) {
      return NextResponse.json({ error: 'Heat ID is required' }, { status: 400 });
    }

    // Verify heat exists
    const heat = await prisma.heat.findUnique({
      where: { id: heatId }
    });

    if (!heat) {
      return NextResponse.json({ error: 'Heat not found' }, { status: 404 });
    }

    // Update competition state with active heat
    await prisma.competitionState.create({
      data: {
        currentPhase: 'HEATS',
        activeHeatId: heatId,
        semifinalists: '[]',
        finalists: '[]',
        winners: '{}'
      }
    });
    
    return NextResponse.json({ 
      message: `Heat ${heat.number} is now active on the dance floor`,
      activeHeatId: heatId
    });
  } catch (error) {
    console.error('Error setting active heat:', error);
    return NextResponse.json({ error: 'Failed to set active heat' }, { status: 500 });
  }
}

async function advanceToSemifinal() {
  try {
    // Get all heats with their scores
    const heats = await prisma.heat.findMany({
      include: {
        participants: {
          include: {
            participant: true
          }
        },
        scores: {
          include: {
            participant: true
          }
        }
      }
    });

    // Calculate total scores for each participant across all heats
    const participantScores = new Map<string, number>();
    const participantCounts = new Map<string, number>();

    // Initialize all participants with 0 scores
    const allParticipants = await prisma.participant.findMany();
    allParticipants.forEach(p => {
      participantScores.set(p.id, 0);
      participantCounts.set(p.id, 0);
    });

    // Sum up all scores for each participant
    heats.forEach(heat => {
      heat.scores.forEach(score => {
        const currentScore = participantScores.get(score.participantId) || 0;
        const currentCount = participantCounts.get(score.participantId) || 0;
        participantScores.set(score.participantId, currentScore + score.score);
        participantCounts.set(score.participantId, currentCount + 1);
      });
    });

    // Calculate average scores for each participant
    const participantAverages = new Map<string, number>();
    participantScores.forEach((totalScore, participantId) => {
      const count = participantCounts.get(participantId) || 1;
      const averageScore = totalScore / count;
      participantAverages.set(participantId, averageScore);
    });

    // Get top 8 leaders and top 8 followers
    const leaders = allParticipants
      .filter(p => p.role === 'LEADER')
      .sort((a, b) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 8);

    const followers = allParticipants
      .filter(p => p.role === 'FOLLOWER')
      .sort((a, b) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 8);

    const semifinalists = [...leaders, ...followers];

    // Update competition state
  await prisma.competitionState.create({
    data: {
      currentPhase: 'SEMIFINAL',
        activeHeatId: null, // Clear active heat
        semifinalists: JSON.stringify(semifinalists.map(p => ({
          id: p.id,
          name: p.name,
          number: p.number,
          role: p.role.toLowerCase(),
          pictureUrl: p.pictureUrl
        }))),
      finalists: '[]',
      winners: '{}'
    }
  });
  
    return NextResponse.json({ 
      message: `Advanced to semifinal with ${leaders.length} leaders and ${followers.length} followers`,
      semifinalists: semifinalists.length
    });
  } catch (error) {
    console.error('Error advancing to semifinal:', error);
    return NextResponse.json({ error: 'Failed to advance to semifinal' }, { status: 500 });
  }
}

async function advanceToFinal() {
  try {
    // Get current competition state to find semifinalists
    const currentState = await prisma.competitionState.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!currentState || currentState.currentPhase !== 'SEMIFINAL') {
      return NextResponse.json({ error: 'Must be in semifinal phase to advance to final' }, { status: 400 });
    }

    const semifinalists = JSON.parse(currentState.semifinalists);
    const semifinalistIds = semifinalists.map((p: any) => p.id);

    // Get semifinal scores for these participants
    const semifinalScores = await prisma.score.findMany({
      where: {
        participantId: { in: semifinalistIds },
        phase: 'SEMIFINAL'
      },
      include: {
        participant: true
      }
    });

    // Calculate average scores for each semifinalist
    const participantScores = new Map<string, number>();
    const participantCounts = new Map<string, number>();

    semifinalists.forEach((p: any) => {
      participantScores.set(p.id, 0);
      participantCounts.set(p.id, 0);
    });

    semifinalScores.forEach(score => {
      const currentScore = participantScores.get(score.participantId) || 0;
      const currentCount = participantCounts.get(score.participantId) || 0;
      participantScores.set(score.participantId, currentScore + score.score);
      participantCounts.set(score.participantId, currentCount + 1);
    });

    // Calculate average scores
    const participantAverages = new Map<string, number>();
    participantScores.forEach((totalScore, participantId) => {
      const count = participantCounts.get(participantId) || 1;
      const averageScore = totalScore / count;
      participantAverages.set(participantId, averageScore);
    });

    // Get top 5 leaders and top 5 followers
    const leaders = semifinalists
      .filter((p: any) => p.role === 'leader')
      .sort((a: any, b: any) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 5);

    const followers = semifinalists
      .filter((p: any) => p.role === 'follower')
      .sort((a: any, b: any) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 5);

    const finalists = [...leaders, ...followers];

    // Clear all semifinal scores to start fresh for the final
    await prisma.score.deleteMany({
      where: {
        phase: 'SEMIFINAL'
      }
    });

    // Update competition state
  await prisma.competitionState.create({
    data: {
      currentPhase: 'FINAL',
        activeHeatId: null,
        semifinalists: currentState.semifinalists,
        finalists: JSON.stringify(finalists.map(p => ({
          id: p.id,
          name: p.name,
          number: p.number,
          role: p.role,
          pictureUrl: p.pictureUrl
        }))),
      winners: '{}'
    }
  });
  
    return NextResponse.json({ 
      message: `Advanced to final with ${leaders.length} leaders and ${followers.length} followers. Judges can now score the finalists to determine the 3 winners.`,
      finalists: finalists.length
    });
  } catch (error) {
    console.error('Error advancing to final:', error);
    return NextResponse.json({ error: 'Failed to advance to final' }, { status: 500 });
  }
}

async function determineWinners() {
  try {
    // Get current competition state to find finalists
    const currentState = await prisma.competitionState.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!currentState || currentState.currentPhase !== 'FINAL') {
      return NextResponse.json({ error: 'Must be in final phase to determine winners' }, { status: 400 });
    }

    const finalists = JSON.parse(currentState.finalists);
    const finalistIds = finalists.map((p: any) => p.id);

    // Get final scores for these participants
    const finalScores = await prisma.score.findMany({
      where: {
        participantId: { in: finalistIds },
        phase: 'FINAL'
      },
      include: {
        participant: true
      }
    });

    // Calculate average scores for each finalist
    const participantScores = new Map<string, number>();
    const participantCounts = new Map<string, number>();

    finalists.forEach((p: any) => {
      participantScores.set(p.id, 0);
      participantCounts.set(p.id, 0);
    });

    finalScores.forEach(score => {
      const currentScore = participantScores.get(score.participantId) || 0;
      const currentCount = participantCounts.get(score.participantId) || 0;
      participantScores.set(score.participantId, currentScore + score.score);
      participantCounts.set(score.participantId, currentCount + 1);
    });

    // Calculate average scores
    const participantAverages = new Map<string, number>();
    participantScores.forEach((totalScore, participantId) => {
      const count = participantCounts.get(participantId) || 1;
      const averageScore = totalScore / count;
      participantAverages.set(participantId, averageScore);
    });

    // Get top 3 leaders and top 3 followers
    const leaders = finalists
      .filter((p: any) => p.role === 'leader')
      .sort((a: any, b: any) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 3);

    const followers = finalists
      .filter((p: any) => p.role === 'follower')
      .sort((a: any, b: any) => (participantAverages.get(b.id) || 0) - (participantAverages.get(a.id) || 0))
      .slice(0, 3);

    const winners = {
      leader: {
        first: leaders.length > 0 ? leaders[0] : null,
        second: leaders.length > 1 ? leaders[1] : null,
        third: leaders.length > 2 ? leaders[2] : null
      },
      follower: {
        first: followers.length > 0 ? followers[0] : null,
        second: followers.length > 1 ? followers[1] : null,
        third: followers.length > 2 ? followers[2] : null
      }
    };

    // Update competition state
    await prisma.competitionState.create({
      data: {
        currentPhase: 'FINAL',
        activeHeatId: null,
        semifinalists: currentState.semifinalists,
        finalists: currentState.finalists,
        winners: JSON.stringify(winners)
      }
    });
    
    const leaderNames = [
      winners.leader.first?.name,
      winners.leader.second?.name,
      winners.leader.third?.name
    ].filter(Boolean).join(', ');
    
    const followerNames = [
      winners.follower.first?.name,
      winners.follower.second?.name,
      winners.follower.third?.name
    ].filter(Boolean).join(', ');
    
    return NextResponse.json({ 
      message: `Winners determined! Leaders: ${leaderNames || 'None'}, Followers: ${followerNames || 'None'}`,
      winners: winners
    });
  } catch (error) {
    console.error('Error determining winners:', error);
    return NextResponse.json({ error: 'Failed to determine winners' }, { status: 500 });
  }
}

async function resetCompetition() {
  try {
    // Clear all competition data
    // Delete scores first (they depend on rotations, heats, participants, judges)
    await prisma.score.deleteMany();
    // Delete rotations before heats (due to FK)
    await prisma.rotation.deleteMany();
    // Delete heat participants before heats (due to FK)
    await prisma.heatParticipant.deleteMany();
    // Delete heats
    await prisma.heat.deleteMany();
    // Delete competition states
    await prisma.competitionState.deleteMany();
    // Delete judges (and their users)
    await prisma.judge.deleteMany();
    // Delete participants
    await prisma.participant.deleteMany();
    // Delete users except admin and MC
    await prisma.user.deleteMany({ where: { NOT: [{ username: 'admin' }, { username: 'mc' }] } });

    // Create a new blank competition state
    await prisma.competitionState.create({
      data: {
        currentPhase: 'HEATS',
        activeHeatId: null,
        semifinalists: '[]',
        finalists: '[]',
        winners: '{}'
      }
    });
    
    return NextResponse.json({ message: 'Competition reset successfully' });
  } catch (error) {
    console.error('Error resetting competition:', error);
    return NextResponse.json({ error: 'Failed to reset competition' }, { status: 500 });
  }
} 