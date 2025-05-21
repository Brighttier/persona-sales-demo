
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Filter, Mail, Search, UserPlus, ExternalLink, Star, Briefcase, MapPin, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const mockCandidates = [
  { id: "cand1", name: "Alice Wonderland", role: "Software Engineer", experience: "5 Yrs", location: "Remote", skills: ["React", "Node.js", "AWS", "TypeScript", "GraphQL"], topSkill: "React", avatar: "https://placehold.co/100x100.png?text=AW", aiMatchScore: 92, lastActive: "2 days ago", interestedIn: ["Frontend", "Full Stack"] },
  { id: "cand2", name: "Bob The Builder", role: "Product Manager", experience: "8 Yrs", location: "New York, NY", skills: ["Agile", "Roadmapping", "JIRA", "User Research"], topSkill: "Agile", avatar: "https://placehold.co/100x100.png?text=BB", aiMatchScore: 85, lastActive: "Online", interestedIn: ["Product Leadership"] },
  { id: "cand3", name: "Carol Danvers", role: "UX Designer", experience: "3 Yrs", location: "San Francisco, CA", skills: ["Figma", "Prototyping", "User Research", "Adobe XD"], topSkill: "Figma", avatar: "https://placehold.co/100x100.png?text=CD", aiMatchScore: 78, lastActive: "1 week ago", interestedIn: ["UI/UX Design", "Mobile Design"] },
  { id: "cand4", name: "David Copperfield", role: "Data Scientist", experience: "6 Yrs", location: "Remote", skills: ["Python", "ML", "TensorFlow", "SQL"], topSkill: "Python", avatar: "https://placehold.co/100x100.png?text=DC", aiMatchScore: 95, lastActive: "3 hours ago", interestedIn: ["Machine Learning", "AI Research"] },
];

export default function CandidatePoolPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const handleContact = (candidateName: string) => {
    toast({ title: "Contact Candidate", description: `Initiated contact with ${candidateName}. (Simulated)`});
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Talent Discovery</CardTitle>
          <CardDescription>Browse, filter, and discover talented individuals for your open roles.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t pt-6">
          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="keywords" className="text-xs font-medium text-muted-foreground">Search by Name, Skills, Role...</label>
            <Input id="keywords" placeholder="e.g., Alice, React, Product Manager..." />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="locationFilter" className="text-xs font-medium text-muted-foreground">Location</label>
            <Input id="locationFilter" placeholder="City or Remote" />
          </div>
           <div className="flex gap-2">
            <Button className="flex-grow"><Search className="mr-2 h-4 w-4" /> Search</Button>
            <Button variant="outline" size="icon" aria-label="Advanced Filters"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockCandidates.map((candidate) => (
          <Card key={candidate.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
            <CardHeader className="items-center text-center p-6 bg-secondary/30">
              <Avatar className="h-24 w-24 mb-3 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional" />
                <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{candidate.name}</CardTitle>
              <CardDescription className="text-primary">{candidate.role}</CardDescription>
               <Badge variant="default" className="mt-2 bg-accent text-accent-foreground font-semibold">
                <Star className="mr-1.5 h-3.5 w-3.5 fill-current" /> AI Match: {candidate.aiMatchScore}%
              </Badge>
            </CardHeader>
            <CardContent className="flex-grow p-6 space-y-3 text-sm">
              <div className="flex items-center text-muted-foreground"><Briefcase className="mr-2 h-4 w-4"/> Experience: {candidate.experience}</div>
              <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4"/> {candidate.location}</div>
              
              <div className="pt-1">
                <p className="text-xs font-semibold mb-1.5 text-muted-foreground">TOP SKILLS:</p>
                <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0,3).map(skill => (
                        <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 3 && <Badge variant="outline" className="font-normal">+{candidate.skills.length - 3} more</Badge>}
                </div>
              </div>
               <div className="pt-1">
                <p className="text-xs font-semibold mb-1.5 text-muted-foreground">INTERESTED IN:</p>
                <div className="flex flex-wrap gap-1.5">
                    {candidate.interestedIn.map(interest => (
                        <Badge key={interest} variant="outline" className="font-normal border-primary/50 text-primary/90">{interest}</Badge>
                    ))}
                </div>
              </div>
               <p className="text-xs text-muted-foreground text-right pt-2">Last active: {candidate.lastActive}</p>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 p-4 border-t">
              <Button variant="outline" size="sm" asChild>
                 {/* Link to a detailed candidate profile page, not built in this step */}
                <Link href={`/dashboard/${role}/candidate-pool`}>
                  <Eye className="mr-1.5 h-4 w-4" /> View Profile
                </Link>
              </Button>
              <Button variant="default" size="sm" onClick={() => handleContact(candidate.name)}>
                <Mail className="mr-1.5 h-4 w-4" /> Contact
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {mockCandidates.length === 0 && (
          <Card className="col-span-full text-center py-10 shadow-lg">
            <CardContent>
                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No candidates match your current filters.</p>
                <Button variant="link" className="mt-2">Clear Filters</Button>
            </CardContent>
          </Card>
        )}
        <div className="col-span-full flex justify-center mt-4">
            <Button variant="outline">Load More Candidates (Placeholder)</Button>
        </div>
    </div>
  );
}

    