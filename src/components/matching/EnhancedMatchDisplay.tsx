"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, GraduationCap, Award, Target, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchBreakdown {
  requiredSkillsMatched: string[];
  preferredSkillsMatched: string[];
  missingRequiredSkills: string[];
  experienceLevel: string;
  educationLevel: string;
  additionalStrengths: string[];
}

interface EnhancedMatchData {
  candidateId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;
  breakdown: MatchBreakdown;
}

interface EnhancedMatchDisplayProps {
  matchData: EnhancedMatchData;
  candidateName: string;
  showDetails?: boolean;
}

export function EnhancedMatchDisplay({ 
  matchData, 
  candidateName,
  showDetails = false 
}: EnhancedMatchDisplayProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    const percentage = Math.round(score * 100);
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-700">Excellent ({percentage}%)</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-700">Good ({percentage}%)</Badge>;
    return <Badge className="bg-red-100 text-red-700">Poor ({percentage}%)</Badge>;
  };

  const formatPercentage = (score: number) => Math.round(score * 100);

  const ScoreBreakdown = () => (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <div className={`text-4xl font-bold mb-2 ${getScoreColor(matchData.overallScore)}`}>
          {formatPercentage(matchData.overallScore)}%
        </div>
        <div className="mb-2">
          {getScoreBadge(matchData.overallScore)}
        </div>
        <p className="text-sm text-muted-foreground">Overall Match Score</p>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Skills Match</span>
          </div>
          <Progress value={formatPercentage(matchData.skillsScore)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatPercentage(matchData.skillsScore)}% - Technical skills alignment
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Experience</span>
          </div>
          <Progress value={formatPercentage(matchData.experienceScore)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatPercentage(matchData.experienceScore)}% - Experience level match
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Education</span>
          </div>
          <Progress value={formatPercentage(matchData.educationScore)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatPercentage(matchData.educationScore)}% - Educational background
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">AI Semantic</span>
          </div>
          <Progress value={formatPercentage(matchData.semanticScore)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatPercentage(matchData.semanticScore)}% - AI semantic similarity
          </p>
        </div>
      </div>

      <Separator />

      {/* Skills Breakdown */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Skills Analysis
        </h4>
        
        {matchData.breakdown.requiredSkillsMatched.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-green-700 mb-2">
              ✓ Required Skills Matched ({matchData.breakdown.requiredSkillsMatched.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {matchData.breakdown.requiredSkillsMatched.map((skill, index) => (
                <Badge key={index} className="bg-green-100 text-green-700 text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {matchData.breakdown.preferredSkillsMatched.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-700 mb-2">
              + Preferred Skills Matched ({matchData.breakdown.preferredSkillsMatched.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {matchData.breakdown.preferredSkillsMatched.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {matchData.breakdown.missingRequiredSkills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-red-700 mb-2">
              ✗ Missing Required Skills ({matchData.breakdown.missingRequiredSkills.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {matchData.breakdown.missingRequiredSkills.map((skill, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Experience & Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Experience Level
          </h5>
          <Badge variant="outline">{matchData.breakdown.experienceLevel}</Badge>
        </div>

        <div>
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education Level
          </h5>
          <Badge variant="outline">{matchData.breakdown.educationLevel}</Badge>
        </div>
      </div>

      {/* Additional Strengths */}
      {matchData.breakdown.additionalStrengths.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Additional Strengths
            </h4>
            <ul className="space-y-1">
              {matchData.breakdown.additionalStrengths.map((strength, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );

  if (showDetails) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Enhanced Match Analysis for {candidateName}
          </CardTitle>
          <CardDescription>
            AI-powered detailed scoring and skill analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreBreakdown />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-semibold", getScoreColor(matchData.overallScore))}>
        {formatPercentage(matchData.overallScore)}%
      </span>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Eye className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Match Analysis: {candidateName}
            </DialogTitle>
            <DialogDescription>
              Detailed AI-powered scoring breakdown and skill analysis
            </DialogDescription>
          </DialogHeader>
          <ScoreBreakdown />
        </DialogContent>
      </Dialog>
    </div>
  );
}