
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Filter, Mail, Search, UserPlus, ExternalLink, Star, Briefcase, MapPin, Users as UsersIcon, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const mockCandidates = [
  { id: "cand1", name: "Alice Wonderland", role: "Software Engineer", experience: "5 Yrs", location: "Remote", skills: ["React", "Node.js", "AWS", "TypeScript", "GraphQL"], topSkill: "React", avatar: "https://placehold.co/100x100.png?text=AW", aiMatchScore: 92, lastActive: "2 days ago", interestedIn: ["Frontend", "Full Stack"] },
  { id: "cand2", name: "Bob The Builder", role: "Product Manager", experience: "8 Yrs", location: "New York, NY", skills: ["Agile", "Roadmapping", "JIRA", "User Research"], topSkill: "Agile", avatar: "https://placehold.co/100x100.png?text=BB", aiMatchScore: 85, lastActive: "Online", interestedIn: ["Product Leadership"] },
  { id: "cand3", name: "Carol Danvers", role: "UX Designer", experience: "3 Yrs", location: "San Francisco, CA", skills: ["Figma", "Prototyping", "User Research", "Adobe XD"], topSkill: "Figma", avatar: "https://placehold.co/100x100.png?text=CD", aiMatchScore: 78, lastActive: "1 week ago", interestedIn: ["UI/UX Design", "Mobile Design"] },
  { id: "cand4", name: "David Copperfield", role: "Data Scientist", experience: "6 Yrs", location: "Remote", skills: ["Python", "ML", "TensorFlow", "SQL"], topSkill: "Python", avatar: "https://placehold.co/100x100.png?text=DC", aiMatchScore: 95, lastActive: "3 hours ago", interestedIn: ["Machine Learning", "AI Research"] },
];

export default function CandidatePoolPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const handleContact = (candidateName: string) => {
    toast({ title: "Contact Candidate", description: `Initiated contact with ${candidateName}. (Simulated)`});
  }

  const renderCardView = () => (
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
              <Link href={`/dashboard/${role}/candidate-profile/${candidate.id}`}>
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
  );

  const renderListView = () => (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Top Skills</TableHead>
              <TableHead>AI Match</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional"/>
                      <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground">{candidate.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{candidate.experience}</TableCell>
                <TableCell>{candidate.location}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map(skill => (
                      <Badge key={skill} variant="secondary" className="font-normal text-xs">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 2 && <Badge variant="outline" className="font-normal text-xs">+{candidate.skills.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="default" className={cn("font-semibold", candidate.aiMatchScore > 80 ? "bg-green-100 text-green-700 border-green-300" : "bg-yellow-100 text-yellow-700 border-yellow-300")}>
                    <Star className="mr-1 h-3 w-3 fill-current" />{candidate.aiMatchScore}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild className="mr-1">
                    <Link href={`/dashboard/${role}/candidate-profile/${candidate.id}`}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleContact(candidate.name)}>
                    <Mail className="mr-1 h-3.5 w-3.5" /> Contact
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Talent Discovery</CardTitle>
            <CardDescription>Browse, filter, and discover talented individuals for your open roles.</CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('card')}>
              <LayoutGrid className="mr-2 h-4 w-4"/> Card View
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="mr-2 h-4 w-4"/> List View
            </Button>
          </div>
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

      {viewMode === 'card' ? renderCardView() : renderListView()}
      
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
