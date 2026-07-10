import { Shell } from "@/components/shell";
import { useGetRecommendationHistory } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { History, MessageCircle, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RecommendationHistory() {
  const { data: history, isLoading } = useGetRecommendationHistory();

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8">
        
        <div className="flex flex-col gap-2 glass-subtle rounded-3xl p-6">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-3">
            <History className="w-10 h-10 text-primary" />
            Your History
          </h1>
          <p className="text-lg text-white/90 font-bold">
            Past moods and where we sent you.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl glass-subtle" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/20 hidden md:block"></div>
            
            {history.map((item) => (
              <div key={item.id} className="relative flex items-stretch md:items-center gap-6 group">
                <div className="hidden md:flex w-12 h-12 rounded-full glass-subtle border-2 border-white/30 z-10 items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white/70 group-hover:bg-white transition-colors"></div>
                </div>

                <div className="flex-1 glass-subtle rounded-3xl p-6 transition-all hover:border-primary/30 flex flex-col sm:flex-row gap-6 items-start sm:items-center">

                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wider drop-shadow-sm">
                      <Clock className="w-4 h-4" />
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex gap-3">
                      <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-lg font-bold text-white drop-shadow-sm">"{item.mood}"</p>
                    </div>
                  </div>

                  <div className="w-full sm:w-px sm:h-16 bg-white/20 hidden sm:block"></div>

                  <div className="flex-1 sm:flex-[0.8] flex items-center justify-between glass-subtle p-4 rounded-2xl w-full sm:w-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/90 uppercase tracking-wider mb-1 drop-shadow-sm">Recommended</span>
                      <span className="font-extrabold text-white text-lg line-clamp-1 drop-shadow-sm">{item.restaurant.name}</span>
                    </div>
                    <Link href={`/restaurant/${item.restaurant.id}`} className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center shrink-0 text-white hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 glass-subtle border-2 border-dashed border-white/30 rounded-3xl mt-8">
            <MessageCircle className="w-16 h-16 text-white/40 mb-4" />
            <h3 className="text-2xl font-extrabold text-white drop-shadow-sm mb-2">No history yet</h3>
            <p className="text-white/90 font-bold mb-6">Ask for a recommendation and it will show up here.</p>
            <Link href="/discover" className="btn-jelly rounded-full px-6 py-3 font-bold">
              Make a request
            </Link>
          </div>
        )}

      </div>
    </Shell>
  );
}
