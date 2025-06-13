"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertTriangle, Brain, X, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resumeStorage, type UploadProgress } from "@/lib/storage";
import { applicationService } from "@/lib/firestore";

interface EnhancedResumeUploadProps {
  jobId?: string;
  candidateName?: string;
  candidateEmail?: string;
  onUploadComplete?: (resumeUrl: string, extractedData?: any) => void;
  onProcessingComplete?: (processingResult: any) => void;
}

interface ProcessingStatus {
  stage: 'idle' | 'uploading' | 'processing' | 'extracting' | 'embedding' | 'complete' | 'error';
  progress: number;
  message: string;
  extractedData?: {
    name?: string;
    email?: string;
    skills: string[];
    experience: string[];
    education: string[];
    summary?: string;
  };
}

export function EnhancedResumeUpload({
  jobId,
  candidateName,
  candidateEmail,
  onUploadComplete,
  onProcessingComplete
}: EnhancedResumeUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to upload resume'
  });
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF or Word document (.pdf, .doc, .docx)';
    }
    
    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB. Current size: ${fileSizeMB.toFixed(1)}MB`;
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    setProcessingStatus({
      stage: 'idle',
      progress: 0,
      message: `Ready to process: ${file.name}`
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadAndProcessResume = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    try {
      // Stage 1: Upload file
      setProcessingStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading resume to cloud storage...'
      });

      const uploadProgress = (progress: UploadProgress) => {
        setProcessingStatus(prev => ({
          ...prev,
          progress: 10 + (progress.progress * 0.3), // 10-40% for upload
          message: `Uploading: ${Math.round(progress.progress)}%`
        }));
      };

      const uploadedUrl = await resumeStorage.upload(selectedFile, user.uid, uploadProgress);
      setResumeUrl(uploadedUrl);

      // Stage 2: Document AI Processing (triggered automatically by Cloud Function)
      setProcessingStatus({
        stage: 'processing',
        progress: 45,
        message: 'Processing document with AI...'
      });

      // Wait for Document AI processing (simulated - in real app you'd use Firestore listeners)
      await new Promise(resolve => setTimeout(resolve, 3000));

      setProcessingStatus({
        stage: 'extracting',
        progress: 70,
        message: 'Extracting information from resume...'
      });

      // Wait for text extraction
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStatus({
        stage: 'embedding',
        progress: 85,
        message: 'Generating AI embeddings for matching...'
      });

      // Wait for embedding generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate extracted data (in real app, this would come from Firestore)
      const mockExtractedData = {
        name: candidateName || 'John Doe',
        email: candidateEmail || 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
        experience: [
          'Senior Software Engineer at Tech Company (2020-2023)',
          'Full Stack Developer at Startup Inc (2018-2020)',
          'Junior Developer at Small Business (2016-2018)'
        ],
        education: [
          'Bachelor of Science in Computer Science - University ABC (2016)',
          'Certified AWS Solutions Architect'
        ],
        summary: 'Experienced software engineer with expertise in full-stack development...'
      };

      setProcessingStatus({
        stage: 'complete',
        progress: 100,
        message: 'Resume processing complete!',
        extractedData: mockExtractedData
      });

      // Create job application if jobId is provided
      if (jobId && candidateName && candidateEmail) {
        await applicationService.create({
          jobId,
          candidateId: user.uid,
          candidateName,
          candidateEmail,
          resumeUrl: uploadedUrl,
          status: 'pending'
        });

        toast({
          title: "Application Submitted",
          description: "Your application has been submitted successfully",
        });
      }

      onUploadComplete?.(uploadedUrl, mockExtractedData);
      onProcessingComplete?.(mockExtractedData);

    } catch (error: any) {
      console.error('Resume processing error:', error);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: `Error: ${error.message || 'Failed to process resume'}`
      });

      toast({
        title: "Processing Failed",
        description: error.message || 'Failed to process resume',
        variant: "destructive"
      });
    }
  };

  const getStageIcon = () => {
    switch (processingStatus.stage) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'processing':
      case 'extracting':
      case 'embedding':
        return <Brain className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStageColor = () => {
    switch (processingStatus.stage) {
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
      case 'extracting':
      case 'embedding':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Resume Upload
        </CardTitle>
        <CardDescription>
          Upload your resume for automatic parsing and intelligent job matching
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        {!selectedFile && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop your resume here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOC, and DOCX files up to 10MB
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="resume-upload"
            />
            <Button asChild>
              <label htmlFor="resume-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        )}

        {/* Selected File Display */}
        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {resumeUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setProcessingStatus({
                    stage: 'idle',
                    progress: 0,
                    message: 'Ready to upload resume'
                  });
                  setResumeUrl(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStageIcon()}
              <span className={`font-medium ${getStageColor()}`}>
                {processingStatus.message}
              </span>
            </div>

            {processingStatus.stage !== 'idle' && processingStatus.stage !== 'error' && (
              <Progress value={processingStatus.progress} className="w-full" />
            )}

            {processingStatus.stage === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Processing Failed</AlertTitle>
                <AlertDescription>{processingStatus.message}</AlertDescription>
              </Alert>
            )}

            {processingStatus.stage === 'complete' && processingStatus.extractedData && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Processing Complete</AlertTitle>
                <AlertDescription>
                  Successfully extracted information from your resume
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Extracted Information Display */}
        {processingStatus.extractedData && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold">Extracted Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-2">Contact</h5>
                <p className="text-sm">{processingStatus.extractedData.name}</p>
                <p className="text-sm text-muted-foreground">{processingStatus.extractedData.email}</p>
              </div>
              
              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-2">
                  Skills ({processingStatus.extractedData.skills.length})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {processingStatus.extractedData.skills.slice(0, 6).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {processingStatus.extractedData.skills.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{processingStatus.extractedData.skills.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {selectedFile && processingStatus.stage === 'idle' && (
            <Button onClick={uploadAndProcessResume} className="flex-1">
              <Brain className="h-4 w-4 mr-2" />
              Process with AI
            </Button>
          )}
          
          {processingStatus.stage === 'complete' && jobId && (
            <Button className="flex-1" disabled>
              <CheckCircle className="h-4 w-4 mr-2" />
              Application Submitted
            </Button>
          )}
          
          {processingStatus.stage === 'error' && (
            <Button onClick={uploadAndProcessResume} variant="outline" className="flex-1">
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}