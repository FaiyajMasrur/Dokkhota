// Video session page for Dokkhota — Feature 8: WebRTC-based video calling
// Uses simple-peer for WebRTC and Socket.IO for signaling
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import bookingService from '../services/bookingService.js';
import { io } from 'socket.io-client';

// simple-peer is loaded dynamically to avoid Node.js polyfill issues
let SimplePeer = null;

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
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);

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
        setCallStatus(STATUS.READY);
      } catch (err) {
        setErrorMsg('Failed to load session details.');
        setCallStatus(STATUS.ERROR);
      }
    };

    fetchBooking();
  }, [accessToken, bookingId, currentUserId, isAuthenticated]);

  // ── Setup Socket.IO for signaling ──────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join', currentUserId);

    // Listen for incoming call
    socket.on('incoming_call', ({ from, fromName, bookingId: callBookingId }) => {
      if (callBookingId === bookingId || !callBookingId) {
        setCallerInfo({ from, fromName });
        setCallStatus(STATUS.INCOMING);
      }
    });

    // Caller receives acceptance
    socket.on('call_accepted', () => {
      // The callee accepted — now we create the peer as initiator
      startPeerConnection(true);
    });

    // Caller receives rejection
    socket.on('call_rejected', () => {
      setCallStatus(STATUS.ENDED);
      cleanup();
    });

    // Receive WebRTC signal from the other peer
    socket.on('webrtc_signal', ({ signal }) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.signal(signal);
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
  }, [currentUserId, bookingId]);

  // ── Get local camera/mic stream ────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to access camera/mic:', err);
      setErrorMsg('Could not access your camera or microphone. Please allow permission and try again.');
      setCallStatus(STATUS.ERROR);
      return null;
    }
  }, []);

  // ── Start WebRTC peer connection ───────────────────────────────────
  const startPeerConnection = useCallback(async (initiator) => {
    const stream = localStreamRef.current || (await getLocalStream());
    if (!stream) return;

    // Dynamically load simple-peer to avoid Node.js polyfill issues at startup
    if (!SimplePeer) {
      try {
        const mod = await import('simple-peer');
        SimplePeer = mod.default || mod;
      } catch (err) {
        console.error('Failed to load simple-peer:', err);
        setErrorMsg('Video calling module could not be loaded.');
        setCallStatus(STATUS.ERROR);
        return;
      }
    }

    const partnerId = partner?._id || partner;

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('webrtc_signal', {
        to: partnerId,
        signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setCallStatus(STATUS.CONNECTED);
      startTimer();
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setCallStatus(STATUS.ENDED);
      cleanup();
    });

    peer.on('close', () => {
      setCallStatus(STATUS.ENDED);
      cleanup();
    });

    peerRef.current = peer;
  }, [getLocalStream, partner]);

  // ── Call duration timer ────────────────────────────────────────────
  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Cleanup resources ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (peerRef.current && !peerRef.current.destroyed) peerRef.current.destroy();
    peerRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // ── User actions ──────────────────────────────────────────────────
  const handleCall = async () => {
    const stream = await getLocalStream();
    if (!stream) return;

    const partnerId = partner?._id || partner;
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

    const callerId = callerInfo?.from;
    socketRef.current?.emit('accept_call', {
      from: callerId,
      to: currentUserId,
    });

    // Callee creates the peer as non-initiator and waits for offer signal
    startPeerConnection(false);
    setCallStatus(STATUS.CONNECTED);
  };

  const handleReject = () => {
    const callerId = callerInfo?.from;
    socketRef.current?.emit('reject_call', {
      from: callerId,
      to: currentUserId,
    });
    setCallStatus(STATUS.READY);
    setCallerInfo(null);
  };

  const handleEndCall = () => {
    const partnerId = partner?._id || partner;
    socketRef.current?.emit('end_call', { to: partnerId });
    setCallStatus(STATUS.ENDED);
    cleanup();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => { t.enabled = !t.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => { t.enabled = !t.enabled; });
      setIsVideoOff(!isVideoOff);
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
          <div className='bg-red-900/40 border border-red-700 rounded-2xl p-8 max-w-md text-center'>
            <h2 className='text-xl font-semibold mb-3'>⚠ Session Error</h2>
            <p className='text-red-200 mb-6'>{errorMsg}</p>
            <Link to='/dashboard' className='bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition'>
              Back to Dashboard
            </Link>
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
          <div className='flex items-center justify-between px-6 py-4 bg-gray-900/80 border-b border-gray-800'>
            <div className='flex items-center gap-3'>
              <Link to='/dashboard' className='text-gray-400 hover:text-white text-sm transition'>← Dashboard</Link>
              <span className='text-gray-600'>|</span>
              <h1 className='font-semibold text-sm'>
                Video Session with {partner?.name || 'Partner'}
              </h1>
            </div>
            <div className='flex items-center gap-4'>
              {callStatus === STATUS.CONNECTED && (
                <span className='text-green-400 text-sm font-mono flex items-center gap-2'>
                  <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
                  {formatDuration(callDuration)}
                </span>
              )}
              {booking?.listingId?.title && (
                <span className='text-xs text-gray-500'>Session: {booking.listingId.title}</span>
              )}
            </div>
          </div>

          {/* ── Video container ─────────────────────────────────────── */}
          <div className='flex-1 relative bg-gray-950 flex items-center justify-center overflow-hidden'>

            {/* Remote video (full background) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className='w-full h-full object-cover'
            />

            {/* Placeholder when no remote video */}
            {callStatus !== STATUS.CONNECTED && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-950'>
                {/* User avatar circle */}
                <div className='w-28 h-28 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-4xl font-bold text-gray-500 mb-6'>
                  {partner?.name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Status-specific content */}
                {callStatus === STATUS.READY && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-300 mb-2'>Ready to start session</h2>
                    <p className='text-gray-500 text-sm mb-8'>
                      Click the button below to call {partner?.name || 'your session partner'}
                    </p>
                    <button
                      onClick={handleCall}
                      className='bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition shadow-lg shadow-green-900/30 flex items-center gap-3 mx-auto'
                    >
                      📹 Start Video Call
                    </button>
                  </div>
                )}

                {callStatus === STATUS.CALLING && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-300 mb-2'>Calling {partner?.name}...</h2>
                    <p className='text-gray-500 text-sm animate-pulse'>Waiting for them to answer</p>
                  </div>
                )}

                {callStatus === STATUS.INCOMING && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-300 mb-2'>
                      📞 {callerInfo?.fromName || 'Someone'} is calling you
                    </h2>
                    <p className='text-gray-500 text-sm mb-8'>Incoming video call for this session</p>
                    <div className='flex gap-4 justify-center'>
                      <button
                        onClick={handleAccept}
                        className='bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-semibold transition shadow-lg flex items-center gap-2'
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={handleReject}
                        className='bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-semibold transition shadow-lg flex items-center gap-2'
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                )}

                {callStatus === STATUS.ENDED && (
                  <div className='text-center'>
                    <h2 className='text-xl font-semibold text-gray-300 mb-2'>Call ended</h2>
                    <p className='text-gray-500 text-sm mb-6'>
                      {callDuration > 0 ? `Duration: ${formatDuration(callDuration)}` : 'The session has ended.'}
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
                        className='bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition'
                      >
                        Back to Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Local video (picture-in-picture in bottom-right) */}
            <div className='absolute bottom-6 right-6 w-52 aspect-video rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-900'>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className='w-full h-full object-cover'
              />
              {isVideoOff && (
                <div className='absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-500 text-xs'>
                  Camera off
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom control bar ──────────────────────────────────── */}
          {(callStatus === STATUS.CONNECTED || callStatus === STATUS.CALLING) && (
            <div className='flex items-center justify-center gap-4 px-6 py-5 bg-gray-900/80 border-t border-gray-800'>
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg ${
                  isMuted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition shadow-lg ${
                  isVideoOff ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isVideoOff ? '📷' : '📹'}
              </button>

              <button
                onClick={handleEndCall}
                className='w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xl font-bold transition shadow-lg shadow-red-900/40'
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
