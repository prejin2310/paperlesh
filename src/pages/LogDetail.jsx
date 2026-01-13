import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  FiEdit2,
  FiX,
  FiActivity,
  FiMoon,
  FiDollarSign,
  FiDroplet,
  FiMonitor,
  FiSun,
  FiBook,
  FiFilm,
  FiCoffee
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const MOODS = [
  { emoji: '🤩', label: 'Fantastic' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥰', label: 'Romantic' },
  { emoji: '😐', label: 'Normal' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😫', label: 'Stressed' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' }
];

const LogDetail = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !date) return;

    const fetchLog = async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'logs', date);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          toast.error('Log not found');
          navigate(-1);
          return;
        }

        setData(snap.data());
      } catch (err) {
        toast.error('Failed to load log');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [user, date, navigate]);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">
          {format(new Date(date), 'dd MMM yyyy')}
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard?edit=${date}`)}
            className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-white"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-full bg-gray-100"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mood */}
        <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
          <div className="text-5xl mb-2">
            {MOODS[data.mood]?.emoji || '—'}
          </div>
          <div className="font-bold">{MOODS[data.mood]?.label || 'Not logged'}</div>
          <div className="mt-3 text-3xl font-black">
            {data.rating ?? '—'}
          </div>
          <div className="text-xs text-gray-400">Rating</div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <Stat icon={<FiActivity />} label="Steps" value={data.steps} />
          <Stat icon={<FiMoon />} label="Sleep" value={data.sleep && `${data.sleep}h`} />
          <Stat icon={<FiDollarSign />} label="Spend" value={data.spend || 'Not logged'} />
          <Stat icon={<FiDroplet />} label="Water" value={data.water && `${data.water}L`} />
          <Stat icon={<FiMonitor />} label="Screen Time" value={data.screenTime && `${data.screenTime}h`} />

          {/* Weather */}
          <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <FiSun /> Weather
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {data.weather?.length
                ? data.weather.map(w => (
                    <span key={w} className="px-3 py-1 bg-sky-100 dark:bg-sky-900 rounded-full text-xs">
                      {w}
                    </span>
                  ))
                : 'Not logged'}
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="md:col-span-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
          <Activity icon={<FiCoffee />} label="Ate Outside" value={data.ateOutside && 'Yes'} />
          <Activity icon={<FiFilm />} label="Watched Movie" value={data.movieData?.name} />
          <Activity icon={<FiBook />} label="Read Book" value={data.bookData?.name} />
        </div>

        {/* Notes */}
        <div className="md:col-span-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 mb-2">Notes</div>
          <div className="whitespace-pre-wrap text-sm">
            {data.longNote || 'Not logged'}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small reusable components */
const Stat = ({ icon, label, value }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
    <div className="flex justify-between text-xs text-gray-400">
      {label}
      {icon}
    </div>
    <div className="mt-3 font-bold">{value || 'Not logged'}</div>
  </div>
);

const Activity = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    {icon}
    <div>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-gray-400">{value || 'Not logged'}</div>
    </div>
  </div>
);

export default LogDetail;
