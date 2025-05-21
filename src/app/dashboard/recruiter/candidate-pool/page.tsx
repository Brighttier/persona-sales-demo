"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Filter, Mail, Search, UserPlus, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const mockCandidates = [
  { id: "cand1", name: "Alice Wonderland", role: "Software Engineer", experience: "5 Yrs", location: "Remote", skills: ["React", "Node.js", "AWS"], topSkill: "React", avatar: "https://placehold.co/100x100.png?text=AW", aiMatchScore: 92 },
  { id: "cand2", name: "Bob The Builder", role: "Product Manager", experience: "8 Yrs", location: "New York, NY", skills: ["Agile", "Roadmapping", "JIRA"], topSkill: "Agile", avatar: "https://placehold.co/100x100.png?text=BB", aiMatchScore: 85 },
  { id: "cand3", name: "Carol Danvers", role: "UX Designer", experience: "3 Yrs", location: "San Francisco, CA", skills: ["Figma", "Prototyping", "User Research"], topSkill: "Figma", avatar: "https://placehold.co/100x100.png?text=CD", aiMatchScore: 78 },
  { id: "cand4", name: "David Copperfield", role: "Data Scientist", experience: "6 Yrs", location: "Remote", skills: ["Python", "ML", "TensorFlow"], topSkill: "Python", avatar: "https://placehold.co/100x100.png?text=DC", aiMatchScore: 95 },
];

export default function CandidatePoolPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Candidate Pool</CardTitle>
          <CardDescription>Browse, filter, and discover talented individuals for your open roles.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-1">
            <label htmlFor="keywords" className="text-xs font-medium">Search by Name or Skills</label>
            <Input id="keywords" placeholder="e.g., Alice, React, Python..." />
          </div>
          <div className="space-y-1">
            <label htmlFor="roleFilter" className="text-xs font-medium">Filter by Role</label>
            <Select>
              <SelectTrigger id="roleFilter"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="swe">Software Engineer</SelectItem>
                <SelectItem value="pm">Product Manager</SelectItem>
                <SelectItem value="uxd">UX Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="flex gap-2">
            <Button className="flex-grow"><Search className="mr-2 h-4 w-4" /> Search</Button>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockCandidates.map((candidate) => (
          <Card key={candidate.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-2 ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
                <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional" />
                <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              <CardDescription>{candidate.role} - {candidate.experience}</CardDescription>
               <Badge variant="default" className="mt-1 bg-accent text-accent-foreground">
                <Star className="mr-1 h-3 w-3 fill-current" /> AI Match: {candidate.aiMatchScore}%
              </Badge>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-center">
              <p className="text-muted-foreground">{candidate.location}</p>
              <div className="pt-1">
                <p className="text-xs font-semibold mb-1">Top Skills:</p>
                <div className="flex flex-wrap justify-center gap-1">
                    {candidate.skills.slice(0,3).map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 3 && <Badge variant="outline">+{candidate.skills.length - 3} more</Badge>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 pt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/${user?.role}/candidates/${candidate.id}`}>
                  <Eye className="mr-1.5 h-4 w-4" /> View Profile
                </Link>
              </Button>
              <Button variant="default" size="sm">
                <Mail className="mr-1.5 h-4 w-4" /> Contact
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {mockCandidates.length === 0 && (
          <Card className="col-span-full text-center py-10">
            <CardContent>
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No candidates match your current filters.</p>
                <Button variant="link" className="mt-2">Clear Filters</Button>
            </CardContent>
          </Card>
        )}
        <div className="col-span-full flex justify-center mt-4">
            <Button variant="outline">Load More Candidates</Button>
        </div>
    </div>
  );
}
// Placeholder for individual candidate profile page: /dashboard/recruiter/candidates/[candidateId]/page.tsx
