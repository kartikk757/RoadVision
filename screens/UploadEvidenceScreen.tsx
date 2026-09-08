import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { colors, font, radius } from '../lib/theme';
import { DefectType, YoloBox } from '../lib/types';
import { gpsAPI } from '../services/gpsAPI';
import { yoloAPI } from '../services/yoloAPI';
import { createUploadedIncident } from '../services/backendData';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../lib/types';
import { VideoView } from 'expo-video/build/VideoView';
import { useVideoPlayer } from 'expo-video/build/VideoPlayer';

const defectTypes: DefectType[] = ['pothole', 'crack', 'damage', 'depression', 'marking'];
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function UploadEvidenceScreen() {
  const nav = useNavigation<Nav>();
  const { location, permission } = useCurrentLocation();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset>();
  const [box, setBox] = useState<YoloBox>();
  const [authority, setAuthority] = useState('Public Works Department');
  const [division, setDivision] = useState('Indore Division 4');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [detectedVideoUrl, setDetectedVideoUrl] = useState<string>();

  const pick = async () => {
    setMessage('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      exif: true,
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    setAsset(picked);
    setBox(undefined);
    setDetectedVideoUrl(undefined);
    setMessage('Media selected. Run AI analysis to inspect it.');
  };

  const analyze = async () => {
    if (!asset) return;
    setBusy(true);
    setMessage('AI is analyzing the uploaded media...');
    try {
      const predictions = await yoloAPI.inferMedia(asset.uri, asset.type === 'video' ? 'video' : 'image', asset.width, asset.height);
      const prediction = predictions[0];
      if (!prediction) throw new Error('No detection returned. Configure EXPO_PUBLIC_YOLO_ENDPOINT and verify the model server response.');
      const nextBox: YoloBox = {
        id: `UPLOAD-BOX-${Date.now()}`,
        trackId: 'UPLOAD-01',
        type: prediction.type,
        confidence: prediction.confidence,
        bbox: prediction.bbox,
        label: `${prediction.type.toUpperCase()} · ${(prediction.confidence * 100).toFixed(1)}%`,
      };
      setBox(nextBox);
      setDetectedVideoUrl(asset.type === 'video' ? yoloAPI.getLastVideoUrl() : undefined);
      setMessage('Detection complete. Review the authority destination, then send the complaint.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  };

  const sendComplaint = async () => {
    if (!asset || !box) return;
    if (!location) {
      setMessage(permission === 'denied' ? 'Location permission is required before sending a complaint.' : 'Waiting for current GPS location...');
      return;
    }
    setBusy(true);
    setMessage('Creating incident, evidence record, and authority complaint...');
    try {
      const geo = await gpsAPI.reverseGeocode(location.latitude, location.longitude);
      const result = await createUploadedIncident({
        mediaUri: asset.uri,
        mediaType: asset.type === 'video' ? 'video' : 'image',
        location: geo,
        box,
        authority,
        division,
      });
      setMessage(`Complaint ${result.complaintId} sent successfully.`);
      setTimeout(() => nav.navigate('ComplaintDetails', { id: result.complaintId }), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send complaint.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Upload Evidence" subtitle="AI complaint intake">
      <Text style={styles.lead}>Upload a road image or video. RoadVision analyzes it, attaches GPS context, and routes the complaint to the responsible authority.</Text>
      <Pressable onPress={pick} style={styles.dropzone}>
        {asset?.type === 'image' ? <Image source={{ uri: asset.uri }} style={styles.preview} /> : null}
        {!asset ? <Ionicons name="cloud-upload-outline" size={34} color={colors.blue} /> : null}
        <Text style={styles.dropTitle}>{asset ? 'Choose another file' : 'Choose image or video'}</Text>
        <Text style={styles.dropBody}>{asset ? asset.fileName ?? asset.uri : 'GPS metadata is read when available.'}</Text>
      </Pressable>
      {asset?.type === 'video' ? <View style={styles.videoNote}><Ionicons name="videocam-outline" size={18} color={colors.blue} /><Text style={styles.videoTxt}>Video selected · {asset.duration ? `${Math.round(asset.duration / 1000)}s` : 'duration available to analyzer'}</Text></View> : null}

      <View style={styles.panel}>
        <Text style={styles.k}>Authority destination</Text>
        <TextInput value={authority} onChangeText={setAuthority} placeholder="Authority" placeholderTextColor={colors.secondary} style={styles.input} />
        <TextInput value={division} onChangeText={setDivision} placeholder="Division" placeholderTextColor={colors.secondary} style={styles.input} />
      </View>

      <View style={styles.actions}>
        <Button title="Run AI analysis" icon="scan-outline" onPress={analyze} loading={busy} disabled={!asset || busy} />
        <Button title="Send complaint" icon="send-outline" variant="success" onPress={sendComplaint} loading={busy} disabled={!box || busy} />
      </View>

      {box ? (
        <View style={styles.result}>
          <View style={styles.resultTop}><Text style={styles.k}>Detection result</Text><StatusBadge kind={box.confidence >= 0.93 ? 'critical' : 'moderate'} label={`${(box.confidence * 100).toFixed(1)}%`} /></View>
          <Text style={styles.resultTitle}>{box.type}</Text>
          <Text style={styles.resultBody}>The uploaded {asset?.type ?? 'media'} is linked to the current GPS position and will create a complaint for {division}.</Text>
        </View>
      ) : null}
      {detectedVideoUrl ? <DetectedVideo uri={detectedVideoUrl} /> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, lineHeight: 21, marginTop: -6, marginBottom: 16 },
  dropzone: { minHeight: 210, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.blue, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 18, overflow: 'hidden' },
  preview: { width: '100%', height: 150, resizeMode: 'cover', borderRadius: radius.md, marginBottom: 12 },
  dropTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.text, marginTop: 10 },
  dropBody: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 5, textAlign: 'center' },
  videoNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.blueSoft },
  videoTxt: { fontFamily: font.medium, color: colors.blue, fontSize: 12 },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginTop: 14 },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1, color: colors.secondary, textTransform: 'uppercase' },
  input: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, color: colors.text, fontFamily: font.medium, marginTop: 10, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  result: { backgroundColor: colors.greenSoft, borderRadius: radius.lg, padding: 16, marginTop: 14 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontFamily: font.semibold, fontSize: 22, color: colors.text, textTransform: 'capitalize', marginTop: 10 },
  resultBody: { fontFamily: font.regular, color: colors.secondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  videoResult: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, marginTop: 14 },
  videoPlayer: { width: '100%', height: 220, marginTop: 10, backgroundColor: '#111' },
  message: { fontFamily: font.medium, color: colors.secondary, fontSize: 13, marginTop: 14, lineHeight: 19 },
});

function DetectedVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return (
    <View style={styles.videoResult}>
      <Text style={styles.k}>Detected video</Text>
      <VideoView player={player} style={styles.videoPlayer} nativeControls contentFit="contain" />
    </View>
  );
}
