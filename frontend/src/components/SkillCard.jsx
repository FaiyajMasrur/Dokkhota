// Skill card component for Dokkhota listing previews with Verification Badge
import { Link } from 'react-router-dom';
import VerificationBadge from './VerificationBadge.jsx';

const SkillCard = ({ listing }) => {
  const teacher = listing?.teacherId;
  const teacherName = teacher?.name || 'Skill Provider';
  const isVerified = teacher?.isVerified || false;

  return (
    <div className='border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between'>
      <div>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700'>{listing.category}</span>
          <span className='text-xs font-semibold text-emerald-700 uppercase tracking-wider'>{listing.format}</span>
        </div>
        <h3 className='text-lg font-bold text-slate-900 mb-1'>{listing.title}</h3>
        
        {/* Provider details with Skill Verification Badge */}
        <div className='flex items-center gap-2 mb-3'>
          <span className='text-xs text-slate-500 font-medium'>By {teacherName}</span>
          <VerificationBadge isVerified={isVerified} label="Verified" />
        </div>

        <p className='text-sm text-slate-600 mb-4 line-clamp-2'>{listing.description}</p>
        <div className='flex flex-wrap gap-1.5 mb-4'>
          {listing.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className='text-[11px] bg-slate-100 rounded-full px-2.5 py-0.5 text-slate-600 font-medium'>
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className='flex items-center justify-between pt-3 border-t border-slate-100'>
        <span className='text-base font-bold text-slate-800'>{listing.creditCost} SC</span>
        <Link
          to={`/listing/${listing._id}`}
          className='text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition'
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default SkillCard;
