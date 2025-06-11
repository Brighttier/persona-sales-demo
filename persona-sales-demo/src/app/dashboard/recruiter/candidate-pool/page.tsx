
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Filter, Mail, Search, UserPlus, ExternalLink, Star, Briefcase, MapPin, Users as UsersIcon, FolderPlus, FolderOpen, MoveUpRight, Trash2, Save, GripVertical, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useCallback } from "react";
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

interface FolderType {
  id: string;
  name: string;
}

const allMockCandidates: Candidate[] = [
  { id: "cand1", name: "Alice Wonderland", role: "Software Engineer", experience: "5 Yrs", location: "Remote", skills: ["React", "Node.js", "AWS", "TypeScript", "GraphQL"], topSkill: "React", avatar: "https://placehold.co/100x100.png?text=AW", aiMatchScore: 92, lastActive: "2 days ago", interestedIn: ["Frontend", "Full Stack"] },
  { id: "cand2", name: "Bob The Builder", role: "Product Manager", experience: "8 Yrs", location: "New York, NY", skills: ["Agile", "Roadmapping", "JIRA", "User Research"], topSkill: "Agile", avatar: "https://placehold.co/100x100.png?text=BB", aiMatchScore: 85, lastActive: "Online", interestedIn: ["Product Leadership"] },
  { id: "cand3", name: "Carol Danvers", role: "UX Designer", experience: "3 Yrs", location: "San Francisco, CA", skills: ["Figma", "Prototyping", "User Research", "Adobe XD"], topSkill: "Figma", avatar: "https://placehold.co/100x100.png?text=CD", aiMatchScore: 78, lastActive: "1 week ago", interestedIn: ["UI/UX Design", "Mobile Design"] },
  { id: "cand4", name: "David Copperfield", role: "Data Scientist", experience: "6 Yrs", location: "Remote", skills: ["Python", "ML", "TensorFlow", "SQL"], topSkill: "Python", avatar: "https://placehold.co/100x100.png?text=DC", aiMatchScore: 95, lastActive: "3 hours ago", interestedIn: ["Machine Learning", "AI Research"] },
  { id: "cand5", name: "Edward Norton", role: "Backend Engineer", experience: "7 Yrs", location: "Austin, TX", skills: ["Java", "Spring Boot", "Kafka", "Microservices"], topSkill: "Java", avatar: "https://placehold.co/100x100.png?text=EN", aiMatchScore: 88, lastActive: "5 days ago", interestedIn: ["Backend Architecture", "Distributed Systems"] },
  { id: "cand6", name: "Fiona Gallagher", role: "DevOps Engineer", experience: "4 Yrs", location: "Remote", skills: ["Kubernetes", "Docker", "AWS", "Terraform"], topSkill: "Kubernetes", avatar: "https://placehold.co/100x100.png?text=FG", aiMatchScore: 90, lastActive: "Yesterday", interestedIn: ["Cloud Infrastructure", "CI/CD"] },
  { id: "cand7", name: "George Costanza", role: "QA Analyst", experience: "2 Yrs", location: "New York, NY", skills: ["Selenium", "JIRA", "Test Planning", "API Testing"], topSkill: "Selenium", avatar: "https://placehold.co/100x100.png?text=GC", aiMatchScore: 75, lastActive: "3 weeks ago", interestedIn: ["Automation Testing", "Quality Assurance"] },
  { id: "cand8", name: "Hannah Montana", role: "Frontend Developer", experience: "1 Yr", location: "Los Angeles, CA", skills: ["HTML", "CSS", "JavaScript", "Vue.js"], topSkill: "Vue.js", avatar: "https://placehold.co/100x100.png?text=HM", aiMatchScore: 80, lastActive: "4 days ago", interestedIn: ["UI Development"] },
  { id: "cand9", name: "Indiana Jones", role: "Data Explorer", experience: "10 Yrs", location: "Global (Remote)", skills: ["SQL", "NoSQL", "Data Mining", "Archaeology"], topSkill: "SQL", avatar: "https://placehold.co/100x100.png?text=IJ", aiMatchScore: 93, lastActive: "Today", interestedIn: ["Big Data", "Historical Data Analysis"] },
];

const INITIAL_CANDIDATES_TO_SHOW = 6;
const CANDIDATES_INCREMENT_COUNT = 4;
const ALL_CANDIDATES_FOLDER_ID = "all-candidates-folder";


export default function CandidatePoolPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [folders, setFolders] = useState<FolderType[]>([
    { id: "folder1", name: "Shortlisted - Engineering" },
    { id: "folder2", name: "Future Prospects" },
    { id: "folder3", name: "Tech Review Pending" },
  ]);
  const [candidateFolderAssignments, setCandidateFolderAssignments] = useState<Record<string, string | null>>({
    "cand1": "folder1",
    "cand5": "folder1",
    "cand3": "folder3",
  });
  const [selectedFolderId, setSelectedFolderId] = useState<string>(ALL_CANDIDATES_FOLDER_ID);

  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isMoveToFolderDialogOpen, setIsMoveToFolderDialogOpen] = useState(false);
  const [selectedCandidateForFolderMove, setSelectedCandidateForFolderMove] = useState<Candidate | null>(null);
  const [targetFolderForMove, setTargetFolderForMove] = useState<string>("");

  const [appliedKeywords, setAppliedKeywords] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppliedKeywords(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppliedLocation(e.target.value);
  };

  const filteredCandidatesByFolderAndSearch = useMemo(() => {
    let candidatesToFilter = [...allMockCandidates]; // Start with a copy

    // Filter by selected folder first
    if (selectedFolderId !== ALL_CANDIDATES_FOLDER_ID) {
      candidatesToFilter = candidatesToFilter.filter(candidate => candidateFolderAssignments[candidate.id] === selectedFolderId);
    }

    // Then filter by applied keywords
    if (appliedKeywords) {
      const lowerKeywords = appliedKeywords.toLowerCase();
      candidatesToFilter = candidatesToFilter.filter(candidate =>
        candidate.name.toLowerCase().includes(lowerKeywords) ||
        candidate.role.toLowerCase().includes(lowerKeywords) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(lowerKeywords))
      );
    }

    // Then filter by applied location
    if (appliedLocation) {
      const lowerLocation = appliedLocation.toLowerCase();
      candidatesToFilter = candidatesToFilter.filter(candidate =>
        candidate.location.toLowerCase().includes(lowerLocation)
      );
    }
    return candidatesToFilter;
  }, [selectedFolderId, candidateFolderAssignments, appliedKeywords, appliedLocation]);

  const [visibleCandidatesCount, setVisibleCandidatesCount] = useState(INITIAL_CANDIDATES_TO_SHOW);

  const displayedCandidates = useMemo(() => {
    return filteredCandidatesByFolderAndSearch.slice(0, visibleCandidatesCount);
  }, [filteredCandidatesByFolderAndSearch, visibleCandidatesCount]);

  useEffect(() => {
    setVisibleCandidatesCount(INITIAL_CANDIDATES_TO_SHOW);
  }, [selectedFolderId, appliedKeywords, appliedLocation]);


  const handleLoadMoreCandidates = () => {
    const newVisibleCount = Math.min(visibleCandidatesCount + CANDIDATES_INCREMENT_COUNT, filteredCandidatesByFolderAndSearch.length);
    setVisibleCandidatesCount(newVisibleCount);
  };

  const handleContact = (candidateName: string) => {
    toast({ title: "Contact Candidate", description: `Initiated contact with ${candidateName}. (Simulated)`});
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() === "") {
      toast({ variant: "destructive", title: "Error", description: "Folder name cannot be empty." });
      return;
    }
    if (folders.find(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
       toast({ variant: "destructive", title: "Error", description: "Folder with this name already exists." });
      return;
    }
    const newFolder = { id: `folder-${Date.now()}`, name: newFolderName.trim() };
    setFolders(prev => [...prev, newFolder]);
    toast({ title: "Folder Created", description: `Folder "${newFolder.name}" added.` });
    setNewFolderName("");
    setIsCreateFolderDialogOpen(false);
  };

  const openMoveToFolderDialog = (candidate: Candidate) => {
    setSelectedCandidateForFolderMove(candidate);
    setTargetFolderForMove(candidateFolderAssignments[candidate.id] || "");
    setIsMoveToFolderDialogOpen(true);
  };

  const handleMoveCandidateToFolder = () => {
    if (!selectedCandidateForFolderMove || !targetFolderForMove) {
      toast({ variant: "destructive", title: "Error", description: "Please select a candidate and a target folder." });
      return;
    }
    setCandidateFolderAssignments(prev => ({
        ...prev,
        [selectedCandidateForFolderMove.id]: targetFolderForMove === "unassign" ? null : targetFolderForMove,
    }));
    const folderName = targetFolderForMove === "unassign" ? "Unassigned" : folders.find(f => f.id === targetFolderForMove)?.name;
    toast({ title: "Candidate Moved", description: `${selectedCandidateForFolderMove.name} moved to folder "${folderName || 'N/A'}".` });
    setIsMoveToFolderDialogOpen(false);
    setSelectedCandidateForFolderMove(null);
  };

  const getCandidateCountForFolder = useCallback((folderId: string): number => {
    if (folderId === ALL_CANDIDATES_FOLDER_ID) return allMockCandidates.length;
    return Object.values(candidateFolderAssignments).filter(assignedFolderId => assignedFolderId === folderId).length;
  }, [candidateFolderAssignments]);

  const getFolderNameById = (folderId: string | null): string => {
    if (!folderId) return "Unassigned";
    if (folderId === ALL_CANDIDATES_FOLDER_ID) return "All Candidates";
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : "Unknown Folder";
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
          <FolderOpen className="mr-2 h-4 w-4" /> Move to Folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast({ title: "Action: Remove (Placeholder)", description: `Candidate ${candidate.name} would be removed.`})}>
          <Trash2 className="mr-2 h-4 w-4" /> Remove from Pool
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
              <TableHead>AI Match</TableHead>
              <TableHead>Assigned Folder</TableHead>
              <TableHead>Top Skills</TableHead>
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
                      <Link href={`/dashboard/${role}/candidate-profile/${candidate.id}`} className="font-semibold hover:underline text-primary">{candidate.name}</Link>
                      <div className="text-xs text-muted-foreground">{candidate.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{candidate.experience}</TableCell>
                <TableCell>{candidate.location}</TableCell>
                <TableCell>
                  <Badge
                    variant="default"
                    className={cn("font-semibold",
                        candidate.aiMatchScore > 80 ? "bg-green-100 text-green-700 border-green-300" :
                        candidate.aiMatchScore > 60 ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                        "bg-red-100 text-red-700 border-red-300"
                    )}
                  >
                    <Star className="mr-1 h-3 w-3 fill-current" />{candidate.aiMatchScore}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {getFolderNameById(candidateFolderAssignments[candidate.id] || null)}
                  </Badge>
                </TableCell>
                 <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map(skill => (
                      <Badge key={skill} variant="default" className="font-normal text-xs">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 2 && <Badge variant="outline" className="font-normal text-xs">+{candidate.skills.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {renderCandidateActions(candidate)}
                </TableCell>
              </TableRow>
            ))}
            {displayedCandidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                     {appliedKeywords || appliedLocation ? "No candidates found matching your search/filters." : "No candidates in this folder."}
                  </TableCell>
                </TableRow>
              )}
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
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-t pt-6">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="keywords" className="text-xs font-medium">Search by Name, Skills, Role...</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., Alice, React, Product Manager..."
                  value={appliedKeywords}
                  onChange={handleKeywordsChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locationFilter" className="text-xs font-medium">Location</Label>
                <Input
                  id="locationFilter"
                  placeholder="City or Remote"
                  value={appliedLocation}
                  onChange={handleLocationChange}
                />
              </div>
              {/* Removed explicit search button for live filtering */}
            </CardContent>
          </Card>

          {renderListView()}

          {filteredCandidatesByFolderAndSearch.length > visibleCandidatesCount && displayedCandidates.length > 0 && (
                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={handleLoadMoreCandidates}>Load More Candidates</Button>
                </div>
            )}
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg sticky top-24">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg flex items-center"><FolderOpen className="mr-2 h-5 w-5 text-primary"/>Candidate Folders</CardTitle>
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
                <CardContent className="pt-0 max-h-[calc(100vh-200px)] overflow-y-auto">
                     <ul className="space-y-1">
                        <li
                            className={cn(
                                "flex justify-between items-center p-2 rounded-md hover:bg-accent/80 transition-colors cursor-pointer",
                                selectedFolderId === ALL_CANDIDATES_FOLDER_ID && "bg-accent text-accent-foreground font-semibold"
                            )}
                            onClick={() => setSelectedFolderId(ALL_CANDIDATES_FOLDER_ID)}
                        >
                            <div className="flex items-center">
                                <FolderOpen className="mr-2 h-4 w-4" />
                                <span className="text-sm">All Candidates</span>
                            </div>
                            <Badge variant={selectedFolderId === ALL_CANDIDATES_FOLDER_ID ? "default" : "secondary"} className="text-xs">
                                {getCandidateCountForFolder(ALL_CANDIDATES_FOLDER_ID)}
                            </Badge>
                        </li>
                        {folders.map(folder => (
                            <li
                                key={folder.id}
                                className={cn(
                                    "flex justify-between items-center p-2 rounded-md hover:bg-accent/80 transition-colors group cursor-pointer",
                                    selectedFolderId === folder.id && "bg-accent text-accent-foreground font-semibold"
                                )}
                                onClick={() => setSelectedFolderId(folder.id)}
                            >
                                <div className="flex items-center">
                                    <GripVertical className="mr-1 h-4 w-4 text-muted-foreground/50 group-hover:text-accent-foreground cursor-grab" />
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    <span className="text-sm">{folder.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={selectedFolderId === folder.id ? "default" : "secondary"} className="text-xs">
                                        {getCandidateCountForFolder(folder.id)}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="text-muted-foreground hover:text-destructive h-6 w-6 p-0 opacity-50 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFolders(f => f.filter(item => item.id !== folder.id));
                                            setCandidateFolderAssignments(prev => {
                                                const updated = {...prev};
                                                Object.keys(updated).forEach(candidateId => {
                                                    if (updated[candidateId] === folder.id) {
                                                        updated[candidateId] = null;
                                                    }
                                                });
                                                return updated;
                                            });
                                            if (selectedFolderId === folder.id) setSelectedFolderId(ALL_CANDIDATES_FOLDER_ID);
                                            toast({title: "Folder Deleted"});
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                        <span className="sr-only">Delete {folder.name}</span>
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {folders.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No custom folders created yet.</p>}
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={isMoveToFolderDialogOpen} onOpenChange={setIsMoveToFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Move {selectedCandidateForFolderMove?.name} to Folder</DialogTitle>
                <DialogDescription>Select a folder to organize this candidate.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="folder-select">Target Folder</Label>
                    <Select value={targetFolderForMove} onValueChange={setTargetFolderForMove}>
                        <SelectTrigger id="folder-select">
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassign">Unassign (Remove from any folder)</SelectItem>
                            {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                            ))}
                            {folders.length === 0 && <p className="p-2 text-sm text-muted-foreground">No custom folders available.</p>}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={() => { setIsMoveToFolderDialogOpen(false); setSelectedCandidateForFolderMove(null); }}>Cancel</Button>
                 <Button onClick={handleMoveCandidateToFolder} disabled={!targetFolderForMove}><Save className="mr-2 h-4 w-4"/> Move Candidate</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
