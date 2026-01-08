import { useState, useEffect } from 'react';
import { eachDayOfInterval, format, startOfYear, endOfYear, getDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FiCloud, FiSun, FiUmbrella, FiWind, FiActivity, FiDollarSign } from 'react-icons/fi';

const Track = () => {
    const { currentUser } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [logData, setLogData] = useState({});
    const [selectedMetric, setSelectedMetric] = useState('mood');
  
    // Fetch yearly data
    useEffect(() => {
      const fetchData = async () => {
        if (!currentUser) return;
        try {
          const startStr = `${year}-01-01`;
          const endStr = `${year}-12-31`;
          const logsRef = collection(db, 'users', currentUser.uid, 'logs');
          const q = query(logsRef, where('date', '>=', startStr), where('date', '<=', endStr));
          const snap = await getDocs(q);
          const data = {};
          snap.forEach(doc => data[doc.id] = doc.data());
          setLogData(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
    }, [year, currentUser]);
  
    const days = eachDayOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1))
    });
  
    // Helper to get color based on metric
    const getColor = (dateStr) => {
      const log = logData[dateStr];
      if (!log) return 'bg-gray-100';
  
      switch (selectedMetric) {
        case 'mood':
          // 0:😭, 1:😢, 2:😐, 3:🙂, 4:🤩
          const colors = ['bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 'bg-green-400'];
          return colors[log.mood] || 'bg-gray-200';
        case 'rating': 
          // 1-5 (opacity based)
          return `bg-black opacity-${Math.min(log.rating * 20, 100)}`; // e.g., opacity-20 to opacity-100
        case 'spend':
            return log.spend ? 'bg-emerald-400' : 'bg-gray-100';
        case 'steps':
            if(!log.steps) return 'bg-gray-100';
            return log.steps > 10000 ? 'bg-blue-600' : (log.steps > 5000 ? 'bg-blue-300' : 'bg-blue-100');
        default:
          return 'bg-gray-200';
      }
    };

    const metrics = [
        { id: 'mood', label: 'Mood' },
        { id: 'rating', label: 'Rating' },
        { id: 'spend', label: 'Spend' },
        { id: 'steps', label: 'Steps' },
    ];
  
    return (
      <div className="pb-24 pt-6 px-4 md:px-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Yearly Tracker</h1>
        
        {/* Metric Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {metrics.map(m => (
                <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m.id)}
                    className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                        selectedMetric === m.id 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    {m.label}
                </button>
            ))}
        </div>
  
        {/* Heatmap Grid */}
        <div className=" p-6 rounded-[2.5rem] bg-white border border-gray-100 overflow-x-auto">
            <div className="min-w-[700px]">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {days.map(day => (
                    <div
                        key={day.toISOString()}
                        className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${getColor(format(day, 'yyyy-MM-dd'))}`}
                        title={`${format(day, 'MMM d')}: ${logData[format(day, 'yyyy-MM-dd')]?.note || 'No entry'}`}
                    ></div>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Jan</span><span>Dec</span>
            </div>
        </div>
      </div>
    );
  };
  
  export default Track;
