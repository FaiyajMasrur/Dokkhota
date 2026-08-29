// Profile editing page for Dokkhota users to update their bio and skills offered
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import userService from '../services/userService.js';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    city: '',
    bio: '',
    languages: '',
    skillsOffered: '',
    skillsWanted: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        city: user.city || '',
        bio: user.bio || '',
        languages: (user.languages || []).join(', '),
        skillsOffered: (user.skillsOffered || []).map((skill) => `${skill.title} (${skill.category})`).join(', '),
        skillsWanted: (user.skillsWanted || []).join(', '),
      });
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!accessToken) {
      setError('You must be logged in to edit your profile.');
      return;
    }

    try {
      let avatarUrl = user?.avatarUrl;
      // upload avatar first if present
      if (avatarFile) {
        const uploadResp = await userService.uploadAvatar(avatarFile, accessToken);
        if (uploadResp.data?.success && uploadResp.data.avatarUrl) {
          avatarUrl = uploadResp.data.avatarUrl;
        }
      }

      const profilePayload = {
        name: form.name,
        city: form.city,
        bio: form.bio,
        languages: form.languages,
        skillsWanted: form.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean),
        avatarUrl,
      };

      const skillsPayload = form.skillsOffered
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const match = item.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return { title: match[1].trim(), category: match[2].trim(), description: '' };
          }
          return { title: item, category: 'General', description: '' };
        });

      const updateRes = await userService.updateProfile(profilePayload, accessToken);
      const skillsRes = await userService.updateSkillsOffered(skillsPayload, accessToken);
      setSuccess('Profile updated successfully');

      const updatedUser = {
        ...user,
        ...(updateRes.data?.user || {}),
        skillsOffered: skillsRes.data?.user?.skillsOffered || skillsPayload,
        skillsWanted: form.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean),
        avatarUrl: avatarUrl || user?.avatarUrl,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
      };
      setUser(updatedUser);
      navigate(`/profile/${user.id || user._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update profile');
    }
  };

  if (!isAuthenticated) {
    return <div className='max-w-4xl mx-auto px-4 py-10'>You need to log in to edit your profile.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50 py-10'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='bg-white rounded-3xl shadow-sm p-8 border border-slate-100'>
          <h1 className='text-3xl font-bold text-slate-800 mb-2'>Edit Profile</h1>
          <p className='text-sm text-slate-500 mb-6'>
            Update your public profile, skills you can teach, and skills you want to learn for AI-powered smart matching.
          </p>

          {error && <div className='p-4 mb-6 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm'>{error}</div>}
          {success && <div className='p-4 mb-6 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm'>{success}</div>}

          <form className='space-y-5' onSubmit={handleSubmit}>
            <div>
              <label className='block mb-1.5 text-xs font-semibold text-slate-700'>Full Name</label>
              <input value={form.name} onChange={handleChange('name')} className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none' required />
            </div>
            <div>
              <label className='block mb-1.5 text-xs font-semibold text-slate-700'>City</label>
              <input value={form.city} onChange={handleChange('city')} className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none' placeholder='e.g. Dhaka' />
            </div>
            <div>
              <label className='block mb-1.5 text-xs font-semibold text-slate-700'>Bio</label>
              <textarea value={form.bio} onChange={handleChange('bio')} className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none' rows={3} placeholder='Tell the community about yourself and your passions...' />
            </div>
            <div>
              <label className='block mb-1.5 text-xs font-semibold text-slate-700'>Languages (comma separated)</label>
              <input value={form.languages} onChange={handleChange('languages')} className='w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none' placeholder='e.g. English, Bengali' />
            </div>
            <div>
              <label className='block mb-1.5 text-xs font-semibold text-slate-700'>Profile Picture</label>
              {avatarPreview && <img src={avatarPreview} alt='avatar' className='w-20 h-20 object-cover rounded-full mb-3 border shadow-sm' />}
              <input type='file' accept='image/*' className='text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100' onChange={(e) => { setAvatarFile(e.target.files[0] || null); setAvatarPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : ''); }} />
            </div>
            <div className='p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-4'>
              <h3 className='font-bold text-emerald-900 text-sm flex items-center gap-1.5'>
                <span>🎯</span> Learning & Teaching Preferences
              </h3>

              <div>
                <label className='block mb-1 text-xs font-semibold text-slate-700'>
                  Skills You Want to Learn (comma-separated tags — powers Smart Matching)
                </label>
                <input
                  value={form.skillsWanted}
                  onChange={handleChange('skillsWanted')}
                  className='w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  placeholder='e.g. React, Python, UI Design, Public Speaking'
                />
                <p className='text-[11px] text-slate-500 mt-1'>
                  Dokkhota's smart matching engine uses these tags to recommend the most relevant skill providers and sessions.
                </p>
              </div>

              <div>
                <label className='block mb-1 text-xs font-semibold text-slate-700'>
                  Skills Offered to Teach (e.g. JavaScript (Programming), Graphic Design (Creative))
                </label>
                <textarea
                  value={form.skillsOffered}
                  onChange={handleChange('skillsOffered')}
                  className='w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  rows={3}
                  placeholder='e.g. Node.js (Programming), Figma (Design)'
                />
              </div>
            </div>

            <button type='submit' className='bg-emerald-600 text-white font-medium rounded-xl px-8 py-3.5 hover:bg-emerald-700 transition shadow-sm text-sm'>
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
