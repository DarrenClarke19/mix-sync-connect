import { createBrowserRouter } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/common/Layout/AppLayout";

// Pages
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PlaylistDetailPage from "@/pages/dashboard/PlaylistDetailPage";
import FriendsPage from "@/pages/friends/FriendsPage";
import SearchPage from "@/pages/search/SearchPage";
import SpotifyCallbackPage from "@/pages/SpotifyCallbackPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </AuthGuard>
    ),
  },
  {
    path: "/playlist/:playlistId",
    element: (
      <AuthGuard>
        <AppLayout>
          <PlaylistDetailPage />
        </AppLayout>
      </AuthGuard>
    ),
  },
  {
    path: "/friends",
    element: (
      <AuthGuard>
        <AppLayout>
          <FriendsPage />
        </AppLayout>
      </AuthGuard>
    ),
  },
  {
    path: "/search",
    element: (
      <AuthGuard>
        <AppLayout>
          <SearchPage />
        </AppLayout>
      </AuthGuard>
    ),
  },
  {
    path: "/spotify/callback",
    element: <SpotifyCallbackPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
