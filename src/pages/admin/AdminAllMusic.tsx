import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable, { Column, Action } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/services/api';
import MusicPlayerDialog from '@/components/common/MusicPlayerDialog';
import VideoPlayerDialog from '@/components/common/VideoPlayerDialog';
import { ArtistWork } from '@/types';
import { Play, Download } from 'lucide-react';

const AdminAllMusic: React.FC = () => {
  const [music, setMusic] = useState<ArtistWork[]>([
    {
      id: 1,
      title: 'afric',
      artist: 'africo',
      artistWorkType: { id: 1, workTypeName: 'Pop' },
      albumName: 'afric',
      fileType: 'Video',
      fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: '3',
      uploadedDate: '2025-10-17',
      isrcCode: 'N/A',
      status: { id: 1, statusName: 'APPROVED' },
      featuredArtist: '',
      producer: '',
      workId: 'W1',
      country: 'Nigeria',
      artistId: 'A1',
      groupOrBandOrStageName: '',
      composer: '',
      author: '',
      arranger: '',
      publisher: '',
      publishersName: '',
      publisherAddress: '',
      publisherTelephone: '',
      recordedBy: '',
      addressOfRecordingCompany: '',
      recordingCompanyTelephone: '',
      labelName: '',
      dateRecorded: '',
      artistUploadType: { id: 1, typeName: 'video' },
      notes: '',
      user: { id: 1, email: 'africo@example.com', role: 'ARTIST', isEnabled: true, isEmailVerified: true, createdAt: '2025-10-17' },
    },
    {
      id: 2,
      title: 'banks',
      artist: 'banks',
      artistWorkType: { id: 2, workTypeName: 'Pop' },
      albumName: 'banks',
      fileType: 'Audio',
      fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '2',
      uploadedDate: '2025-10-17',
      isrcCode: 'N/A',
      status: { id: 2, statusName: 'APPROVED' },
      featuredArtist: '',
      producer: '',
      workId: 'W2',
      country: 'Nigeria',
      artistId: 'A2',
      groupOrBandOrStageName: '',
      composer: '',
      author: '',
      arranger: '',
      publisher: '',
      publishersName: '',
      publisherAddress: '',
      publisherTelephone: '',
      recordedBy: '',
      addressOfRecordingCompany: '',
      recordingCompanyTelephone: '',
      labelName: '',
      dateRecorded: '',
      artistUploadType: { id: 2, typeName: 'audio' },
      notes: '',
      user: { id: 2, email: 'banks@example.com', role: 'ARTIST', isEnabled: true, isEmailVerified: true, createdAt: '2025-10-17' },
    },
    {
      id: 3,
      title: 'Testing',
      artist: 'Banks',
      artistWorkType: { id: 3, workTypeName: 'Pop' },
      albumName: 'Kachazi',
      fileType: 'Audio',
      fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: '3minute',
      uploadedDate: '2025-10-17',
      isrcCode: 'N/A',
      status: { id: 3, statusName: 'APPROVED' },
      featuredArtist: '',
      producer: '',
      workId: 'W3',
      country: 'Nigeria',
      artistId: 'A3',
      groupOrBandOrStageName: '',
      composer: '',
      author: '',
      arranger: '',
      publisher: '',
      publishersName: '',
      publisherAddress: '',
      publisherTelephone: '',
      recordedBy: '',
      addressOfRecordingCompany: '',
      recordingCompanyTelephone: '',
      labelName: '',
      dateRecorded: '',
      artistUploadType: { id: 3, typeName: 'audio' },
      notes: '',
      user: { id: 3, email: 'testing@example.com', role: 'ARTIST', isEnabled: true, isEmailVerified: true, createdAt: '2025-10-17' },
    },
    {
      id: 4,
      title: 'Tekno',
      artist: 'Banks',
      artistWorkType: { id: 4, workTypeName: 'Pop' },
      albumName: 'Kachazi',
      fileType: 'Audio',
      fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: '3minute',
      uploadedDate: '2025-10-17',
      isrcCode: 'N/A',
      status: { id: 4, statusName: 'APPROVED' },
      featuredArtist: '',
      producer: '',
      workId: 'W4',
      country: 'Nigeria',
      artistId: 'A4',
      groupOrBandOrStageName: '',
      composer: '',
      author: '',
      arranger: '',
      publisher: '',
      publishersName: '',
      publisherAddress: '',
      publisherTelephone: '',
      recordedBy: '',
      addressOfRecordingCompany: '',
      recordingCompanyTelephone: '',
      labelName: '',
      dateRecorded: '',
      artistUploadType: { id: 4, typeName: 'audio' },
      notes: '',
      user: { id: 4, email: 'tekno@example.com', role: 'ARTIST', isEnabled: true, isEmailVerified: true, createdAt: '2025-10-17' },
    },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerTrack, setPlayerTrack] = useState<{ id: number; title: string; artist?: string; fileUrl: string; fileType?: string } | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoTrack, setVideoTrack] = useState<{ id: number; title: string; artist?: string; fileUrl: string; fileType?: string } | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const isVideo = (m: ArtistWork) => {
    const ft = (m.fileType || '').toLowerCase();
    const url = (m.fileUrl || '').toLowerCase();
    return ft.startsWith('video') || /(.mp4|.mov|.avi|.mkv|.webm)$/.test(url);
  };
  const playAtIndex = (idx: number) => {
    const m = music[idx];
    if (!m) return;
    setCurrentIndex(idx);
    if (isVideo(m)) {
      setVideoTrack({ id: m.id, title: m.title, artist: m.artist, fileUrl: m.fileUrl, fileType: m.fileType });
      setVideoOpen(true);
      setPlayerOpen(false);
    } else {
      setPlayerTrack({ id: m.id, title: m.title, artist: m.artist, fileUrl: m.fileUrl, fileType: m.fileType });
      setPlayerOpen(true);
      setVideoOpen(false);
    }
  };

  const columns: Column<ArtistWork>[] = [
    { key: 'title', header: 'Title', accessor: 'title', className: 'font-medium' },
    { key: 'artist', header: 'Artist', accessor: 'artist' },
    { key: 'artistWorkType', header: 'Genre', accessor: (item) => item.artistWorkType?.workTypeName || '-' },
    { key: 'albumName', header: 'Album', accessor: 'albumName' },
    { key: 'mediaType', header: 'Type', accessor: (item) => isVideo(item) ? 'Video' : 'Audio', render: (value, item) => (
      <span className="flex items-center gap-1">{isVideo(item) ? <Play className="h-4 w-4 text-blue-500" /> : <Play className="h-4 w-4 text-green-500" />}{value}</span>
    ) },
    { key: 'actions', header: 'Actions', accessor: undefined, render: (_value, item) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => {
          const idx = music.findIndex(m => m.id === item.id);
          playAtIndex(Math.max(0, idx));
        }}>
          <Play className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          if (item.fileUrl) {
            const link = document.createElement('a');
            link.href = item.fileUrl;
            link.download = `${item.title}.${item.fileType || 'mp3'}`;
            link.click();
          } else {
            toast({ title: 'Download Not Available', description: 'No audio file available for download', variant: 'destructive' });
          }
        }}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ) },
  ];

  const actions: Action<ArtistWork>[] = [
    {
      label: 'Play',
      icon: Play,
      onClick: (musicItem) => {
        if (!musicItem.fileUrl) {
          toast({ title: 'Media Not Available', description: 'No media file available for this track', variant: 'destructive' });
          return;
        }
        const idx = music.findIndex(m => m.id === musicItem.id);
        playAtIndex(Math.max(0, idx));
      },
    },
    {
      label: 'Download',
      icon: Download,
      onClick: (music) => {
        if (music.fileUrl) {
          const link = document.createElement('a');
          link.href = music.fileUrl;
          link.download = `${music.title}.${music.fileType || 'mp3'}`;
          link.click();
        } else {
          toast({
            title: "Download Not Available",
            description: "No audio file available for download",
            variant: "destructive",
          });
        }
      },
    },
  ];

  return (
    <DashboardLayout title="All Music">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">All Music</h1>
        <DataTable
          data={music}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={true}
          emptyMessage="No music available"
        />
        <MusicPlayerDialog
          open={playerOpen}
          onOpenChange={setPlayerOpen}
          track={playerTrack}
          onPrev={() => currentIndex > 0 ? playAtIndex(currentIndex - 1) : undefined}
          onNext={() => currentIndex < music.length - 1 ? playAtIndex(currentIndex + 1) : undefined}
        />
        <VideoPlayerDialog
          open={videoOpen}
          onOpenChange={setVideoOpen}
          track={videoTrack as any}
          onPrev={() => currentIndex > 0 ? playAtIndex(currentIndex - 1) : undefined}
          onNext={() => currentIndex < music.length - 1 ? playAtIndex(currentIndex + 1) : undefined}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminAllMusic;
