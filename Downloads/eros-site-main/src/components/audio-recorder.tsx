import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg w-full">
      {!isRecording && !audioBlob ? (
        <Button variant="ghost" size="icon" onClick={startRecording} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
          <Mic className="h-5 w-5" />
        </Button>
      ) : isRecording ? (
        <>
          <div className="flex-1 flex items-center gap-3 px-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500">{formatTime(recordingTime)}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={stopRecording}>
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </>
      ) : (
        <>
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" />
          <Button variant="ghost" size="icon" onClick={() => { setAudioBlob(null); onCancel(); }}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button size="icon" onClick={handleSend} className="bg-primary text-primary-foreground rounded-full h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {(!isRecording && !audioBlob) && (
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          Cancelar
        </Button>
      )}
    </div>
  );
}
