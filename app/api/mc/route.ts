import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/mc - Get MC dashboard data
export async function GET() {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.competitionState) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

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

    // Get overall competition stats
    const participantCount = await prisma.participant.count();
    const judgeCount = await prisma.judge.count();
    const totalScores = await prisma.score.count();
    
    // Get participants by role
    const leaders = await prisma.participant.count({
      where: { role: 'LEADER' }
    });
    
    const followers = await prisma.participant.count({
      where: { role: 'FOLLOWER' }
    });

    return NextResponse.json({
      stats: {
        participants: participantCount,
        judges: judgeCount,
        totalScores,
        leaders,
        followers,
        heats: heats.length
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
    return NextResponse.json({ error: 'Failed to fetch MC data' }, { status: 500 });
  }
} 