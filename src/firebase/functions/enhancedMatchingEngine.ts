import * as functions from 'firebase-functions';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  experience: {
    minimumYears?: number;
    level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    domains: string[];
  };
  education: {
    required?: boolean;
    level: 'high-school' | 'associates' | 'bachelors' | 'masters' | 'phd';
    fields?: string[];
  };
  certifications?: string[];
}

interface CandidateProfile {
  candidateId: string;
  embedding: number[];
  extractedFields: {
    name?: string;
    email?: string;
    phone?: string;
    experience: string[];
    skills: string[];
    education: string[];
    certifications: string[];
    summary?: string;
  };
  processedText: string;
}

interface MatchScore {
  candidateId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;
  breakdown: {
    requiredSkillsMatched: string[];
    preferredSkillsMatched: string[];
    missingRequiredSkills: string[];
    experienceLevel: string;
    educationLevel: string;
    additionalStrengths: string[];
  };
}

// Enhanced cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// Parse job description to extract requirements
function parseJobRequirements(jobDescription: string): JobRequirements {
  const text = jobDescription.toLowerCase();
  
  // Extract skills using comprehensive patterns
  const skillPatterns = [
    // Programming languages
    /\b(?:javascript|python|java|react|angular|vue|node\.js|aws|docker|kubernetes|sql|mongodb|git|typescript|c\+\+|c#|php|ruby|go|rust|swift|kotlin|html|css|sass|bootstrap|tailwind|postgresql|mysql|redis|graphql|rest|api|microservices|devops|ci\/cd|jenkins|github)\b/gi,
    // Frameworks and tools
    /\b(?:express|django|flask|spring|laravel|rails|tensorflow|pytorch|pandas|numpy|jupyter|tableau|power bi|excel|salesforce|hubspot|slack|jira|confluence|figma|adobe|photoshop|illustrator|wordpress|drupal|shopify|firebase|supabase|vercel|netlify|heroku)\b/gi,
    // Soft skills
    /\b(?:leadership|communication|teamwork|problem.solving|analytical|creative|project.management|agile|scrum|strategic.thinking|customer.service|sales|marketing|business.development)\b/gi
  ];

  const allSkills: string[] = [];
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      allSkills.push(...matches);
    }
  });

  // Determine required vs preferred skills
  const requiredIndicators = /\b(?:required|must have|essential|mandatory|need|necessary)\b/gi;
  const preferredIndicators = /\b(?:preferred|nice to have|bonus|plus|desired|advantageous)\b/gi;

  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];

  // Simple heuristic: if mentioned with required indicators, it's required
  allSkills.forEach(skill => {
    const skillContext = getSkillContext(text, skill);
    if (requiredIndicators.test(skillContext)) {
      requiredSkills.push(skill);
    } else if (preferredIndicators.test(skillContext)) {
      preferredSkills.push(skill);
    } else {
      // Default to required if no clear indicator
      requiredSkills.push(skill);
    }
  });

  // Extract experience requirements
  const experienceMatch = text.match(/(\d+)[\+\-\s]*(?:years?|yrs?).*(?:experience|exp)/i);
  const minimumYears = experienceMatch ? parseInt(experienceMatch[1]) : undefined;

  let experienceLevel: JobRequirements['experience']['level'] = 'mid';
  if (minimumYears) {
    if (minimumYears <= 2) experienceLevel = 'entry';
    else if (minimumYears <= 5) experienceLevel = 'mid';
    else if (minimumYears <= 8) experienceLevel = 'senior';
    else if (minimumYears <= 12) experienceLevel = 'lead';
    else experienceLevel = 'executive';
  }

  // Extract education requirements
  const educationRequired = /\b(?:degree|bachelor|master|phd|education).*(?:required|mandatory|must)\b/i.test(text);
  let educationLevel: JobRequirements['education']['level'] = 'bachelors';
  
  if (/\b(?:phd|doctorate)\b/i.test(text)) educationLevel = 'phd';
  else if (/\b(?:master|mba)\b/i.test(text)) educationLevel = 'masters';
  else if (/\b(?:bachelor|degree)\b/i.test(text)) educationLevel = 'bachelors';
  else if (/\b(?:associate)\b/i.test(text)) educationLevel = 'associates';

  return {
    requiredSkills: [...new Set(requiredSkills)],
    preferredSkills: [...new Set(preferredSkills)],
    experience: {
      minimumYears,
      level: experienceLevel,
      domains: extractDomains(text)
    },
    education: {
      required: educationRequired,
      level: educationLevel,
      fields: extractEducationFields(text)
    },
    certifications: extractCertifications(text)
  };
}

function getSkillContext(text: string, skill: string): string {
  const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
  if (skillIndex === -1) return '';
  
  const start = Math.max(0, skillIndex - 100);
  const end = Math.min(text.length, skillIndex + skill.length + 100);
  
  return text.substring(start, end);
}

function extractDomains(text: string): string[] {
  const domains = [];
  const domainPatterns = [
    /\b(?:fintech|finance|banking|healthcare|medical|e-commerce|retail|education|edtech|gaming|entertainment|automotive|aerospace|energy|real estate|insurance|legal|government|non-profit|startup|enterprise|saas|b2b|b2c)\b/gi
  ];

  domainPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      domains.push(...matches);
    }
  });

  return [...new Set(domains)];
}

function extractEducationFields(text: string): string[] {
  const fields = [];
  const fieldPatterns = [
    /\b(?:computer science|software engineering|electrical engineering|mechanical engineering|business|marketing|finance|economics|mathematics|statistics|data science|psychology|design|arts|communications|english|biology|chemistry|physics|medicine|law)\b/gi
  ];

  fieldPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      fields.push(...matches);
    }
  });

  return [...new Set(fields)];
}

function extractCertifications(text: string): string[] {
  const certifications = [];
  const certPatterns = [
    /\b(?:aws|azure|gcp|pmp|scrum master|agile|cissp|cisa|cism|comptia|cisco|microsoft|google|oracle|salesforce|hubspot)\b/gi
  ];

  certPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      certifications.push(...matches);
    }
  });

  return [...new Set(certifications)];
}

// Calculate detailed skills matching score
function calculateSkillsScore(
  candidateSkills: string[], 
  jobRequirements: JobRequirements
): { score: number; breakdown: { requiredMatched: string[]; preferredMatched: string[]; missing: string[] } } {
  
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
  
  // Check required skills
  const requiredMatched: string[] = [];
  const missingRequired: string[] = [];
  
  jobRequirements.requiredSkills.forEach(skill => {
    const isMatch = candidateSkillsLower.some(candidateSkill => 
      candidateSkill.includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(candidateSkill) ||
      areSimilarSkills(skill, candidateSkill)
    );
    
    if (isMatch) {
      requiredMatched.push(skill);
    } else {
      missingRequired.push(skill);
    }
  });

  // Check preferred skills
  const preferredMatched: string[] = [];
  
  jobRequirements.preferredSkills.forEach(skill => {
    const isMatch = candidateSkillsLower.some(candidateSkill => 
      candidateSkill.includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(candidateSkill) ||
      areSimilarSkills(skill, candidateSkill)
    );
    
    if (isMatch) {
      preferredMatched.push(skill);
    }
  });

  // Calculate score: 70% weight on required skills, 30% on preferred
  const requiredScore = jobRequirements.requiredSkills.length > 0 
    ? (requiredMatched.length / jobRequirements.requiredSkills.length) 
    : 1;
    
  const preferredScore = jobRequirements.preferredSkills.length > 0 
    ? (preferredMatched.length / jobRequirements.preferredSkills.length) 
    : 0;

  const overallScore = (requiredScore * 0.7) + (preferredScore * 0.3);

  return {
    score: Math.min(1, overallScore), // Cap at 1.0
    breakdown: {
      requiredMatched,
      preferredMatched,
      missing: missingRequired
    }
  };
}

// Check if two skills are similar (e.g., "React" and "ReactJS")
function areSimilarSkills(skill1: string, skill2: string): boolean {
  const similarityMap: { [key: string]: string[] } = {
    'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
    'typescript': ['ts'],
    'react': ['reactjs', 'react.js'],
    'node.js': ['nodejs', 'node'],
    'python': ['py'],
    'postgresql': ['postgres'],
    'mongodb': ['mongo'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud platform'],
    'azure': ['microsoft azure']
  };

  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();

  // Check if they're in the similarity map
  for (const [base, alternatives] of Object.entries(similarityMap)) {
    if ((s1 === base && alternatives.includes(s2)) || 
        (s2 === base && alternatives.includes(s1)) ||
        (alternatives.includes(s1) && alternatives.includes(s2))) {
      return true;
    }
  }

  return false;
}

// Calculate experience matching score
function calculateExperienceScore(candidateExperience: string[], jobRequirements: JobRequirements): number {
  const experienceText = candidateExperience.join(' ').toLowerCase();
  
  let score = 0.5; // Base score
  
  // Check for experience level indicators
  const seniorIndicators = ['senior', 'lead', 'principal', 'architect', 'manager', 'director'];
  const midIndicators = ['developer', 'engineer', 'analyst', 'specialist'];
  const entryIndicators = ['junior', 'intern', 'entry', 'trainee', 'graduate'];
  
  const hasSenior = seniorIndicators.some(indicator => experienceText.includes(indicator));
  const hasMid = midIndicators.some(indicator => experienceText.includes(indicator));
  const hasEntry = entryIndicators.some(indicator => experienceText.includes(indicator));
  
  // Match against job requirements
  switch (jobRequirements.experience.level) {
    case 'entry':
      score = hasEntry ? 1.0 : (hasMid ? 0.8 : (hasSenior ? 0.6 : 0.4));
      break;
    case 'mid':
      score = hasMid ? 1.0 : (hasSenior ? 0.9 : (hasEntry ? 0.7 : 0.5));
      break;
    case 'senior':
      score = hasSenior ? 1.0 : (hasMid ? 0.7 : 0.4);
      break;
    case 'lead':
    case 'executive':
      score = hasSenior ? 0.9 : (hasMid ? 0.5 : 0.3);
      break;
  }
  
  // Check domain experience
  if (jobRequirements.experience.domains.length > 0) {
    const domainMatches = jobRequirements.experience.domains.filter(domain =>
      experienceText.includes(domain.toLowerCase())
    );
    const domainScore = domainMatches.length / jobRequirements.experience.domains.length;
    score = (score * 0.7) + (domainScore * 0.3);
  }
  
  return Math.min(1, score);
}

// Calculate education matching score
function calculateEducationScore(candidateEducation: string[], jobRequirements: JobRequirements): number {
  if (!jobRequirements.education.required) {
    return 1.0; // No education required, full score
  }
  
  const educationText = candidateEducation.join(' ').toLowerCase();
  
  // Check for degree level
  const hasPhd = /\b(?:phd|doctorate|doctoral)\b/.test(educationText);
  const hasMasters = /\b(?:master|mba|ms|ma)\b/.test(educationText);
  const hasBachelors = /\b(?:bachelor|bs|ba|degree)\b/.test(educationText);
  const hasAssociates = /\b(?:associate|aa|as)\b/.test(educationText);
  
  let levelScore = 0;
  
  switch (jobRequirements.education.level) {
    case 'high-school':
      levelScore = 1.0; // Anyone with any degree qualifies
      break;
    case 'associates':
      levelScore = hasAssociates || hasBachelors || hasMasters || hasPhd ? 1.0 : 0.5;
      break;
    case 'bachelors':
      levelScore = hasBachelors || hasMasters || hasPhd ? 1.0 : (hasAssociates ? 0.7 : 0.4);
      break;
    case 'masters':
      levelScore = hasMasters || hasPhd ? 1.0 : (hasBachelors ? 0.8 : 0.5);
      break;
    case 'phd':
      levelScore = hasPhd ? 1.0 : (hasMasters ? 0.7 : 0.5);
      break;
  }
  
  // Check field alignment
  if (jobRequirements.education.fields && jobRequirements.education.fields.length > 0) {
    const fieldMatches = jobRequirements.education.fields.filter(field =>
      educationText.includes(field.toLowerCase())
    );
    const fieldScore = fieldMatches.length / jobRequirements.education.fields.length;
    levelScore = (levelScore * 0.7) + (fieldScore * 0.3);
  }
  
  return Math.min(1, levelScore);
}

// Main enhanced matching function
export const enhancedMatchCandidatesToJob = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const { jobId, jobDescription, candidateIds } = data;

  if (!jobId || !jobDescription) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId and jobDescription are required.');
  }

  try {
    // Parse job requirements
    const jobRequirements = parseJobRequirements(jobDescription);
    console.log('Parsed job requirements:', jobRequirements);

    // Get job embedding
    const jobEmbeddingSnapshot = await firestore.collection('jobDescriptionEmbeddings')
      .where('filePath', '==', `job_descriptions/${jobId}.pdf`)
      .limit(1)
      .get();

    if (jobEmbeddingSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', `Job description embedding not found for jobId: ${jobId}`);
    }

    const jobEmbeddingData = jobEmbeddingSnapshot.docs[0].data();
    const jobEmbeddingVector = jobEmbeddingData.embedding;

    // Get candidate embeddings
    let candidateQuery = firestore.collection('resumeEmbeddings');
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      candidateQuery = candidateQuery.where('candidateId', 'in', candidateIds);
    }

    const candidatesSnapshot = await candidateQuery.get();

    if (candidatesSnapshot.empty) {
      return { results: [] };
    }

    // Calculate enhanced match scores
    const matchScores: MatchScore[] = [];

    for (const doc of candidatesSnapshot.docs) {
      const candidateData = doc.data() as CandidateProfile;
      
      if (!candidateData.embedding || !candidateData.extractedFields) {
        console.warn(`Incomplete candidate data for ${candidateData.candidateId}`);
        continue;
      }

      // Calculate semantic similarity
      const semanticScore = cosineSimilarity(jobEmbeddingVector, candidateData.embedding);

      // Calculate structured scores
      const skillsResult = calculateSkillsScore(candidateData.extractedFields.skills, jobRequirements);
      const experienceScore = calculateExperienceScore(candidateData.extractedFields.experience, jobRequirements);
      const educationScore = calculateEducationScore(candidateData.extractedFields.education, jobRequirements);

      // Calculate weighted overall score
      const overallScore = (
        skillsResult.score * 0.4 +        // 40% skills
        experienceScore * 0.25 +          // 25% experience
        educationScore * 0.15 +           // 15% education
        semanticScore * 0.2               // 20% semantic similarity
      );

      const matchScore: MatchScore = {
        candidateId: candidateData.candidateId,
        overallScore,
        skillsScore: skillsResult.score,
        experienceScore,
        educationScore,
        semanticScore,
        breakdown: {
          requiredSkillsMatched: skillsResult.breakdown.requiredMatched,
          preferredSkillsMatched: skillsResult.breakdown.preferredMatched,
          missingRequiredSkills: skillsResult.breakdown.missing,
          experienceLevel: determineExperienceLevel(candidateData.extractedFields.experience),
          educationLevel: determineEducationLevel(candidateData.extractedFields.education),
          additionalStrengths: findAdditionalStrengths(candidateData.extractedFields, jobRequirements)
        }
      };

      matchScores.push(matchScore);
    }

    // Sort by overall score
    matchScores.sort((a, b) => b.overallScore - a.overallScore);

    return { 
      results: matchScores,
      jobRequirements,
      totalCandidates: matchScores.length
    };

  } catch (error: any) {
    console.error('Enhanced matching error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Matching engine error', error.message);
  }
});

function determineExperienceLevel(experience: string[]): string {
  const experienceText = experience.join(' ').toLowerCase();
  
  if (/\b(?:senior|lead|principal|architect|manager|director)\b/.test(experienceText)) {
    return 'Senior Level';
  } else if (/\b(?:developer|engineer|analyst|specialist)\b/.test(experienceText)) {
    return 'Mid Level';
  } else if (/\b(?:junior|intern|entry|trainee|graduate)\b/.test(experienceText)) {
    return 'Entry Level';
  }
  
  return 'Level Not Determined';
}

function determineEducationLevel(education: string[]): string {
  const educationText = education.join(' ').toLowerCase();
  
  if (/\b(?:phd|doctorate|doctoral)\b/.test(educationText)) {
    return 'Doctorate';
  } else if (/\b(?:master|mba|ms|ma)\b/.test(educationText)) {
    return 'Masters';
  } else if (/\b(?:bachelor|bs|ba|degree)\b/.test(educationText)) {
    return 'Bachelors';
  } else if (/\b(?:associate|aa|as)\b/.test(educationText)) {
    return 'Associates';
  }
  
  return 'Education Not Specified';
}

function findAdditionalStrengths(candidateFields: CandidateProfile['extractedFields'], jobRequirements: JobRequirements): string[] {
  const strengths: string[] = [];
  
  // Find skills that exceed requirements
  const allJobSkills = [...jobRequirements.requiredSkills, ...jobRequirements.preferredSkills];
  const additionalSkills = candidateFields.skills.filter(skill => 
    !allJobSkills.some(jobSkill => 
      skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  if (additionalSkills.length > 0) {
    strengths.push(`Additional technical skills: ${additionalSkills.slice(0, 5).join(', ')}`);
  }
  
  // Check for certifications
  if (candidateFields.certifications && candidateFields.certifications.length > 0) {
    strengths.push(`Professional certifications: ${candidateFields.certifications.join(', ')}`);
  }
  
  return strengths;
}