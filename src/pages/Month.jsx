import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { FiCalendar, FiPlus, FiSave, FiMoreHorizontal } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import MonthlyJournalBlock from '../components/feature/MonthlyJournalBlock';
import { format } from 'date-fns';
import debounce from 'lodash.debounce';

const DEFAULT_BLOCKS = [
    { id: '1', type: 'text', title: 'Challenges and Lessons', content: '' },
    { id: '2', type: 'text', title: 'What I need to improve', content: '' },
    { id: '3', type: 'retrospective', title: 'Stop / Start / Keep', content: { stop: [], start: [], keep: [] } },
    { id: '4', type: 'checklist', title: 'Monthly Shopping List', items: [] },
    { id: '5', type: 'checklist', title: 'Grateful For', items: [] },
    { id: '6', type: 'text', title: 'Highlights & Top Accomplishments', content: '' },
];


const Month = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Date Logic
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const displayMonth = format(new Date(), 'MMMM yyyy');

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch Data
  useEffect(() => {
    if (!currentUser) return;

    const docRef = doc(db, 'users', currentUser.uid, 'monthly_journals', currentMonthStr);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.blocks) {
                setBlocks(data.blocks);
            }
        } else {
            setBlocks(DEFAULT_BLOCKS);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching monthly journal:", error);
        // Fallback to local defaults on error (e.g. permission issues) so UI loads
        setBlocks(DEFAULT_BLOCKS); 
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, currentMonthStr]);

  // Persist Data (Debounced)
  const saveToDb = useCallback(
    debounce(async (newBlocks) => {
        if (!currentUser) return;
        try {
            const docRef = doc(db, 'users', currentUser.uid, 'monthly_journals', currentMonthStr);
            await setDoc(docRef, { 
                blocks: newBlocks,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving monthly journal:", error);
        }
    }, 1000),
    [currentUser, currentMonthStr]
  );

  const handleUpdateBlock = (updatedBlock) => {
      const newBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
      setBlocks(newBlocks);
      saveToDb(newBlocks);
  };

  const handleDeleteBlock = (id) => {
      // Don't actually delete defaults? Or allow deletion? 
      // User requested customizing, so allow delete.
      const newBlocks = blocks.filter(b => b.id !== id);
      setBlocks(newBlocks);
      saveToDb(newBlocks);
  };

  const handleAddBlock = (type) => {
      const titles = {
          'text': 'New Section',
          'checklist': 'New List',
          'retrospective': 'New Retrospective'
      };
      
      const newBlock = {
          id: Date.now().toString(),
          type,
          title: titles[type],
          content: type === 'retrospective' ? { stop:[], start:[], keep:[] } : '',
          items: type === 'checklist' ? [] : undefined
      };
      
      const newBlocks = [...blocks, newBlock];
      setBlocks(newBlocks);
      saveToDb(newBlocks);
  };


  return (
    <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-hidden pb-48 transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
       
        {/* Background Blooms */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className={`absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}
        />
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 pointer-events-none ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
        />
        
        <div className="relative z-10 max-w-2xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Review</h1>
                   <p className={`font-bold text-lg mt-1 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <FiCalendar className="text-gray-400" /> {displayMonth}
                   </p>
                </div>
                <div className="flex items-center gap-2">
                    {lastSaved && (
                        <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <FiSave /> Saved
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
            ) : (
                <AnimatePresence>
                     <div className="space-y-6">
                        {blocks.map(block => (
                            <MonthlyJournalBlock 
                                key={block.id} 
                                block={block} 
                                onUpdate={handleUpdateBlock}
                                onDelete={handleDeleteBlock}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                     </div>
                </AnimatePresence>
            )}
            
            {/* Add New Section */}
            {!loading && (
                <div className="mt-12 p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] text-center">
                    <h3 className="font-bold text-gray-400 mb-6">Add New Custom Section</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button 
                            onClick={() => handleAddBlock('text')}
                            className="bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform px-6 py-3 rounded-xl font-bold text-sm"
                        >
                            📝 Text Area
                        </button>
                        <button 
                            onClick={() => handleAddBlock('checklist')}
                            className="bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform px-6 py-3 rounded-xl font-bold text-sm"
                        >
                            ✅ Checklist
                        </button>
                        <button 
                            onClick={() => handleAddBlock('retrospective')}
                            className="bg-gray-100 dark:bg-gray-800 hover:scale-105 transition-transform px-6 py-3 rounded-xl font-bold text-sm"
                        >
                            🔄 Retrospective
                        </button>
                    </div>
                </div>
            )}


        </div>
    </div>
  );
};

export default Month;

