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
        
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <History className="w-10 h-10 text-primary" />
            Your History
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Past moods and where we sent you.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border hidden md:block"></div>
            
            {history.map((item) => (
              <div key={item.id} className="relative flex items-stretch md:items-center gap-6 group">
                <div className="hidden md:flex w-12 h-12 rounded-full bg-background border-4 border-card shadow-sm z-10 items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
                </div>
                
                <div className="flex-1 bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="flex gap-3">
                      <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-lg font-medium text-foreground italic">"{item.mood}"</p>
                    </div>
                  </div>

                  <div className="w-full sm:w-px sm:h-16 bg-border hidden sm:block"></div>

                  <div className="flex-1 sm:flex-[0.8] flex items-center justify-between bg-muted/50 p-4 rounded-2xl w-full sm:w-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Recommended</span>
                      <span className="font-bold text-foreground text-lg line-clamp-1">{item.restaurant.name}</span>
                    </div>
                    <Link href={`/restaurant/${item.restaurant.id}`} className="w-10 h-10 rounded-full bg-background shadow-sm flex items-center justify-center shrink-0 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-card border-2 border-dashed border-border rounded-3xl mt-8">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">No history yet</h3>
            <p className="text-muted-foreground font-medium mb-6">Ask for a recommendation and it will show up here.</p>
            <Link href="/discover" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">
              Make a request
            </Link>
          </div>
        )}

      </div>
    </Shell>
  );
}
