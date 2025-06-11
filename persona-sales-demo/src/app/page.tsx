
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, BotMessageSquare, Users, Search, Briefcase } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/app/Logo";

export default function LandingPage() {
  const features = [
    {
      icon: <BotMessageSquare className="h-10 w-10 text-primary" />,
      title: "AI Interview Simulation",
      description: "Engage in realistic interviews with our advanced AI, get instant feedback, and improve your skills.",
      dataAiHint: "AI robot"
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Role-Based Dashboards",
      description: "Tailored experiences for Candidates, Recruiters, Hiring Managers, and Admins.",
      dataAiHint: "team collaboration"
    },
    {
      icon: <Search className="h-10 w-10 text-primary" />,
      title: "AI Profile Enrichment",
      description: "Let AI enhance your profile, highlighting your key skills and experience automatically.",
      dataAiHint: "data analysis"
    },
    {
      icon: <Briefcase className="h-10 w-10 text-primary" />,
      title: "Public Job Board",
      description: "Explore exciting career opportunities on our comprehensive job board.",
      dataAiHint: "job search"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 md:px-8 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/jobs">Job Board</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Login / Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Find Your Dream Job with <span className="text-primary">Persona AI</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Leveraging cutting-edge AI to connect talent with opportunity. Streamline your hiring or job search process like never before.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/jobs">Explore Jobs</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Recruiters / HMs</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
              Why Choose Persona AI?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Revolutionizing Recruitment
                </h2>
                <p className="text-muted-foreground mb-4">
                  Persona AI offers a seamless, intelligent platform for every step of the hiring journey.
                </p>
                <ul className="space-y-3">
                  {[
                    "Smart candidate matching and screening.",
                    "Interactive AI-driven interview simulations.",
                    "Automated profile enrichment from resumes.",
                    "Intuitive dashboards for all user roles.",
                  ].map(item => (
                     <li key={item} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-accent mr-2 shrink-0" />
                        <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" asChild className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Persona AI Platform Showcase"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-2xl"
                  data-ai-hint="platform interface"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Persona AI. All rights reserved.</p>
          <p className="text-sm mt-1">Revolutionizing talent acquisition through AI.</p>
        </div>
      </footer>
    </div>
  );
}
