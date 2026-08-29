// Video & Audio session page for Dokkhota — Native WebRTC calling with audio-only fallback
// Uses native RTCPeerConnection and Socket.IO for signaling
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import bookingService from '../services/bookingService.js';
import { io } from 'socket.io-client';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ],
};

// ── Call status constants ────────────────────────────────────────────
const STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
  ENDED: 'ended',
  ERROR: 'error',
};

const VideoSessionPage = () => {
  const { sessionId: bookingId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();
  const currentUserId = user?.id || user?._id;

  // State
  const [callStatus, setCallStatus] = useState(STATUS.LOADING);
  const [booking, setBooking] = useState(null);
  const [partner, setPartner] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const partnerRef = useRef(null);
  partnerRef.current = partner;

  // ── Call duration timer ────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Cleanup resources ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
  }, []);

  // ── Fetch booking details ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await bookingService.getBookings(accessToken);
        const found = (res.data.bookings || []).find((b) => b._id === bookingId);
        if (!found) {
          setErrorMsg('Booking not found. Please return to your dashboard.');
          setCallStatus(STATUS.ERROR);
          return;
        }
        setBooking(found);

        const isTeacher = (found.teacherId?._id || found.teacherId) === currentUserId;
        const otherPerson = isTeacher ? found.studentId : found.teacherId;
        setPartner(otherPerson);

        // Set to ready if not already incoming/calling
        setCallStatus((prev) => (prev === STATUS.LOADING ? STATUS.READY : prev));
      } catch (err) {
        setErrorMsg('Failed to load session details.');
        setCallStatus(STATUS.ERROR);
      }
    };

    fetchBooking();
  }, [accessToken, bookingId, currentUserId, isAuthenticated]);

  // ── Get local camera/mic stream with audio fallback ────────────────
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Your browser does not support audio/video calling or is running in an insecure context (HTTPS/localhost required).');
      setCallStatus(STATUS.ERROR);
      return null;
    }

    let stream = null;
    let cameraFound = true;

    // 1. First attempt: Try both video and audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraFound = true;
      setHasCamera(true);
      setIsVideoOff(false);
    } catch (videoErr) {
      console.warn('Camera request failed, falling back to microphone-only:', videoErr);

      // 2. Second attempt: Microphone-only fallback (for PCs without webcams)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        cameraFound = false;
        setHasCamera(false);
        setIsVideoOff(true);
      } catch (audioErr) {
        console.error('Microphone request also failed:', audioErr);
        if (audioErr.name === 'NotAllowedError' || audioErr.name === 'PermissionDeniedError') {
          setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser (click the lock/tune icon in the address bar) and try again.');
        } else if (audioErr.name === 'NotFoundError' || audioErr.name === 'DevicesNotFoundError') {
          setErrorMsg('No microphone detected on your computer. Please connect a microphone or headset and try again.');
        } else {
          setErrorMsg(`Could not access audio device: ${audioErr.message || 'Please check your microphone settings'}`);
        }
        setCallStatus(STATUS.ERROR);
        return null;
      }
    }

    localStreamRef.current = stream;
    if (localVideoRef.current && cameraFound) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  // ── Create native WebRTC PeerConnection ────────────────────────────
  const createPeerConnection = useCallback(async (isInitiator, targetPartnerId) => {
    const stream = localStreamRef.current || (await getLocalStream());
    if (!stream) return null;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;
    pendingCandidatesRef.current = [];

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_signal', {
          to: targetPartnerId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      const checkVideo = () => {
        const vTracks = remoteStream.getVideoTracks();
        setRemoteHasVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled && t.readyState === 'live'));
      };

      checkVideo();

      remoteStream.getVideoTracks().forEach((t) => {
        t.onmute = checkVideo;
        t.onunmute = checkVideo;
        t.onended = checkVideo;
      });

      setCallStatus(STATUS.CONNECTED);
      startTimer();
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus(STATUS.CONNECTED);
        startTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn('WebRTC connection state:', pc.connectionState);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('webrtc_signal', {
          to: targetPartnerId,
          signal: { type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
        setErrorMsg('Failed to establish connection.');
        setCallStatus(STATUS.ERROR);
      }
    }

    return pc;
  }, [getLocalStream, startTimer]);

  // ── Handle incoming WebRTC signals ────────────────────────────────
  const handleSignal = useCallback(async (signal, senderId) => {
    const targetPartnerId = senderId || partnerRef.current?._id || partnerRef.current?.id || partnerRef.current;

    try {
      if (signal.type === 'offer') {
        let pc = peerConnectionRef.current;
        if (!pc || pc.signalingState === 'closed') {
          pc = await createPeerConnection(false, targetPartnerId);
        }
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp || signal));

        // Add any ICE candidates that arrived before the remote description was set
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Could not add queued ICE candidate:', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit('webrtc_signal', {
          to: targetPartnerId,
          signal: { type: 'answer', sdp: pc.localDescription },
        });
      } else if (signal.type === 'answer') {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== 'closed') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp || signal));

          while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('Could not add queued ICE candidate:', e);
            }
          }
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }
    } catch (err) {
      console.error('Error handling WebRTC signal:', err);
    }
  }, [createPeerConnection]);

  // ── Setup Socket.IO for signaling ──────────────────────────────────
  useEffect(() => {
    if (!currentUserId || !bookingId) return;

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join', currentUserId);

    // Check if partner is already waiting/calling in this session
    socket.emit('check_call_status', { bookingId });

    // Listen for incoming call
    socket.on('incoming_call', ({ from, fromName, bookingId: callBookingId }) => {
      if (callBookingId === bookingId || !callBookingId) {
        setCallerInfo({ from, fromName });
        setCallStatus(STATUS.INCOMING);
      }
    });

    // Caller receives acceptance from recipient
    socket.on('call_accepted', async () => {
      const targetPartnerId = partnerRef.current?._id || partnerRef.current?.id || partnerRef.current;
      await createPeerConnection(true, targetPartnerId);
      setCallStatus(STATUS.CONNECTED);
    });

    // Caller receives rejection
    socket.on('call_rejected', () => {
      setCallStatus(STATUS.ENDED);
      cleanup();
    });

    // Receive WebRTC signal from the other peer
    socket.on('webrtc_signal', ({ from, signal }) => {
      if (signal) {
        handleSignal(signal, from);
      }
    });

    // Other party ended the call
    socket.on('call_ended', () => {
      setCallStatus(STATUS.ENDED);
      cleanup();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, bookingId, cleanup, createPeerConnection, handleSignal]);

  // ── User actions ──────────────────────────────────────────────────
  const handleCall = async () => {
    const stream = await getLocalStream();
    if (!stream) return;

    const partnerId = partner?._id || partner?.id || partner;
    setCallStatus(STATUS.CALLING);

    socketRef.current?.emit('call_user', {
      from: currentUserId,
      to: partnerId,
      fromName: user?.name || 'Someone',
      bookingId,
    });
  };

  const handleAccept = async () => {
    const stream = await getLocalStream();
    if (!stream) return;

    const callerId = callerInfo?.from || partner?._id || partner?.id || partner;
    socketRef.current?.emit('accept_call', {
      from: callerId,
      to: currentUserId,
      bookingId,
    });

    await createPeerConnection(false, callerId);
    setCallStatus(STATUS.CONNECTED);
  };

  const handleReject = () => {
    const callerId = callerInfo?.from || partner?._id || partner?.id || partner;
    socketRef.current?.emit('reject_call', {
      from: callerId,
      to: currentUserId,
      bookingId,
    });
    setCallStatus(STATUS.READY);
    setCallerInfo(null);
  };

  const handleEndCall = () => {
    const partnerId = partner?._id || partner?.id || partner;
    socketRef.current?.emit('end_call', { to: partnerId, bookingId });
    setCallStatus(STATUS.ENDED);
    cleanup();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextMuted = !isMuted;
      audioTracks.forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = () => {
    if (!hasCamera) return;
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const nextVideoOff = !isVideoOff;
      videoTracks.forEach((t) => {
        t.enabled = !nextVideoOff;
      });
      setIsVideoOff(nextVideoOff);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className='min-h-screen bg-gray-950 text-white'>

      {/* ── Error state ────────────────────────────────────────────── */}
      {callStatus === STATUS.ERROR && (
        <div className='flex flex-col items-center justify-center min-h-screen px-4'>
          <div className='bg-red-950/70 border border-red-800 rounded-3xl p-8 max-w-lg text-center shadow-2xl'>
            <div className='w-16 h-16 rounded-full bg-red-900/50 text-red-300 flex items-center justify-center text-3xl mx-auto mb-4'>
              ⚠️
            </div>
            <h2 className='text-2xl font-bold mb-3'>Media Access Notice</h2>
            <p className='text-red-200 text-sm leading-relaxed mb-6'>{errorMsg}</p>
            <div className='flex gap-3 justify-center'>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setCallStatus(STATUS.READY);
                }}
                className='bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition'
              >
                Try Again
              </button>
              <Link to='/dashboard' className='bg-gray-800 text-gray-200 px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition'>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading state ──────────────────────────────────────────── */}
      {callStatus === STATUS.LOADING && (
        <div className='flex items-center justify-center min-h-screen'>
          <p className='text-gray-400 text-lg animate-pulse'>Loading session...</p>
        </div>
      )}

      {/* ── Ready / Calling / Incoming / Connected / Ended ─────────── */}
      {callStatus !== STATUS.ERROR && callStatus !== STATUS.LOADING && (
        <div className='flex flex-col h-screen'>

          {/* ── Top bar ────────────────────────────────────────────── */}
          <div className='flex items-center justify-between px-6 py-4 bg-gray-900/90 border-b border-gray-800 z-10'>
            <div className='flex items-center gap-3'>
              <Link to='/dashboard' className='text-gray-400 hover:text-white text-sm transition'>← Dashboard</Link>
              <span className='text-gray-600'>|</span>
              <h1 className='font-semibold text-sm flex items-center gap-2'>
                <span>Session with {partner?.name || 'Partner'}</span>
                {!hasCamera && (
                  <span className='text-[11px] bg-slate-800 border border-slate-700 text-amber-300 px-2 py-0.5 rounded-md'>
                    🎙️ Audio Mode
                  </span>
                )}
              </h1>
            </div>
            <div className='flex items-center gap-4'>
              {callStatus === STATUS.CONNECTED && (
                <span className='text-emerald-400 text-sm font-mono flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full'>
                  <span className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse'></span>
                  {formatDuration(callDuration)}
                </span>
              )}
              {booking?.listingId?.title && (
                <span className='text-xs text-gray-400 truncate max-w-xs'>Session: {booking.listingId.title}</span>
              )}
            </div>
          </div>

          {/* ── Main call container ─────────────────────────────────── */}
          <div className='flex-1 relative bg-gray-950 flex items-center justify-center overflow-hidden'>

            {/* Remote video element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${callStatus === STATUS.CONNECTED && remoteHasVideo ? 'block' : 'hidden'}`}
            />

            {/* Remote view when call is CONNECTED but remote has NO video (Audio Call) */}
            {callStatus === STATUS.CONNECTED && !remoteHasVideo && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950'>
                <div className='relative mb-6'>
                  <div className='absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping'></div>
                  <div className='relative w-32 h-32 rounded-full bg-gray-800 border-4 border-emerald-500/80 flex items-center justify-center text-5xl font-bold text-emerald-400 shadow-2xl overflow-hidden'>
                    {partner?.avatarUrl ? (
                      <img src={partner.avatarUrl} alt={partner.name} className='w-full h-full object-cover' />
                    ) : (
                      partner?.name?.charAt(0).toUpperCase() || 'P'
                    )}
                  </div>
                </div>
                <h2 className='text-2xl font-bold text-white mb-1'>{partner?.name}</h2>
                <p className='text-emerald-400 text-sm font-medium flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
                  Audio Session Connected
                </p>
              </div>
            )}

            {/* Pre-call and status states */}
            {callStatus !== STATUS.CONNECTED && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-950'>
                {/* User avatar */}
                <div className='w-28 h-28 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-4xl font-bold text-gray-400 mb-6 overflow-hidden'>
                  {partner?.avatarUrl ? (
                    <img src={partner.avatarUrl} alt={partner.name} className='w-full h-full object-cover' />
                  ) : (
                    partner?.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                {/* Status-specific content */}
                {callStatus === STATUS.READY && (
                  <div className='text-center max-w-sm px-4'>
                    <h2 className='text-xl font-semibold text-gray-200 mb-2'>Ready to start session</h2>
                    <p className='text-gray-400 text-sm mb-6'>
                      Connect with {partner?.name || 'your session partner'}. Works with both video and audio.
                    </p>
                    <button
                      onClick={handleCall}
                      className='bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold text-base transition shadow-lg shadow-emerald-900/30 flex items-center gap-3 mx-auto'
                    >
                      <span>📞</span>
                      <span>Join Call</span>
                    </button>
                  </div>
                )}

                {callStatus === STATUS.CALLING && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-200 mb-2'>Calling {partner?.name}...</h2>
                    <p className='text-gray-400 text-sm animate-pulse'>Waiting for partner to answer...</p>
                  </div>
                )}

                {callStatus === STATUS.INCOMING && (
                  <div className='text-center animate-fade-in'>
                    <div className='w-16 h-16 rounded-full bg-emerald-900/40 border-2 border-emerald-500 flex items-center justify-center text-3xl font-bold text-emerald-400 mx-auto mb-4 animate-bounce'>
                      📞
                    </div>
                    <h2 className='text-2xl font-bold text-white mb-2'>
                      {callerInfo?.fromName || partner?.name || 'Partner'} is calling you
                    </h2>
                    <p className='text-gray-400 text-sm mb-8'>Incoming call for this session</p>
                    <div className='flex gap-4 justify-center'>
                      <button
                        onClick={handleAccept}
                        className='bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold text-base transition shadow-lg shadow-emerald-900/40 flex items-center gap-2'
                      >
                        <span>✓</span>
                        <span>Accept Call</span>
                      </button>
                      <button
                        onClick={handleReject}
                        className='bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-semibold text-base transition shadow-lg shadow-rose-900/40 flex items-center gap-2'
                      >
                        <span>✗</span>
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                )}

                {callStatus === STATUS.ENDED && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-200 mb-2'>Call ended</h2>
                    <p className='text-gray-400 text-sm mb-6'>
                      {callDuration > 0 ? `Duration: ${formatDuration(callDuration)}` : 'The session call has ended.'}
                    </p>
                    <div className='flex gap-4 justify-center'>
                      <button
                        onClick={() => { setCallStatus(STATUS.READY); setCallDuration(0); }}
                        className='bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition'
                      >
                        Call again
                      </button>
                      <Link
                        to='/dashboard'
                        className='bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition'
                      >
                        Back to Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Local preview (picture-in-picture in bottom-right) */}
            <div className='absolute bottom-6 right-6 w-48 sm:w-56 aspect-video rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-900'>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${hasCamera && !isVideoOff ? 'block' : 'hidden'}`}
              />
              {(!hasCamera || isVideoOff) && (
                <div className='absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-gray-400 text-xs gap-1.5 p-3 text-center'>
                  <div className='w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-emerald-400 font-bold flex items-center justify-center text-sm'>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className='font-medium text-[11px] text-gray-300'>
                    {!hasCamera ? '🎙️ Mic Active (No Cam)' : '📷 Camera Off'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom control bar ──────────────────────────────────── */}
          {(callStatus === STATUS.CONNECTED || callStatus === STATUS.CALLING) && (
            <div className='flex items-center justify-center gap-4 px-6 py-5 bg-gray-900/90 border-t border-gray-800 z-10'>
              {/* Mic toggle */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg ${
                  isMuted ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              {/* Camera toggle */}
              <button
                onClick={toggleVideo}
                disabled={!hasCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg ${
                  !hasCamera
                    ? 'bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed'
                    : isVideoOff
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                }`}
                title={!hasCamera ? 'No camera detected' : isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {hasCamera ? (isVideoOff ? '📷' : '📹') : '🚫'}
              </button>

              {/* End call */}
              <button
                onClick={handleEndCall}
                className='w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xl font-bold transition shadow-lg shadow-rose-900/40'
                title='End call'
              >
                📞
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoSessionPage;
