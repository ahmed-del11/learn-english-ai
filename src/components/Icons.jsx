import { 
  Home as HomeIcon, 
  Book, 
  Mic, 
  Brain, 
  TrendingUp, 
  Moon, 
  Sun, 
  Globe, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  CheckCircle,
  X, 
  Sparkles, 
  Loader2, 
  Flame, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  DownloadCloud,
  User,
  LogOut,
  Search,
  Filter,
  Send
} from 'lucide-react';

export const Icons = {
    Home: HomeIcon,
    Book,
    Mic,
    Brain,
    TrendingUp,
    Moon,
    Sun,
    Globe,
    Search,
    Filter,
    Send,
    Volume: Volume2,
    Volume2,
    Play,
    Pause,
    Refresh: RotateCcw,
    Check,
    CheckCircle,
    X,
    Sparkles,
    Loader: Loader2,
    Flame,
    Award,
    ChevronRight,
    ChevronLeft,
    DownloadCloud,
    User,
    LogOut,
    RefreshCw: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
        </svg>
    ),
    X: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    )
};
