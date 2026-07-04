import { Link } from "wouter";
import { Compass, Sparkles, MapPin, Zap, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="px-6 py-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">AI Food Concierge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Log In
          </Link>
          <Link href="/sign-up" className="bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground font-semibold text-sm w-fit border border-secondary">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Your local food companion</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight">
              Don't know what to eat? <span className="text-primary">Let's fix that.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-lg leading-relaxed">
              Tell us how you're feeling, what you're craving, or where you're at. We'll find the perfect spot in Malaysia, instantly. No more scrolling through endless lists.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/sign-up" className="bg-primary text-primary-foreground text-center text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all hover:-translate-y-1">
                Start Discovering
              </Link>
              <Link href="/sign-in" className="bg-card text-card-foreground border-2 border-border text-center text-lg font-bold px-8 py-4 rounded-full shadow-sm hover:border-primary/50 transition-all">
                I already have an account
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl transform rotate-3 scale-105"></div>
            <div className="relative bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-end">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserIcon />
                  </div>
                  <div className="bg-muted px-5 py-4 rounded-2xl rounded-bl-none text-foreground font-medium">
                    "I'm super stressed from work and just want some spicy comfort food. Nothing too fancy."
                  </div>
                </div>
                
                <div className="flex gap-4 items-end flex-row-reverse">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 px-5 py-4 rounded-2xl rounded-br-none flex flex-col gap-3 max-w-[80%]">
                    <p className="text-foreground font-medium">I've got you. How about <strong className="text-primary">Village Park Restaurant</strong>?</p>
                    <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                      <h4 className="font-bold text-sm">Village Park Restaurant</h4>
                      <p className="text-xs text-muted-foreground mt-1">Their legendary Nasi Lemak Ayam Goreng is the ultimate spicy comfort food. Perfect for shaking off a long day.</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md">RM15-RM30</span>
                        <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md">Spicy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Zap}
            title="Instant Decisions"
            description="Skip the 30-minute debate. Get one highly curated recommendation based on your exact mood."
          />
          <FeatureCard 
            icon={MapPin}
            title="Hyper-Local Context"
            description="Built for Malaysia. We understand local cravings, halal preferences, and real budget ranges."
          />
          <FeatureCard 
            icon={Heart}
            title="Learns Your Taste"
            description="The more you use it, the better it gets. We remember your allergies, favorite cuisines, and go-to spots."
          />
        </div>
      </main>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
    </svg>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow hover:border-primary/30">
      <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center text-primary">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed">{description}</p>
    </div>
  );
}
