import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(16, 100%, 60%)",
    colorForeground: "hsl(19, 45%, 12%)",
    colorMutedForeground: "hsl(24, 16%, 41%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(30, 40%, 85%)",
    colorInputForeground: "hsl(19, 45%, 12%)",
    colorNeutral: "hsl(30, 40%, 85%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-3xl w-[440px] max-w-full overflow-hidden border-2 border-[hsl(30,40%,85%)] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-extrabold text-[hsl(19,45%,12%)] tracking-tight",
    headerSubtitle: "text-base font-medium text-[hsl(24,16%,41%)]",
    socialButtonsBlockButtonText: "font-bold text-[hsl(19,45%,12%)]",
    formFieldLabel: "text-sm font-bold text-[hsl(24,16%,41%)] uppercase tracking-wider",
    footerActionLink: "font-bold text-[hsl(16,100%,60%)] hover:underline",
    footerActionText: "font-medium text-[hsl(24,16%,41%)]",
    dividerText: "text-xs font-bold uppercase text-[hsl(24,16%,41%)]",
    formButtonPrimary: "bg-[hsl(16,100%,60%)] text-white font-bold rounded-full py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all",
    formFieldInput: "bg-[hsl(33,100%,98%)] border-[hsl(30,40%,85%)] text-[hsl(19,45%,12%)] rounded-xl py-3 px-4 font-medium focus:border-[hsl(16,100%,60%)]",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/discover" /></Show>
      <Show when="signed-out"><Home /></Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in"><Component /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppStateProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/onboarding">
              <ProtectedRoute component={Onboarding} />
            </Route>
            <Route path="/discover">
              <ProtectedRoute component={Discover} />
            </Route>
            <Route path="/recommendation">
              <ProtectedRoute component={Recommendation} />
            </Route>
            <Route path="/restaurant/:id">
              <ProtectedRoute component={RestaurantDetail} />
            </Route>
            <Route path="/favorites">
              <ProtectedRoute component={Favorites} />
            </Route>
            <Route path="/history">
              <ProtectedRoute component={History} />
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} />
            </Route>
            <Route path="/settings">
              <ProtectedRoute component={SettingsPage} />
            </Route>

            <Route>
              <div className="min-h-screen flex items-center justify-center font-bold text-2xl text-foreground">
                404 - Not Found
              </div>
            </Route>
          </Switch>
          <Toaster />
        </AppStateProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
