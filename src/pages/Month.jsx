import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { FiCalendar, FiSave, FiArrowLeft, FiTrash2, FiEdit2, FiCheckSquare, FiType, FiRefreshCw, FiPlus } from 'react-icons/fi';
import MonthlyJournalBlock from '../components/feature/MonthlyJournalBlock';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const displayMonth = format(new Date(), 'MMMM yyyy');

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);

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
        setBlocks(DEFAULT_BLOCKS); 
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, currentMonthStr]);

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
            setTimeout(() => setLastSaved(null), 3000);
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

  const handleDeleteBlock = (blockId) => {
      if (window.confirm('Delete this section?')) {
          const newBlocks = blocks.filter(b => b.id !== blockId);
          setBlocks(newBlocks);
          saveToDb(newBlocks);
          if (editingBlockId === blockId) setEditingBlockId(null);
      }
  };

  const handleAddBlock = (type) => {
      const titles = {
          'text': 'New Reflection',
          'checklist': 'New Checklist',
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
      setEditingBlockId(newBlock.id);
  };

  // --- Render Helpers ---

  const getBlockIcon = (type) => {
      switch(type) {
          case 'checklist': return <FiCheckSquare size={20} className="text-emerald-500" />;
          case 'retrospective': return <FiRefreshCw size={20} className="text-orange-500" />;
          default: return <FiType size={20} className="text-indigo-500" />;
      }
  };

  const getBlockSummary = (block) => {
      switch(block.type) {
          case 'text':
              return block.content ? 
                <span className={`text-sm line-clamp-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{block.content}</span> : 
                <span className="text-sm italic opacity-40">Empty reflection...</span>;
          case 'checklist':
              const total = block.items?.length || 0;
              const completed = block.items?.filter(i => i.completed)?.length || 0;
              return (
                  <div className="flex flex-col gap-2 w-full">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-500" 
                            style={{ width: total ? `${(completed/total)*100}%` : '0%' }}
                          />
                      </div>
                      <span className="text-xs opacity-60 flex justify-between">
                          <span>Progress</span>
                          <span>{completed}/{total}</span>
                      </span>
                  </div>
              );
          case 'retrospective':
             const s = (block.content?.start?.length || 0);
             const st = (block.content?.stop?.length || 0);
             const k = (block.content?.keep?.length || 0);
             return (
                 <div className="text-xs opacity-70 flex gap-3 mt-1">
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>{s} Start</span>
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>{st} Stop</span>
                     <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{k} Keep</span>
                 </div>
             );
          default: return null;
      }
  };

  // --- Views ---

  const EditorView = () => {
      const block = blocks.find(b => b.id === editingBlockId);
      if (!block) return null;

      return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/20 backdrop-blur-sm`}
        >
            <div className={`w-full max-w-4xl max-h-full overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl ${isDarkMode ? 'bg-[#0a0a0a] border border-gray-800' : 'bg-white'}`}>
                <div className={`px-8 py-6 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} shrink-0`}>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setEditingBlockId(null)}
                            className={`p-3 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-50 block mb-1">{block.type}</span>
                            <h2 className="font-bold text-xl">{block.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {lastSaved && <span className="text-xs text-green-500 font-bold flex items-center gap-1"><FiSave /> Saved</span>}
                         <button 
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                            <FiTrash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <MonthlyJournalBlock 
                        block={block} 
                        onUpdate={handleUpdateBlock} 
                        onDelete={handleDeleteBlock} 
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>
        </motion.div>
      );
  };

  const GridView = () => (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto pb-20"
      >
        <div className="flex flex-col md:flex-row items-start justify-between mb-12 gap-6">
            <div>
                <h1 className={`text-6xl font-black tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Review.</h1>
                <p className={`font-medium text-xl flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="capitalize">{displayMonth}</span>
                </p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6 auto-rows-[minmax(200px,auto)]">
            { blocks.map((block, index) => {
                
                // Colorful Palette Logic (Cycling)
                const colors = [
                    { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-100' },
                    { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-100' },
                    { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-100' },
                    { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-100' },
                    { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-100' }, 
                    { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-900 dark:text-lime-100' },
                ];
                
                // Assign color based on index or type? Let's do index for maximum "colorful" grid effect
                const colorTheme = colors[index % colors.length];

                return (
                <motion.div 
                    layoutId={`block-${block.id}`}
                    key={block.id}
                    onClick={() => setEditingBlockId(block.id)}
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-6 rounded-[2.5rem] cursor-pointer overflow-hidden transition-all duration-300 group flex flex-col justify-between ${colorTheme.bg}`}
                >
                     <div>
                        <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-2xl shadow-sm">
                                 {getBlockIcon(block.type)}
                             </div>
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span className="p-2 bg-white/40 dark:bg-black/20 rounded-full flex items-center justify-center">
                                    <FiEdit2 size={14} className={colorTheme.text} />
                                 </span>
                             </div>
                         </div>
                         
                         <h3 className={`font-black text-xl leading-tight mb-2 line-clamp-3 ${colorTheme.text}`}>
                            {block.title}
                         </h3>
                     </div>
                     
                     <div className={`mt-4 pt-4 border-t border-black/5 dark:border-white/10 ${colorTheme.text}`}>
                        {getBlockSummary(block)}
                     </div>
                </motion.div>
                );
            })}

            {/* Add New Integration */}
            <div className="p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 min-h-[240px] transition-all group border-gray-300 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-gray-50/50 dark:bg-gray-900/20">
                 <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 mb-2 group-hover:scale-110 transition-transform">
                     <FiPlus size={32} />
                 </div>
                 <div className="flex flex-col gap-2 w-full">
                     <button onClick={() => handleAddBlock('text')} className="py-2 px-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md text-sm font-bold transition-all text-center">
                        Reflection
                     </button>
                     <div className="flex gap-2">
                         <button onClick={() => handleAddBlock('checklist')} className="flex-1 py-2 px-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md text-sm font-bold transition-all text-center">
                            List
                         </button>
                         <button onClick={() => handleAddBlock('retrospective')} className="flex-1 py-2 px-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md text-sm font-bold transition-all text-center">
                            Retro
                         </button>
                     </div>
                 </div>
            </div>
        </div>
      </motion.div>
  );

  return (
    <div className={`min-h-screen font-sans p-6 md:p-12 relative overflow-y-auto transition-colors duration-300 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#FAFAFA] text-gray-900'}`}>
       
        <div className={`fixed top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] opacity-40 pointer-events-none ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-100'}`} />
        <div className={`fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-40 pointer-events-none ${isDarkMode ? 'bg-rose-900/20' : 'bg-rose-100'}`} />
        
        {loading ? (
            <div className="flex justify-center items-center h-[80vh] relative z-20">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
            </div>
        ) : (
            <AnimatePresence mode="wait">
                {editingBlockId ? <EditorView key="editor" /> : <GridView key="grid" />}
            </AnimatePresence>
        )}
    </div>
  );
};

export default Month;

