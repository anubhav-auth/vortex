import { useState, useEffect, useRef } from 'react';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import { Check, Camera, RefreshCw } from 'lucide-react';
import './styles.css';

function Registration({ onRegister, apiUrl }) {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [domains, setDomains] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [psList, setPsList] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  
  const [form, setForm] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    phone: '',
    gender: '',
    institutionId: '',
    domainId: '',
    psId: '',
    summary: '',
    photo: null,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [domainsRes, institutesRes, psRes] = await Promise.all([
          fetch(`${apiUrl}/domains`),
          fetch(`${apiUrl}/institutes`),
          fetch(`${apiUrl}/problem-statements`),
        ]);

        if (domainsRes.ok) setDomains(await domainsRes.json());
        if (institutesRes.ok) setInstitutes(await institutesRes.json());
        if (psRes.ok) {
          const data = await psRes.json();
          setPsList(data.problemStatements || []);
        }
      } catch (err) {
        console.error('Failed to load registration data:', err);
        setError('FAILED_TO_LOAD_DATA');
      }
    };

    fetchData();
  }, [apiUrl]);

  const startCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const photo = canvas.toDataURL('image/jpeg');
    setForm({ ...form, photo });
    
    // Stop stream
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'REGISTRATION_FAILURE');
      return;
    }

    setStudentId(data.studentId);
    setStep(2);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch(`${apiUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, otp }),
    });

    if (!res.ok) {
      setError('INVALID_OTP');
      return;
    }

    const userData = await res.json();
    onRegister(userData.student || { id: studentId, role: 'student' });
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="registration-page">
        <NeonBorderCard className="w-full max-w-[500px]">
          <div className="registration-success glass-card">
            <div className="success-icon"><Check size={48} color="var(--status-live)" /></div>
            <h2>REGISTRATION_SUCCESSFUL</h2>
            <p>Registration received. Hackathon Admin will verify your registration soon. Check email for updates.</p>
          </div>
        </NeonBorderCard>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <NeonBorderCard className="w-full max-w-[500px] z-10">
        <div className="registration-form glass-card">
          <div className="form-header">
            <h2><ScrambleText text={step === 1 ? "PARTICIPANT_REGISTRATION" : "OTP_VERIFICATION"} className="text-3xl text-[var(--accent-cyan)] font-mono" /></h2>
            <p>{step === 1 ? "ENTER_YOUR_DETAILS" : "ENTER_VERIFICATION_CODE"}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="form-grid">
              <input
                placeholder="FULL_NAME"
                className="input-glass"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <input
                placeholder="ROLL_NUMBER"
                className="input-glass"
                value={form.rollNumber}
                onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="EMAIL_ADDRESS"
                className="input-glass"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                placeholder="PHONE_NUMBER"
                className="input-glass"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
              <select
                className="select-glass"
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">GENDER</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select
                className="select-glass"
                value={form.institutionId}
                onChange={e => setForm({ ...form, institutionId: e.target.value })}
                required
              >
                <option value="">INSTITUTE</option>
                {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <select
                className="select-glass"
                value={form.domainId}
                onChange={e => setForm({ ...form, domainId: e.target.value })}
                required
              >
                <option value="">TECH_DOMAIN</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select
                className="select-glass"
                value={form.psId}
                onChange={e => setForm({ ...form, psId: e.target.value })}
                required
              >
                <option value="">PROBLEM_STATEMENT</option>
                {psList.map(ps => <option key={ps.id} value={ps.id}>{ps.title}</option>)}
              </select>
              <textarea
                placeholder="PARTICIPANT_BIO (MAX 200 WORDS)"
                className="input-glass"
                style={{ minHeight: '100px' }}
                value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })}
                required
              />

              <div className="photo-capture-section" style={{ margin: '20px 0' }}>
                {form.photo ? (
                  <div className="photo-preview">
                    <img src={form.photo} alt="Participant" style={{ width: '100%', borderRadius: '1px', border: '1px solid var(--accent-cyan)', display: 'block' }} />
                    <button type="button" onClick={() => setForm({ ...form, photo: null })} className="btn-verify" style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RefreshCw size={16} /> RETAKE_PHOTO
                    </button>
                  </div>
                ) : showCamera ? (
                  <div className="camera-view">
                    <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '1px', border: '1px solid var(--border-dim)' }} />
                    <button type="button" onClick={capturePhoto} className="glow-button" style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Camera size={16} /> TAKE_PHOTO
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={startCamera} className="glow-button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Camera size={16} /> START_CAMERA
                  </button>
                )}
              </div>

              <button type="submit" className="glow-button submit-btn">REGISTER</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="form-grid">
              <input
                placeholder="ENTER_OTP_CODE"
                className="input-glass"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
              <button type="submit" className="glow-button submit-btn">VERIFY_OTP</button>
            </form>
          )}
        </div>
      </NeonBorderCard>
    </div>
  );
}

export default Registration;
