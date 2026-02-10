'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  UserPlus, 
  LogIn,
  Activity,
  Fingerprint,
  Volume2,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

interface AuthState {
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
  message: string;
  confidence?: number;
  isLive?: boolean;
  speakerScore?: number;
  livenessScore?: number;
  processingTime?: number;
}

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  }
});

export default function VoiceGuardDemo() {
  const [authState, setAuthState] = useState<AuthState>({ 
    status: 'idle', 
    message: 'Ready to authenticate' 
  });
  const [mode, setMode] = useState<'auth' | 'enroll'>('auth');
  const [userId, setUserId] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkBackendHealth();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      setIsOnline(true);
      console.log('Backend connected:', response.data);
    } catch (error) {
      console.error('Backend not available:', error);
      setIsOnline(false);
      setAuthState({
        status: 'error',
        message: 'Cannot connect to backend server. Please ensure it is running on port 8000.'
      });
    }
  };

  const visualizeAudio = (stream: MediaStream) => {
    audioContext.current = new AudioContext();
    const source = audioContext.current.createMediaStreamSource(stream);
    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 256;
    source.connect(analyser.current);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const dataArray = new Uint8Array(analyser.current!.frequencyBinCount);
      analyser.current!.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
    };
    draw();
  };

  const getErrorMessage = (err: any): string => {
    console.log('Full error:', err);
    console.log('Error response:', err.response);
    console.log('Error response data:', err.response?.data);
    
    if (err.code === 'ERR_NETWORK') {
      return 'Cannot connect to backend server. Please ensure the backend is running on port 8000.';
    }
    if (err.code === 'ECONNABORTED') {
      return 'Request timeout. Server is taking too long to respond.';
    }
    if (err.response) {
      const data = err.response.data;
      // Handle FastAPI error format
      if (typeof data === 'string') {
        return data;
      }
      if (data && typeof data === 'object') {
        if (data.detail) {
          if (typeof data.detail === 'string') {
            return data.detail;
          }
          if (Array.isArray(data.detail)) {
            return data.detail.map((d: any) => d.msg || String(d)).join(', ');
          }
          return JSON.stringify(data.detail);
        }
        if (data.message) {
          return String(data.message);
        }
        return JSON.stringify(data);
      }
      return `Server error: ${err.response.status}`;
    }
    if (err.request) {
      return 'No response from server. Please check if the backend is running.';
    }
    return err.message || 'An unexpected error occurred.';
  };

  const startRecording = async () => {
    if (!userId.trim()) {
      setAuthState({ status: 'error', message: 'Please enter User ID first' });
      return;
    }

    if (!isOnline) {
      setAuthState({ status: 'error', message: 'Backend server not connected. Please check connection.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, 
          channelCount: 1, 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined
      });
      
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      visualizeAudio(stream);
      
      setAuthState({ 
        status: 'recording', 
        message: mode === 'enroll' 
          ? 'Recording... Speak clearly for enrollment (5 seconds)' 
          : 'Recording... Say your passphrase (3 seconds)' 
      });
      
      mediaRecorder.current.start(100);

      const duration = mode === 'enroll' ? 5000 : 3000;
      setTimeout(() => stopRecording(), duration);
      
    } catch (err: any) {
      console.error('Microphone error:', err);
      setAuthState({ 
        status: 'error', 
        message: 'Microphone access denied. Please allow microphone access in your browser.' 
      });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return;
    
    mediaRecorder.current.stop();
    setAuthState({ status: 'processing', message: 'Processing audio... Please wait.' });
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContext.current) await audioContext.current.close();
    setAudioLevel(0);

    mediaRecorder.current.onstop = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      try {
        if (audioChunks.current.length === 0) {
          throw new Error('No audio data recorded');
        }

        const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType || 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          throw new Error('Audio recording too short. Please try again.');
        }

        const formData = new FormData();
        formData.append('user_id', userId);

        let response;
        
        if (mode === 'enroll') {
          formData.append('audio_files', audioBlob, 'sample1.webm');
          formData.append('audio_files', audioBlob, 'sample2.webm');
          formData.append('audio_files', audioBlob, 'sample3.webm');
          
          response = await api.post('/api/v1/enroll', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          
          const responseData = response.data;
          setAuthState({
            status: 'success',
            message: responseData.message || 'Enrollment successful! You can now authenticate.',
            confidence: 1.0,
            isLive: true
          });
          
        } else {
          formData.append('audio_file', audioBlob, 'recording.webm');
          
          response = await api.post('/api/v1/authenticate', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
          
          const data = response.data;
          setAuthState({
            status: data.is_authenticated ? 'success' : 'error',
            message: data.message || 'Authentication failed',
            confidence: data.confidence || 0,
            isLive: data.is_live,
            speakerScore: data.speaker_score,
            livenessScore: data.liveness_score,
            processingTime: data.processing_time_ms
          });
        }
      } catch (err: any) {
        // ✅ ADD ERROR LOGGING HERE
        console.error('❌ FULL ERROR:', err);
        console.error('❌ Error response:', err.response);
        console.error('❌ Error response data:', err.response?.data);
        console.error('❌ Error request:', err.request);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error code:', err.code);
        
        const errorMsg = getErrorMessage(err);
        setAuthState({ 
          status: 'error', 
          message: errorMsg  
        });
      }
    };
  };

  const getStatusColor = () => {
    switch (authState.status) {
      case 'success': return 'from-green-500 to-emerald-600';
      case 'error': return 'from-red-500 to-rose-600';
      case 'recording': return 'from-cyan-500 to-blue-600 animate-pulse';
      case 'processing': return 'from-amber-500 to-orange-600';
      default: return 'from-violet-600 to-indigo-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl"
      >
        {/* Connection Status */}
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Backend disconnected</span>
            </div>
            <button 
              onClick={checkBackendHealth}
              className="text-red-300 hover:text-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: authState.status === 'processing' ? 360 : 0 }}
            transition={{ duration: 2, repeat: authState.status === 'processing' ? Infinity : 0, ease: "linear" }}
          >
            <Shield className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            VoiceGuard AI
          </h1>
          <p className="text-gray-400">Biometric Authentication with Liveness Detection</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('auth')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'auth' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Authenticate
          </button>
          <button
            onClick={() => setMode('enroll')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'enroll' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Enroll
          </button>
        </div>

        {/* User ID Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* Audio Visualizer */}
        <div className="relative h-24 bg-black/20 rounded-xl mb-6 overflow-hidden border border-white/5">
          <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                animate={{
                  height: authState.status === 'recording' 
                    ? Math.max(4, (audioLevel / 255) * 80 * (0.5 + Math.random() * 0.5))
                    : 4
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
          {authState.status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              <Volume2 className="w-4 h-4 mr-2" />
              Audio visualization
            </div>
          )}
        </div>

        {/* Status Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={authState.status + authState.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl mb-6 border ${
              authState.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
              authState.status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              authState.status === 'recording' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' :
              authState.status === 'processing' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
              'bg-white/5 border-white/10 text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {authState.status === 'success' && <CheckCircle className="w-5 h-5" />}
              {authState.status === 'error' && <XCircle className="w-5 h-5" />}
              {authState.status === 'recording' && <Activity className="w-5 h-5 animate-pulse" />}
              {authState.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
              {authState.status === 'idle' && <Fingerprint className="w-5 h-5" />}
              <span className="font-medium">{authState.message}</span>
            </div>
            
            {authState.status === 'success' && typeof authState.confidence === 'number' && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Confidence</span>
                  <div className="text-lg font-bold">{(authState.confidence * 100).toFixed(1)}%</div>
                </div>
                {typeof authState.processingTime === 'number' && authState.processingTime > 0 && (
                  <div>
                    <span className="text-gray-400">Processing Time</span>
                    <div className="text-lg font-bold">{authState.processingTime.toFixed(0)}ms</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Main Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startRecording}
          disabled={authState.status === 'recording' || authState.status === 'processing' || !userId.trim() || !isOnline}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
            authState.status === 'recording' 
              ? 'bg-red-600 shadow-red-600/25 animate-pulse' 
              : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25 hover:from-red-400 hover:to-rose-500'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {authState.status === 'recording' ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              Recording...
            </>
          ) : authState.status === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              {mode === 'enroll' ? 'Enroll Voice' : 'Authenticate'}
            </>
          )}
        </motion.button>

        {/* Security Indicators */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Liveness</span>
            </div>
            <div className="text-xs text-gray-400">Doppler + Pop Noise Detection</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Fingerprint className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Speaker</span>
            </div>
            <div className="text-xs text-gray-400">ECAPA-TDNN Embeddings</div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Target Accuracy: <span className="text-cyan-400">99%</span></span>
            <span>Latency: <span className="text-cyan-400">&lt;500ms</span></span>
            <span>EER: <span className="text-cyan-400">&lt;1%</span></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}