import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppStateProvider } from "@/store/app-state";

import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Onboarding from "@/pages/onboarding";
import Recommendation from "@/pages/recommendation";
import RestaurantDetail from "@/pages/restaurant-detail";
import Favorites from "@/pages/favorites";
import History from "@/pages/history";
import Dashboard from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import AddRestaurant from "@/pages/add-restaurant";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/recommendation" component={Recommendation} />
          <Route path="/restaurant/:id" component={RestaurantDetail} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/history" component={History} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/add-restaurant" component={AddRestaurant} />

          <Route>
            <div className="min-h-screen flex items-center justify-center font-bold text-2xl text-foreground">
              404 - Not Found
            </div>
          </Route>
        </Switch>
        <Toaster />
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}
