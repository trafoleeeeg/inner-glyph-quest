import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TutorialProvider } from "@/components/TutorialOverlay";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfilePage from "./pages/ProfilePage";
import DesireTracker from "./pages/DesireTracker";
import CommunityChat from "./pages/CommunityChat";
import AdminPanel from "./pages/AdminPanel";
import FeedPage from "./pages/FeedPage";
import SearchPage from "./pages/SearchPage";
import UserProfilePage from "./pages/UserProfilePage";
import MapPage from "./pages/MapPage";
// GlyphPage removed - replaced by Companion in Hub
import TribesPage from "./pages/TribesPage";
import TasksPage from "./pages/TasksPage";
import LifeAnalysisPage from "./pages/LifeAnalysisPage";
import MessagesPage from "./pages/MessagesPage";
import ConversationPage from "./pages/ConversationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TutorialProvider>
              <Routes>
                <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/desires" element={<ProtectedRoute><DesireTracker /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><CommunityChat /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                {/* /glyph route removed */}
                <Route path="/tribes" element={<ProtectedRoute><TribesPage /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
                <Route path="/life-analysis" element={<ProtectedRoute><LifeAnalysisPage /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                <Route path="/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TutorialProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
