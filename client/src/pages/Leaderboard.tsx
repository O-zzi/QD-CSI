import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Medal, Target, Swords } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";

const FACILITIES = [
  { id: 'all', name: 'All Sports', icon: Trophy },
  { id: 'padel', name: 'Padel', icon: Target },
  { id: 'squash', name: 'Squash', icon: Target },
  { id: 'rifle', name: 'Air Rifle', icon: Target },
  { id: 'bridge', name: 'Bridge', icon: Swords },
];

export default function Leaderboard() {
  const [selectedFacility, setSelectedFacility] = useState('all');

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', selectedFacility !== 'all' ? selectedFacility : undefined],
  });

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Medal className={`w-5 h-5 ${rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />;
    }
    return <span className="text-sm font-bold">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="qd-container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold" data-testid="text-leaderboard-title">Leaderboard</h1>
              <p className="text-xs text-muted-foreground">Top players across all sports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="qd-container py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {FACILITIES.map((facility) => (
            <Button
              key={facility.id}
              variant={selectedFacility === facility.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFacility(facility.id)}
              className="gap-2"
              data-testid={`button-filter-${facility.id}`}
            >
              <facility.icon className="w-4 h-4" />
              {facility.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <Card 
                key={entry.id} 
                className={`overflow-hidden ${index < 3 ? 'border-2' : ''} ${
                  index === 0 ? 'border-amber-400' : 
                  index === 1 ? 'border-gray-400' : 
                  index === 2 ? 'border-amber-600' : ''
                }`}
                data-testid={`leaderboard-entry-${entry.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankStyle(index + 1)}`}>
                      {getRankIcon(index + 1)}
                    </div>
                    
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.profileImageUrl || ''} />
                      <AvatarFallback>
                        {entry.playerName?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-semibold">{entry.playerName || 'Anonymous Player'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{entry.wins}W - {entry.losses}L</span>
                        {entry.winRate && (
                          <Badge variant="secondary" size="sm">
                            {(entry.winRate * 100).toFixed(0)}% WR
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-sky-600">
                        {entry.rankingPoints?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Play matches to appear on the leaderboard!
              </p>
              <Link href="/booking">
                <Button data-testid="button-book-now">
                  Book a Court
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
