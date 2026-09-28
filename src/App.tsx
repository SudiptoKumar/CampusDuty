import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLoadingScreen } from "@/components/shared/AuthLoadingScreen";
import { useNotifications } from "@/hooks/useNotifications";
import { DashboardSkeleton } from "@/components/shared/DashboardSkeleton";
import { OnboardingWizard } from "@/features/onboarding";
import { PendingImportHandler } from "@/features/import/PendingImportHandler";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { useIsUserBlocked, useMaintenanceMode } from "@/hooks/useAdminActions";

import { usePermission } from "@/hooks/usePermission";

// Eagerly loaded auth pages (needed immediately)
import { LoginPage, SignupPage } from "@/features/auth";

// Lazy loaded feature pages for code-splitting
const BentoDashboard = lazy(() => import("@/features/dashboard/BentoDashboard"));
const ClassroomPage = lazy(() => import("@/features/classroom/ClassroomPage"));
const AgendaPage = lazy(() => import("@/features/agenda/AgendaPage"));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage"));
const TimetablePage = lazy(() => import("@/features/timetable/TimetablePage"));
const AddClassPage = lazy(() => import("@/features/timetable/components/AddClassPage").then(m => ({ default: m.AddClassPage })));
const EditClassPage = lazy(() => import("@/features/timetable/components/EditClassPage").then(m => ({ default: m.EditClassPage })));
const OccurrencesPage = lazy(() => import("@/features/timetable/components/OccurrencesPage").then(m => ({ default: m.OccurrencesPage })));
const SubjectsPage = lazy(() => import("@/features/subjects/SubjectsPage"));
const SubjectDetailPage = lazy(() => import("@/features/subjects/SubjectDetailPage").then(m => ({ default: m.SubjectDetailPage })));
const AddSubjectPage = lazy(() => import("@/features/subjects/components/AddSubjectPage").then(m => ({ default: m.AddSubjectPage })));
const EditSubjectPage = lazy(() => import("@/features/subjects/components/EditSubjectPage").then(m => ({ default: m.EditSubjectPage })));
const AnnouncementsPage = lazy(() => import("@/features/announcements/AnnouncementsPage").then(m => ({ default: m.AnnouncementsPage })));
const TeachersPage = lazy(() => import("@/features/teachers/TeachersPage"));
const AddTeacherPage = lazy(() => import("@/features/teachers/components/AddTeacherPage").then(m => ({ default: m.AddTeacherPage })));
const TeacherDetailPage = lazy(() => import("@/features/teachers/TeacherDetailPage").then(m => ({ default: m.TeacherDetailPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const ProfilePage = lazy(() => import("@/features/profile").then(m => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import("@/features/profile").then(m => ({ default: m.PublicProfilePage })));
const ImportPage = lazy(() => import("@/features/import/ImportPage"));
const ImportByCodePage = lazy(() => import("@/features/import/ImportByCodePage").then(m => ({ default: m.ImportByCodePage })));
const WhatsNewPage = lazy(() => import("@/features/whats-new").then(m => ({ default: m.WhatsNewPage })));
const AdminPage = lazy(() => import("@/features/admin").then(m => ({ default: m.AdminPage })));
const NotificationDetailPage = lazy(() => import("@/features/notifications/NotificationDetailPage"));
const NotesPage = lazy(() => import("@/features/notes/NotesPage"));
const NoteEditorPage = lazy(() => import("@/features/notes/NoteEditorPage"));
const ExamModePage = lazy(() => import("@/features/exam-mode/ExamModePage"));
const ToolsPage = lazy(() => import("@/features/tools/ToolsPage"));
const ToolAppPage = lazy(() => import("@/features/tools/ToolAppPage"));
const MarketplacePage = lazy(() => import("@/features/marketplace/MarketplacePage"));
const BlockedPage = lazy(() => import("@/pages/BlockedPage"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const PublicPostPage = lazy(() => import("@/features/classroom/PublicPostPage"));
const PostDetailPage = lazy(() => import("@/features/classroom/PostDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback for lazy routes
function PageLoader() {
  return <DashboardSkeleton />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isAdmin } = usePermission('admin');
  const { data: blockData } = useIsUserBlocked(user?.id);
  const { data: maintenanceMode } = useMaintenanceMode();
  
  // Initialize notifications for logged-in users
  useNotifications();
  
  // Show content-first skeleton instead of blank spinner
  if (isLoading) {
    return <AuthLoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is blocked
  if (blockData?.is_blocked) {
    return <BlockedPage reason={blockData.reason} expiresAt={blockData.expires_at} />;
  }

  // Check maintenance mode (admins bypass)
  if (maintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }
  
  return (
    <>
      <PendingImportHandler />
      <OnboardingWizard />
      <PWAInstallBanner />
      {children}
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // For login/signup, allow immediate render - no loading blocker
  // The page content shows immediately while auth state resolves
  if (isLoading) {
    // Return children immediately - login form shows while auth checks in background
    // If user turns out to be logged in, they'll redirect after
    return <>{children}</>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><AppShell><BentoDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/classroom" element={<ProtectedRoute><AppShell><ClassroomPage /></AppShell></ProtectedRoute>} />
        <Route path="/classroom/post/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AppShell><AgendaPage /></AppShell></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><AppShell><CalendarPage /></AppShell></ProtectedRoute>} />
        <Route path="/timetable" element={<ProtectedRoute><AppShell><TimetablePage /></AppShell></ProtectedRoute>} />
        <Route path="/timetable/add" element={<ProtectedRoute><AddClassPage /></ProtectedRoute>} />
        <Route path="/timetable/edit/:id" element={<ProtectedRoute><EditClassPage /></ProtectedRoute>} />
        <Route path="/timetable/occurrences" element={<ProtectedRoute><OccurrencesPage /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><AppShell><SubjectsPage /></AppShell></ProtectedRoute>} />
        <Route path="/subjects/add" element={<ProtectedRoute><AddSubjectPage /></ProtectedRoute>} />
        <Route path="/subjects/:id" element={<ProtectedRoute><SubjectDetailPage /></ProtectedRoute>} />
        <Route path="/subjects/:id/edit" element={<ProtectedRoute><EditSubjectPage /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><AppShell><AnnouncementsPage /></AppShell></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute><AppShell><TeachersPage /></AppShell></ProtectedRoute>} />
        <Route path="/teachers/add" element={<ProtectedRoute><AddTeacherPage /></ProtectedRoute>} />
        <Route path="/teachers/:id" element={<ProtectedRoute><TeacherDetailPage /></ProtectedRoute>} />
        
        
        <Route path="/profile" element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
        <Route path="/whats-new" element={<ProtectedRoute><AppShell><WhatsNewPage /></AppShell></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AppShell><AdminPage /></AppShell></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><AppShell><NotesPage /></AppShell></ProtectedRoute>} />
        <Route path="/notes/new" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
        <Route path="/notes/:id/edit" element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
        <Route path="/exam-mode" element={<ProtectedRoute><AppShell><ExamModePage /></AppShell></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><AppShell><ToolsPage /></AppShell></ProtectedRoute>} />
        <Route path="/tools/:appId" element={<ProtectedRoute><ToolAppPage /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><AppShell><MarketplacePage /></AppShell></ProtectedRoute>} />
        <Route path="/notifications/:id" element={<ProtectedRoute><AppShell><NotificationDetailPage /></AppShell></ProtectedRoute>} />
        
        {/* Public profile route - no auth required */}
        <Route path="/u/:username/p/:slug" element={<PublicPostPage />} />
        <Route path="/p/:slug" element={<PublicPostPage />} />
        <Route path="/u/:username" element={<PublicProfilePage />} />
        
        {/* Import shared data routes */}
        <Route path="/import" element={<ImportByCodePage />} />
        <Route path="/import/:token" element={<ImportPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
