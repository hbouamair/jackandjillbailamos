import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import type { Role } from '@prisma/client';

// GET /api/judges/scoring - Get scoring data for a judge
export async function GET(req: NextRequest) {
  const apiStart = Date.now();
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role parameter' }, { status: 400 });
    }
    
    // Find the judge by userId
    const judgeStart = Date.now();
    const judge = await prisma.judge.findUnique({
      where: { userId: userId }
    });
    console.log('Judge fetch:', Date.now() - judgeStart, 'ms');
    
    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    // Get competition state (optimized: only select needed fields)
    const compStateStart = Date.now();
    const competitionState = await prisma.competitionState.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        currentPhase: true,
        semifinalists: true,
        finalists: true,
        activeHeat: {
          select: {
            id: true,
            number: true,
            participants: {
              where: {
                participant: {
                  role: role.toUpperCase() as Role
                }
              },
              select: {
                participant: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    number: true,
                    pictureUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });
    console.log('Competition state fetch:', Date.now() - compStateStart, 'ms');
    
    const currentPhase = competitionState?.currentPhase.toLowerCase() || 'heats';
    
    if (currentPhase === 'heats') {
      if (competitionState?.activeHeat) {
        // Active heat exists - show participants from active heat only
        const activeHeat = competitionState.activeHeat;
        // participantsForJudge: flatten HeatParticipant to Participant (no need to filter by role again)
        const participantsForJudge = activeHeat.participants
          .map((hp: { participant: { id: string; name: string; role: string; number: number; pictureUrl: string | null } }) => ({
            ...hp.participant,
            role: hp.participant.role.toLowerCase()
          }));
        
        // Get existing scores for these participants in this heat (optimized: only select participantId)
        const scoresStart = Date.now();
        const scores = await prisma.score.findMany({
          where: {
            judgeId: judge.id,
            heatId: activeHeat.id,
            participantId: {
              in: participantsForJudge.map(p => p.id)
            }
          },
          select: { participantId: true }
        });
        console.log('Scores fetch (heats):', Date.now() - scoresStart, 'ms');
        
        // Check if judge has already scored for this heat
        const hasScoredForHeat = scores.length > 0;
        
        const participantsWithScores = participantsForJudge.map((participant: { id: string }) => ({
          ...participant,
          scored: scores.some((score: { participantId: string }) => score.participantId === participant.id)
        }));
        console.log('Total API time:', Date.now() - apiStart, 'ms');
        return NextResponse.json({
          phase: currentPhase,
          activeHeat: {
            id: activeHeat.id,
            number: activeHeat.number,
            participants: participantsWithScores
          },
          judgeRole: role,
          judgeId: judge!.id,
          hasActiveHeat: true,
          hasScoredForHeat: hasScoredForHeat
        });
      } else {
        console.log('Total API time:', Date.now() - apiStart, 'ms');
        // No active heat - show message
        return NextResponse.json({
          phase: currentPhase,
          activeHeat: null,
          judgeRole: role,
          judgeId: judge.id,
          hasActiveHeat: false,
          message: 'No heat is currently active on the dance floor. Please wait for the admin to activate a heat.'
        });
      }
    } else {
      // For semifinal and final phases
      let participants: any[] = [];
      
      if (currentPhase === 'semifinal') {
        // Get semifinalists from competition state
        const semifinalists = JSON.parse(competitionState?.semifinalists || '[]');
        participants = semifinalists.filter((p: any) => p.role === role);
      } else if (currentPhase === 'final') {
        // Get finalists from competition state
        const finalists = JSON.parse(competitionState?.finalists || '[]');
        participants = finalists.filter((p: any) => p.role === role);
      }
      
      // Get existing scores for these participants in this phase
      const scoresStart = Date.now();
      const scores = await prisma.score.findMany({
        where: {
          judgeId: judge.id,
          phase: competitionState?.currentPhase,
          participantId: {
            in: participants.map((p: any) => p.id)
          }
        },
        select: { participantId: true }
      });
      console.log('Scores fetch (semifinal/final):', Date.now() - scoresStart, 'ms');
      
      // Check if judge has already scored for this phase
      const hasScoredForPhase = scores.length > 0;
      
      const participantsWithScores = participants.map((participant: any) => ({
        ...participant,
        scored: scores.some(score => score.participantId === participant.id)
      }));
      console.log('Total API time:', Date.now() - apiStart, 'ms');
      return NextResponse.json({
        phase: currentPhase,
        participants: participantsWithScores,
        judgeRole: role,
        judgeId: judge.id,
        hasScoredForPhase: hasScoredForPhase
      });
    }
  } catch (error) {
    console.log('API error, total time:', Date.now() - apiStart, 'ms');
    return NextResponse.json({ error: 'Failed to fetch scoring data' }, { status: 500 });
  }
}

// POST /api/judges/scoring - Submit scores
export async function POST(req: NextRequest) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.judge) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const data = await req.json();
    const { userId, scores, phase, heatId } = data;
    
    if (!userId || !scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Find the judge by userId
    const judge = await prisma.judge.findUnique({
      where: { userId: userId }
    });
    
    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }
    
    // Convert phase to Prisma enum format
    const prismaPhase = phase.toUpperCase() as 'HEATS' | 'SEMIFINAL' | 'FINAL';
    
    // Create score records (one per participant, not per rotation)
    const scorePromises = scores.map((scoreData: any) => {
      return prisma.score.create({
        data: {
          judgeId: judge.id,
          participantId: scoreData.participantId,
          score: scoreData.score,
          phase: prismaPhase,
          heatId: heatId || null
        }
      });
    });
    
    await Promise.all(scorePromises);
    
    return NextResponse.json({ 
      message: `Scores submitted successfully for ${scores.length} participants`,
      submitted: scores.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit scores' }, { status: 500 });
  }
} 