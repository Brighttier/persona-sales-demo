import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CalendarDays, DollarSign, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock job data for a single job
const jobDetail = {
  id: "1",
  title: "Software Engineer, Frontend",
  company: "Tech Solutions Inc.",
  companyLogo: "https://placehold.co/100x100.png",
  companyDescription: "Tech Solutions Inc. is a leading provider of innovative software solutions for businesses worldwide. We foster a collaborative and growth-oriented environment.",
  location: "Remote",
  type: "Full-time",
  postedDate: "2024-07-20",
  salaryRange: "$90,000 - $120,000 per year",
  teamSize: "10-15 engineers",
  description: "We are seeking a skilled Frontend Software Engineer to join our dynamic team. You will be responsible for developing and maintaining user-facing features using modern web technologies. This role offers an excellent opportunity to work on challenging projects and contribute to impactful products.",
  responsibilities: [
    "Develop new user-facing features using React, Next.js, and TypeScript.",
    "Build reusable code and libraries for future use.",
    "Ensure the technical feasibility of UI/UX designs.",
    "Optimize applications for maximum speed and scalability.",
    "Collaborate with other team members and stakeholders."
  ],
  qualifications: [
    "Bachelor's degree in Computer Science or related field.",
    "3+ years of experience in frontend development.",
    "Proficiency in JavaScript, HTML, CSS, React, and Next.js.",
    "Experience with TypeScript and state management libraries (e.g., Redux, Zustand).",
    "Strong understanding of RESTful APIs and version control (Git).",
    "Excellent problem-solving and communication skills."
  ],
  skills: ["React", "TypeScript", "Next.js", "JavaScript", "HTML", "CSS", "Git", "REST APIs"],
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch job details based on params.id
  // For now, we use the mock data if params.id matches, or show a generic message.
  const job = jobDetail.id === params.id ? jobDetail : null;

  if (!job) {
    return <div className="text-center py-10">Job not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold mb-1">{job.title}</CardTitle>
              <Link href="#" className="text-lg text-primary hover:underline">{job.company}</Link>
            </div>
             <Image src={job.companyLogo} alt={`${job.company} Logo`} width={80} height={80} className="rounded-md border" data-ai-hint="company logo" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
            <div className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> {job.location}</div>
            <div className="flex items-center"><Briefcase className="mr-1.5 h-4 w-4" /> {job.type}</div>
            <div className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Posted: {job.postedDate}</div>
            {job.salaryRange && <div className="flex items-center"><DollarSign className="mr-1.5 h-4 w-4" /> {job.salaryRange}</div>}
             {job.teamSize && <div className="flex items-center"><Users className="mr-1.5 h-4 w-4" /> Team Size: {job.teamSize}</div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Job Description</h3>
            <p className="text-foreground/80 whitespace-pre-line">{job.description}</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              {job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Qualifications</h3>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              {job.qualifications.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <Badge key={skill} variant="default">{skill}</Badge>
              ))}
            </div>
          </div>

           <div>
            <h3 className="text-xl font-semibold mb-2">About {job.company}</h3>
            <p className="text-foreground/80 whitespace-pre-line">{job.companyDescription}</p>
          </div>

          <div className="pt-6 text-center">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href={`/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

//This will make sure all job listing pages are generated at build time
// export async function generateStaticParams() {
//   // const jobs = await fetch('...').then((res) => res.json()) // Fetch all job IDs
//   // For demo, using the mock jobListings from the board page
//   const jobListings = [
//     { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" },
//   ];
//   return jobListings.map((job) => ({
//     id: job.id,
//   }))
// }
