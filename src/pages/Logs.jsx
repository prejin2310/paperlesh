import { useState } from 'react';
import { FiPlus, FiBook, FiTv, FiCoffee } from 'react-icons/fi';

const Logs = () => {
  const [activeTab, setActiveTab] = useState('books');
  
  const activeTabs = [
    { id: 'books', label: 'Books', icon: FiBook },
    { id: 'movies', label: 'Movies', icon: FiTv },
    { id: 'food', label: 'Food', icon: FiCoffee },
  ];

  // Placeholder data
  const logs = { books: [], movies: [], food: [] };

  return (
    <div className="pb-24 pt-6 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">Logs</h1>
        <button className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors">
            <FiPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-50 p-1 rounded-2xl overflow-x-auto">
        {activeTabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white text-black shadow-md' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <tab.icon /> {tab.label}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {logs[activeTab].length > 0 ? (
            logs[activeTab].map(item => (
                <div key={item.id} >{/* Item Card */}</div>
            ))
        ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-medium">No logs yet in {activeTab}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
