"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, CheckCircle, AlertTriangle, FileText, User } from "lucide-react";
import { genkitService, handleGenkitError } from "@/lib/genkit";
import type { CandidateScreeningInput, CandidateScreeningOutput } from "@/ai/flows/ai-candidate-screening";

interface CandidateScreeningPanelProps {
  jobDetails: string;
  candidateResume: string;
  candidateProfile?: string;
  candidateName: string;
  onScreeningComplete?: (result: CandidateScreeningOutput) => void;
}

export function CandidateScreeningPanel({
  jobDetails,
  candidateResume,
  candidateProfile,
  candidateName,
  onScreeningComplete
}: CandidateScreeningPanelProps) {
  const [screening, setScreening] = useState<CandidateScreeningOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runScreening = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const input: CandidateScreeningInput = {
        jobDetails,
        resume: candidateResume,
        candidateProfile
      };

      const result = await genkitService.screenCandidate(input);
      setScreening(result);
      
      toast({
        title: "AI Screening Complete",
        description: `Screening completed for ${candidateName}`,
      });

      onScreeningComplete?.(result);
    } catch (err: any) {
      const errorMessage = handleGenkitError(err);
      setError(errorMessage);
      toast({
        title: "Screening Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuitabilityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">Excellent Match</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700">Good Match</Badge>;
    return <Badge className="bg-red-100 text-red-700">Poor Match</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Candidate Screening
        </CardTitle>
        <CardDescription>
          Get AI-powered insights on candidate suitability for this role
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!screening && !isLoading && (
          <div className="text-center py-6">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Click below to run AI screening for {candidateName}
            </p>
            <Button onClick={runScreening} disabled={isLoading}>
              <Brain className="mr-2 h-4 w-4" />
              Run AI Screening
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              AI is analyzing the candidate...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Screening Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {screening && (
          <div className="space-y-6">
            {/* Suitability Score */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <div className={`text-4xl font-bold mb-2 ${getSuitabilityColor(screening.suitabilityScore)}`}>
                {screening.suitabilityScore}%
              </div>
              <div className="mb-2">
                {getSuitabilityBadge(screening.suitabilityScore)}
              </div>
              <p className="text-sm text-muted-foreground">Suitability Score</p>
            </div>

            {/* Summary */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </h4>
              <p className="text-sm leading-relaxed">{screening.summary}</p>
            </div>

            <Separator />

            {/* Strengths */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Key Strengths
              </h4>
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {screening.strengths}
              </div>
            </div>

            <Separator />

            {/* Areas for Improvement */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Areas for Improvement
              </h4>
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {screening.areasForImprovement}
              </div>
            </div>

            <Separator />

            {/* Recommendation */}
            <div>
              <h4 className="font-semibold mb-2">Recommendation</h4>
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">
                  {screening.recommendation}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </CardContent>

      {screening && (
        <CardFooter>
          <Button variant="outline" onClick={runScreening} disabled={isLoading} className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            Re-run Screening
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}