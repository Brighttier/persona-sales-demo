import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Import Vertex AI for embeddings
const { TextServiceClient } = require("@google-cloud/aiplatform").v1beta1;

const storage = new Storage();
const documentaiClient = new DocumentProcessorServiceClient();
const firestore = new Firestore();
const textServiceClient = new TextServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
});

const projectId = process.env.GCP_PROJECT || '';
const location = 'us';
const resumeProcessorId = 'ce477c2c26f6cf38'; // Your resume processor ID

interface ResumeData {
  candidateId: string;
  filePath: string;
  rawText: string;
  processedText: string;
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
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced text preprocessing for better matching
function preprocessResumeText(rawText: string): { processedText: string; extractedFields: ResumeData['extractedFields'] } {
  // Clean and normalize text
  let processedText = rawText
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\.\,\;\:\-\(\)]/g, '') // Remove special characters except common punctuation
    .toLowerCase()
    .trim();

  // Extract key sections using regex patterns
  const extractedFields: ResumeData['extractedFields'] = {
    experience: [],
    skills: [],
    education: [],
    certifications: []
  };

  // Extract name (usually at the top)
  const nameMatch = rawText.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m);
  if (nameMatch) {
    extractedFields.name = nameMatch[1];
  }

  // Extract email
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    extractedFields.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = rawText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
    extractedFields.phone = phoneMatch[0];
  }

  // Extract experience section
  const experienceSection = extractSectionContent(rawText, ['experience', 'work history', 'employment', 'career']);
  if (experienceSection) {
    extractedFields.experience = extractBulletPoints(experienceSection);
  }

  // Extract skills section
  const skillsSection = extractSectionContent(rawText, ['skills', 'technical skills', 'competencies', 'technologies']);
  if (skillsSection) {
    extractedFields.skills = extractSkills(skillsSection);
  }

  // Extract education section
  const educationSection = extractSectionContent(rawText, ['education', 'academic background', 'qualifications']);
  if (educationSection) {
    extractedFields.education = extractBulletPoints(educationSection);
  }

  // Extract certifications
  const certificationsSection = extractSectionContent(rawText, ['certifications', 'certificates', 'licenses']);
  if (certificationsSection) {
    extractedFields.certifications = extractBulletPoints(certificationsSection);
  }

  // Extract summary/objective
  const summarySection = extractSectionContent(rawText, ['summary', 'objective', 'profile', 'overview']);
  if (summarySection) {
    extractedFields.summary = summarySection.substring(0, 500); // Limit length
  }

  // Create enhanced processed text that emphasizes key areas for matching
  processedText = createMatchingOptimizedText(extractedFields, processedText);

  return { processedText, extractedFields };
}

function extractSectionContent(text: string, sectionHeaders: string[]): string | null {
  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\b${header}\\b[:\\s]*([\\s\\S]*?)(?=\\n\\s*\\b(?:experience|education|skills|certifications|summary|objective|profile|contact|references)\\b|$)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractBulletPoints(section: string): string[] {
  const bullets = section
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 10) // Filter out short lines
    .slice(0, 10); // Limit to prevent too much noise
  
  return bullets;
}

function extractSkills(skillsSection: string): string[] {
  // Common skill patterns
  const skills: string[] = [];
  
  // Extract from comma-separated lists
  const commaSeparated = skillsSection.split(',').map(s => s.trim()).filter(s => s.length > 1);
  skills.push(...commaSeparated);
  
  // Extract from bullet points
  const bulletPoints = skillsSection.split(/[•\-\*]/).map(s => s.trim()).filter(s => s.length > 1);
  skills.push(...bulletPoints);
  
  // Extract programming languages, frameworks, tools
  const techSkills = skillsSection.match(/\b(?:JavaScript|Python|Java|React|Angular|Vue|Node\.js|AWS|Docker|Kubernetes|SQL|MongoDB|Git|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|HTML|CSS|SASS|Bootstrap|Tailwind|PostgreSQL|MySQL|Redis|GraphQL|REST|API|Microservices|DevOps|CI\/CD|Jenkins|GitHub|Agile|Scrum|Machine Learning|AI|Data Science|TensorFlow|PyTorch|Pandas|NumPy|Jupyter|Tableau|Power BI|Excel|Salesforce|HubSpot|Slack|Jira|Confluence|Figma|Adobe|Photoshop|Illustrator|WordPress|Drupal|Shopify|Firebase|Supabase|Vercel|Netlify|Heroku)\b/gi);
  
  if (techSkills) {
    skills.push(...techSkills);
  }
  
  // Remove duplicates and return top skills
  return [...new Set(skills)].slice(0, 20);
}

function createMatchingOptimizedText(fields: ResumeData['extractedFields'], originalText: string): string {
  // Weight different sections for better matching
  let optimizedText = '';
  
  // Skills get highest weight (repeated 3x)
  if (fields.skills.length > 0) {
    const skillsText = fields.skills.join(' ');
    optimizedText += `SKILLS: ${skillsText} ${skillsText} ${skillsText} `;
  }
  
  // Experience gets medium-high weight (repeated 2x)
  if (fields.experience.length > 0) {
    const experienceText = fields.experience.join(' ');
    optimizedText += `EXPERIENCE: ${experienceText} ${experienceText} `;
  }
  
  // Education gets medium weight
  if (fields.education.length > 0) {
    optimizedText += `EDUCATION: ${fields.education.join(' ')} `;
  }
  
  // Certifications get medium weight
  if (fields.certifications.length > 0) {
    optimizedText += `CERTIFICATIONS: ${fields.certifications.join(' ')} `;
  }
  
  // Summary gets lower weight
  if (fields.summary) {
    optimizedText += `SUMMARY: ${fields.summary} `;
  }
  
  // Add original text with lower weight
  optimizedText += originalText;
  
  return optimizedText;
}

// Enhanced embedding generation with better preprocessing
async function generateEnhancedEmbeddings(
  processedText: string, 
  filePath: string, 
  candidateId: string,
  extractedFields: ResumeData['extractedFields']
): Promise<void> {
  console.log('Generating enhanced embeddings for resume...');

  const model = `projects/${projectId}/locations/us-central1/endpoints/text-embeddings-preview@005`;

  try {
    const [response] = await textServiceClient.embedText({
      endpoint: `projects/${projectId}/locations/us-central1`,
      model: model,
      content: { content: processedText },
    });

    const embeddings = response.embeddings;

    if (embeddings && embeddings.length > 0) {
      const embeddingVector = embeddings[0].values;

      console.log('Enhanced embeddings generated successfully.');

      // Save to Firestore with enhanced metadata
      const resumeData: ResumeData = {
        candidateId,
        filePath,
        rawText: processedText, // Store processed text for debugging
        processedText,
        extractedFields,
        embedding: embeddingVector,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestore.collection('resumeEmbeddings').add(resumeData);
      console.log('Enhanced resume data saved to Firestore.');

    } else {
      console.log('No embeddings generated.');
    }

  } catch (error) {
    console.error('Error generating enhanced embeddings:', error);
    throw error;
  }
}

export const processResumeEnhanced = onObjectFinalized(async (event) => {
  const object = event.data;

  if (!object) {
    console.error('No object metadata found in the event.');
    return null;
  }

  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;

  // Enhanced file type support
  const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!filePath || filePath.endsWith('/') || !contentType || !supportedTypes.includes(contentType)) {
    console.log('Not a supported file type or a directory. Exiting.');
    return null;
  }

  const watchPath = 'resumes/';
  if (!filePath.startsWith(watchPath)) {
    console.log('File is not in the watched path. Exiting.');
    return null;
  }

  // Extract candidate ID from file path (assuming format: resumes/{candidateId}/{filename})
  const pathParts = filePath.split('/');
  const candidateId = pathParts[1] || uuidv4();

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(filePath);

  try {
    const [content] = await file.download();
    const name = `projects/${projectId}/locations/${location}/processors/${resumeProcessorId}`;

    const request = {
      name,
      rawDocument: {
        content: content.toString('base64'),
        mimeType: contentType,
      },
    };

    console.log('Processing document with Document AI...');
    const [result] = await documentaiClient.processDocument(request);
    const { document } = result;

    if (document && document.text) {
      const rawText = document.text;
      console.log('Text extracted successfully. Length:', rawText.length);

      // Enhanced preprocessing
      const { processedText, extractedFields } = preprocessResumeText(rawText);
      
      console.log('Extracted fields:', {
        name: extractedFields.name,
        email: extractedFields.email,
        skillsCount: extractedFields.skills.length,
        experienceCount: extractedFields.experience.length,
        educationCount: extractedFields.education.length
      });

      // Save processed text to storage
      const fileName = path.basename(filePath);
      const outputFileName = `${path.parse(fileName).name}_processed.txt`;
      const outputFilePath = `parsed_resumes/${candidateId}/${outputFileName}`;

      const outputFile = bucket.file(outputFilePath);
      await outputFile.save(JSON.stringify({
        rawText,
        processedText,
        extractedFields
      }, null, 2));

      console.log(`Processed resume data saved to gs://${fileBucket}/${outputFilePath}`);

      // Generate enhanced embeddings
      await generateEnhancedEmbeddings(processedText, filePath, candidateId, extractedFields);

      return null;

    } else {
      console.log('No text extracted from the document.');
      return null;
    }

  } catch (error) {
    console.error('Error processing resume with enhanced Document AI:', error);
    return null;
  }
});