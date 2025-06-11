
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  text?: string; 
}

export function Logo({ className, iconSize = 28, textSize = "text-2xl", text = "Persona AI" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <BrainCircuit size={iconSize} className="text-primary" />
      <span className={`font-bold ${textSize} text-foreground`}>{text}</span>
    </Link>
  );
}
