
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Filter, Mail, Search, UserPlus, ExternalLink, Star, Briefcase, MapPin, Users as UsersIcon, LayoutGrid, List, FolderPlus, Folder, MoveUpRight, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Candidate {
  id: string;
  name: string;
  role: string;
  experience: string;
  location: string;
  skills: string[];
  topSkill: string;
  avatar: string;
  aiMatchScore: number;
  lastActive: string;
  interestedIn: string[];
}

const allMockCandidates: Candidate[] = [
  { id: "cand1", name: "Alice Wonderland", role: "Software Engineer", experience: "5 Yrs", location: "Remote", skills: ["React", "Node.js", "AWS", "TypeScript", "GraphQL"], topSkill: "React", avatar: "https://placehold.co/100x100.png?text=AW", aiMatchScore: 92, lastActive: "2 days ago", interestedIn: ["Frontend", "Full Stack"] },
  { id: "cand2", name: "Bob The Builder", role: "Product Manager", experience: "8 Yrs", location: "New York, NY", skills: ["Agile", "Roadmapping", "JIRA", "User Research"], topSkill: "Agile", avatar: "https://placehold.co/100x100.png?text=BB", aiMatchScore: 85, lastActive: "Online", interestedIn: ["Product Leadership"] },
  { id: "cand3", name: "Carol Danvers", role: "UX Designer", experience: "3 Yrs", location: "San Francisco, CA", skills: ["Figma", "Prototyping", "User Research", "Adobe XD"], topSkill: "Figma", avatar: "https://placehold.co/100x100.png?text=CD", aiMatchScore: 78, lastActive: "1 week ago", interestedIn: ["UI/UX Design", "Mobile Design"] },
  { id: "cand4", name: "David Copperfield", role: "Data Scientist", experience: "6 Yrs", location: "Remote", skills: ["Python", "ML", "TensorFlow", "SQL"], topSkill: "Python", avatar: "https://placehold.co/100x100.png?text=DC", aiMatchScore: 95, lastActive: "3 hours ago", interestedIn: ["Machine Learning", "AI Research"] },
  { id: "cand5", name: "Edward Norton", role: "Backend Engineer", experience: "7 Yrs", location: "Austin, TX", skills: ["Java", "Spring Boot", "Kafka", "Microservices"], topSkill: "Java", avatar: "https://placehold.co/100x100.png?text=EN", aiMatchScore: 88, lastActive: "5 days ago", interestedIn: ["Backend Architecture", "Distributed Systems"] },
  { id: "cand6", name: "Fiona Gallagher", role: "DevOps Engineer", experience: "4 Yrs", location: "Remote", skills: ["Kubernetes", "Docker", "AWS", "Terraform"], topSkill: "Kubernetes", avatar: "https://placehold.co/100x100.png?text=FG", aiMatchScore: 90, lastActive: "Yesterday", interestedIn: ["Cloud Infrastructure", "CI/CD"] },
  { id: "cand7", name: "George Costanza", role: "QA Analyst", experience: "2 Yrs", location: "New York, NY", skills: ["Selenium", "JIRA", "Test Planning", "API Testing"], topSkill: "Selenium", avatar: "https://placehold.co/100x100.png?text=GC", aiMatchScore: 75, lastActive: "3 weeks ago", interestedIn: ["Automation Testing", "Quality Assurance"] },
];

const INITIAL_CANDIDATES_TO_SHOW = 4;
const CANDIDATES_INCREMENT_COUNT = 2;

export default function CandidatePoolPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const [displayedCandidates, setDisplayedCandidates] = useState<Candidate[]>([]);
  const [visibleCandidatesCount, setVisibleCandidatesCount] = useState(INITIAL_CANDIDATES_TO_SHOW);

  const [folders, setFolders] = useState<string[]>(["Shortlisted - Engineering", "Future Prospects", "Tech Review Pending", "Not a Fit"]);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isMoveToFolderDialogOpen, setIsMoveToFolderDialogOpen] = useState(false);
  const [selectedCandidateForFolderMove, setSelectedCandidateForFolderMove] = useState<Candidate | null>(null);
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<string>("");


  useEffect(() => {
    setDisplayedCandidates(allMockCandidates.slice(0, INITIAL_CANDIDATES_TO_SHOW));
  }, []);

  const handleLoadMoreCandidates = () => {
    const newVisibleCount = Math.min(visibleCandidatesCount + CANDIDATES_INCREMENT_COUNT, allMockCandidates.length);
    setVisibleCandidatesCount(newVisibleCount);
    setDisplayedCandidates(allMockCandidates.slice(0, newVisibleCount));
  };

  const handleContact = (candidateName: string) => {
    toast({ title: "Contact Candidate", description: `Initiated contact with ${candidateName}. (Simulated)`});
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() === "") {
      toast({ variant: "destructive", title: "Error", description: "Folder name cannot be empty." });
      return;
    }
    if (folders.includes(newFolderName.trim())) {
       toast({ variant: "destructive", title: "Error", description: "Folder with this name already exists." });
      return;
    }
    setFolders(prev => [...prev, newFolderName.trim()]);
    toast({ title: "Folder Created (Placeholder)", description: `Folder "${newFolderName.trim()}" added.` });
    setNewFolderName("");
    setIsCreateFolderDialogOpen(false);
  };

  const openMoveToFolderDialog = (candidate: Candidate) => {
    setSelectedCandidateForFolderMove(candidate);
    setSelectedFolderForMove("");
    setIsMoveToFolderDialogOpen(true);
  };

  const handleMoveCandidateToFolder = () => {
    if (!selectedCandidateForFolderMove || !selectedFolderForMove) {
      toast({ variant: "destructive", title: "Error", description: "Please select a candidate and a folder." });
      return;
    }
    toast({ title: "Candidate Moved (Placeholder)", description: `${selectedCandidateForFolderMove.name} moved to folder "${selectedFolderForMove}".` });
    setIsMoveToFolderDialogOpen(false);
    setSelectedCandidateForFolderMove(null);
  };

  const renderCandidateActions = (candidate: Candidate) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 data-[state=open]:bg-muted">
          <MoveUpRight className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/${role}/candidate-profile/${candidate.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleContact(candidate.name)}>
          <Mail className="mr-2 h-4 w-4" /> Contact Candidate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openMoveToFolderDialog(candidate)}>
          <Folder className="mr-2 h-4 w-4" /> Move to Folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast({ title: "Action: Remove (Placeholder)", description: `Candidate ${candidate.name} would be removed.`})}>
          <Trash2 className="mr-2 h-4 w-4" /> Remove from Pool
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayedCandidates.map((candidate) => (
        <Card key={candidate.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
          <CardHeader className="items-center text-center p-6 bg-secondary/30">
            <div className="relative">
                <Avatar className="h-24 w-24 mb-3 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional" />
                <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                 <div className="absolute top-1 right-1">
                    {renderCandidateActions(candidate)}
                </div>
            </div>
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
                      <Badge key={skill} variant="default" className="font-normal">{skill}</Badge>
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
          <CardFooter className="p-4 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleContact(candidate.name)}>
              <Mail className="mr-1.5 h-4 w-4" /> Contact Candidate
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
            {displayedCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={candidate.avatar} alt={candidate.name} data-ai-hint="person professional"/>
                      <AvatarFallback>{candidate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/dashboard/${role}/candidate-profile/${candidate.id}`} className="font-medium hover:underline text-primary">{candidate.name}</Link>
                      <div className="text-xs text-muted-foreground">{candidate.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{candidate.experience}</TableCell>
                <TableCell>{candidate.location}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map(skill => (
                      <Badge key={skill} variant="default" className="font-normal text-xs">{skill}</Badge>
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
                  {renderCandidateActions(candidate)}
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">Talent Discovery</CardTitle>
                <CardDescription>Browse, filter, and discover talented individuals for your open roles.</CardDescription>
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('card')} aria-label="Card View">
                  <LayoutGrid className="mr-2 h-4 w-4"/> Card View
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} aria-label="List View">
                  <List className="mr-2 h-4 w-4"/> List View
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t pt-6">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="keywords" className="text-xs font-medium">Search by Name, Skills, Role...</Label>
                <Input id="keywords" placeholder="e.g., Alice, React, Product Manager..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locationFilter" className="text-xs font-medium">Location</Label>
                <Input id="locationFilter" placeholder="City or Remote" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-grow"><Search className="mr-2 h-4 w-4" /> Search</Button>
                <Button variant="outline" size="icon" aria-label="Advanced Filters"><Filter className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {viewMode === 'card' ? renderCardView() : renderListView()}
          
          {displayedCandidates.length === 0 && (
              <Card className="col-span-full text-center py-10 shadow-lg">
                <CardContent>
                    <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No candidates match your current filters.</p>
                    <Button variant="link" className="mt-2">Clear Filters</Button>
                </CardContent>
              </Card>
            )}
            {visibleCandidatesCount < allMockCandidates.length && (
                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={handleLoadMoreCandidates}>Load More Candidates</Button>
                </div>
            )}
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center"><Folder className="mr-2 h-5 w-5 text-primary"/>Candidate Folders</CardTitle>
                    <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setNewFolderName("")}><FolderPlus className="mr-1.5 h-4 w-4"/>New</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                                <DialogDescription>Enter a name for your new candidate folder.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-folder-name">Folder Name</Label>
                                    <Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g., Top Backend Candidates" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="button" onClick={handleCreateFolder}><Save className="mr-2 h-4 w-4"/>Create Folder</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {folders.length > 0 ? (
                        <ul className="space-y-2">
                            {folders.map(folderName => (
                                <li key={folderName} className="flex justify-between items-center p-2 rounded-md hover:bg-accent/50 transition-colors">
                                    <span className="text-sm text-foreground">{folderName}</span>
                                    <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-destructive h-6 w-6 p-0" onClick={() => { setFolders(f => f.filter(f => f !== folderName)); toast({title: "Folder Deleted (Placeholder)"})}}>
                                        <Trash2 className="h-3.5 w-3.5"/>
                                        <span className="sr-only">Delete {folderName}</span>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No folders created yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Dialog for Move to Folder */}
      <Dialog open={isMoveToFolderDialogOpen} onOpenChange={setIsMoveToFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Move {selectedCandidateForFolderMove?.name} to Folder</DialogTitle>
                <DialogDescription>Select a folder to organize this candidate.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="folder-select">Target Folder</Label>
                    <Select value={selectedFolderForMove} onValueChange={setSelectedFolderForMove}>
                        <SelectTrigger id="folder-select">
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            {folders.map(folderName => (
                                <SelectItem key={folderName} value={folderName}>{folderName}</SelectItem>
                            ))}
                            {folders.length === 0 && <p className="p-2 text-sm text-muted-foreground">No folders available. Create one first.</p>}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={() => setIsMoveToFolderDialogOpen(false)}>Cancel</Button>
                 <Button onClick={handleMoveCandidateToFolder} disabled={!selectedFolderForMove || folders.length === 0}>Move Candidate</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


    