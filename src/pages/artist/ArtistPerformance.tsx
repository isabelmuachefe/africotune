import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { artistAPI, companyAPI } from '@/services/api';
import { ArtistWork, LogSheet } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import PerformanceCharts from '@/components/performance/PerformanceCharts';

const ArtistPerformance: React.FC = () => {
  const [tracks, setTracks] = useState<ArtistWork[]>([]);
  const [logSheets, setLogSheets] = useState<LogSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Get all music and sheets
        const [myTracks, allSheets] = await Promise.all([
          artistAPI.getMyMusic().catch(() => []),
          companyAPI.getLogSheets().catch(() => []),
        ]);
        
        // Filter sheets to only include those containing the artist's music
        const sheets = allSheets.filter(sheet => 
          sheet.selectedMusic?.some(music => 
            myTracks.some(track => track.id === (music as any).id)
          )
        );
        setTracks(myTracks);
        setLogSheets(sheets);
        if (myTracks.length > 0) setSelectedTrackId(myTracks[0].id);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load performance data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key !== 'namsa:update') return;
      try {
        const payload = JSON.parse(e.newValue || '{}');
        if (payload?.type === 'music' || payload?.type === 'profile') {
          load();
          toast({ title: 'Performance Data Updated' });
        }
      } catch (err) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [toast]);

  const performanceByTrack = useMemo(() => {
    // Map trackId -> { total: number, companies: Record<companyName, number> }
    const map: Record<number, { total: number; companies: Record<string, number>; track?: ArtistWork }> = {};
    
    // Initialize map with all tracks
    for (const t of tracks) {
      map[t.id] = { total: 0, companies: {}, track: t };
    }

    // Count occurrences in log sheets
    for (const sheet of logSheets) {
      const companyName = sheet.company?.companyName || 'Unknown Company';
      for (const m of sheet.selectedMusic || []) {
        const mid = (m as any).id;
        if (!mid) continue;
        // Make sure this is one of our tracks
        if (!tracks.some(t => t.id === mid)) continue;
        map[mid].total += 1;
        map[mid].companies[companyName] = (map[mid].companies[companyName] || 0) + 1;
      }
    }
    return map;
  }, [tracks, logSheets]);

  const selectedPerformance = selectedTrackId ? performanceByTrack[selectedTrackId] : null;

  const chartData = useMemo(() => {
    if (!selectedPerformance) return [] as { company: string; count: number }[];
    return Object.entries(selectedPerformance.companies).map(([company, count]) => ({ company, count }));
  }, [selectedPerformance]);

  const filteredTracks = useMemo(() => {
    if (!search.trim()) return tracks;
    const q = search.toLowerCase();
    return tracks.filter(t => t.title.toLowerCase().includes(q));
  }, [tracks, search]);

  // Build a compact timeline for the selected track (last 30 points)
  const selectedTimeline = useMemo(() => {
    if (!selectedTrackId) return [] as { date: string; count: number }[];
    const map: Record<string, number> = {};
    for (const sheet of logSheets) {
      const date = new Date(sheet.createdDate).toLocaleDateString();
      for (const m of sheet.selectedMusic || []) {
        const mid = (m as any).id;
        if (mid === selectedTrackId) {
          map[date] = (map[date] || 0) + 1;
        }
      }
    }
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [logSheets, selectedTrackId]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  return (
    <DashboardLayout title="Performance">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
            <p className="text-muted-foreground">Visualize how your music is selected by companies (based on LogSheets)</p>
          </div>
          <div className="w-72">
            <Input 
              placeholder="Search tracks..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full"
            />
          </div>
        </div>

        {/* Global Overview (cards + charts) */}
        {loading ? (
          <div className="h-48 bg-muted rounded animate-pulse" />
        ) : (
          <>
            <PerformanceCharts 
              logSheets={logSheets.filter(sheet => {
                if (!search.trim()) return true;
                const searchLower = search.toLowerCase();
                return sheet.selectedMusic?.some(music => 
                  (music as any).title?.toLowerCase().includes(searchLower)
                );
              })} 
              tracks={tracks.filter(track => 
                !search.trim() || track.title.toLowerCase().includes(search.toLowerCase())
              )} 
              userId={user?.id} 
            />

            {/* Company Engagement Analysis */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Company Engagement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribution Chart */}
                  <div>
                    <h4 className="font-semibold mb-4">Distribution of Company Play Counts</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            const playsByCompany = logSheets.reduce((acc, sheet) => {
                              const companyName = sheet.company?.companyName || 'Unknown';
                              if (!acc[companyName]) acc[companyName] = 0;
                              acc[companyName] += sheet.selectedMusic?.filter(m => 
                                tracks.some(t => t.id === (m as any).id)
                              ).length || 0;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            // Create histogram data with optimized binning
                            const values = Object.values(playsByCompany);
                            const max = Math.max(...values, 1); // Ensure we have at least one bin
                            const min = Math.min(...values, 0);
                            const binCount = 8;
                            const binSize = (max - min) / binCount;
                            
                            const bins = new Array(binCount).fill(0);
                            values.forEach(value => {
                              const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
                              bins[binIndex]++;
                            });
                            
                            return bins.map((count, i) => ({
                              range: `${Math.round(min + i * binSize)}-${Math.round(min + (i + 1) * binSize)}`,
                              count
                            }));
                          })()}
                          margin={{ top: 20, right: 20, left: 60, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="range" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                            label={{ value: 'Plays per Company', position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis 
                            label={{ value: 'Number of Companies', angle: -90, position: 'insideLeft', offset: 10 }}
                          />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8">
                            {new Array(8).fill(0).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      Distribution showing how many companies achieve different play counts
                    </div>
                  </div>

                  {/* Recent Plays */}
                  <div>
                    <h4 className="font-semibold mb-4">Recent Plays</h4>
                    <div className="space-y-2">
                      {logSheets
                        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                        .slice(0, 5)
                        .map(sheet => (
                          <div key={sheet.id} className="p-2 bg-muted/50 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{sheet.company?.companyName}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(sheet.createdDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {sheet.selectedMusic?.filter(m => 
                                tracks.some(t => t.id === (m as any).id)
                              ).length || 0} tracks played
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Track Performance Details */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Track Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tracks.map(track => {
                    const trackPlays = logSheets.reduce((count, sheet) => 
                      count + (sheet.selectedMusic?.filter(m => (m as any).id === track.id).length || 0)
                    , 0);
                    const companies = logSheets.reduce((acc, sheet) => {
                      if (sheet.selectedMusic?.some(m => (m as any).id === track.id)) {
                        acc.add(sheet.company?.companyName || 'Unknown');
                      }
                      return acc;
                    }, new Set<string>());
                    
                    return (
                      <div key={track.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{track.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Played by {companies.size} companies
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{trackPlays}</div>
                            <div className="text-sm text-muted-foreground">total plays</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Track Performance Drilldown */}
        <Card>
          <CardHeader>
            <CardTitle>Track Performance Drilldown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || tracks.length === 0 ? (
              <div className="h-24 bg-muted rounded animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Search by title, artist..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div className="md:col-span-2">
                    <Select value={selectedTrackId?.toString() || ''} onValueChange={(v) => setSelectedTrackId(v ? parseInt(v) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a track to analyze" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTracks.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Compact company distribution pie */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Company Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 180 }}>
                        {chartData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
                        ) : (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={chartData} dataKey="count" nameKey="company" outerRadius={70} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {chartData.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Compact bar chart of companies */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Play Count Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 180 }}>
                        {chartData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
                        ) : (
                          <ResponsiveContainer>
                            <BarChart 
                              data={(() => {
                                if (!chartData.length) return [];
                                const counts = chartData.map(d => d.count);
                                const max = Math.max(...counts, 1);
                                const min = Math.min(...counts, 0);
                                const binCount = 6;
                                const binSize = (max - min) / binCount;
                                
                                const bins = new Array(binCount).fill(0);
                                counts.forEach(value => {
                                  const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
                                  bins[binIndex]++;
                                });
                                
                                return bins.map((count, i) => ({
                                  range: `${Math.round(min + i * binSize)}-${Math.round(min + (i + 1) * binSize)}`,
                                  count
                                }));
                              })()} 
                              margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="range" 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0} 
                                height={60}
                                label={{ value: 'Plays', position: 'insideBottom', offset: -10 }}
                              />
                              <YAxis 
                                label={{ value: 'Companies', angle: -90, position: 'insideLeft' }} 
                              />
                              <Tooltip />
                              <Bar dataKey="count" fill="#8884d8" radius={[4,4,0,0]}>
                                {new Array(6).fill(0).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Compact timeline */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Selections Over Time</CardTitle></CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 180 }}>
                        {selectedTimeline.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
                        ) : (
                          <ResponsiveContainer>
                            <LineChart data={selectedTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" hide />
                              <YAxis hide />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#00C49F" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArtistPerformance;
