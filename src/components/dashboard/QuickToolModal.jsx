import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiCheck, FiCheckSquare, FiSquare, FiSave, FiCalendar } from 'react-icons/fi';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ImportantDatesCalendarModal from './ImportantDatesCalendarModal';

const QuickToolModal = ({ isOpen, onClose, tool, onUpdate }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const { type, title, id } = tool || {};

    // State for different tools
    const [items, setItems] = useState([]); // For Lists (Bucket, Todo, Dates)
    const [newItemText, setNewItemText] = useState('');
    const [newDateValue, setNewDateValue] = useState(''); // For Important Dates
    const [newItemCategory, setNewItemCategory] = useState('Birthday'); // Birthday, Anniversary, Remember, Custom
    const [showCalendar, setShowCalendar] = useState(false);
    const [noteContent, setNoteContent] = useState(''); // For Monthly Note

    // Ref identifier for DB
    const getDocId = React.useCallback(() => {
        if (!id) return 'temp';
        if (id === 'tool-bucket2026') return 'bucket_list_2026';
        if (id === 'tool-todo') return 'todo_list_general';
        if (id === 'tool-important-dates') return 'important_dates';
        if (id === 'tool-monthNote') return `note_${format(new Date(), 'yyyy_MM')}`;
        return `tool_${id}`;
    }, [id]);

    useEffect(() => {
        if (!isOpen || !currentUser || !tool) return;
        
        const docId = getDocId();
        setLoading(true);

        const fetchData = async () => {
            try {
                const docRef = doc(db, 'users', currentUser.uid, 'tools', docId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (type.includes('list') || type === 'important-dates') {
                        setItems(data.items || []);
                    } else if (type === 'monthly-note') {
                        setNoteContent(data.content || '');
                    }
                } else {
                    // Reset if new
                    setItems([]);
                    setNoteContent('');
                    setNewDateValue('');
                }
            } catch (err) {
                console.error("Error fetching tool data:", err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, currentUser, type, getDocId, tool]);

    const handleSave = async () => {
        if (!currentUser) return;
        const docId = getDocId();
        
        try {
            const docRef = doc(db, 'users', currentUser.uid, 'tools', docId);
            let data = {};
            
            if (type.includes('list') || type === 'important-dates') {
                data = { items };
            } else {
                data = { content: noteContent };
            }
            
            await setDoc(docRef, data, { merge: true });
            toast.success('Saved!');
            if (onUpdate) onUpdate(); // Trigger refresh in parent
        } catch (err) {
            console.error("Error saving:", err);
            toast.error("Failed to save");
        }
    };

    // List Handlers
    const addItem = () => {
        if (!newItemText.trim()) return;
        
        const newItem = {
            id: Date.now().toString(),
            text: newItemText,
            createdAt: new Date().toISOString()
        };

        if (type === 'important-dates') {
            if (!newDateValue) return toast.error("Please pick a date");
            newItem.date = newDateValue;
            newItem.type = newItemCategory;
        } else {
            newItem.completed = false;
        }

        setItems(prev => type === 'important-dates' 
            ? [...prev, newItem].sort((a,b) => new Date(a.date) - new Date(b.date))
            : [newItem, ...prev]
        );
        setNewItemText('');
        setNewDateValue('');
    };

    const toggleItem = (id) => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: "100%", scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: "100%", scale: 0.95 }}
                    className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh] mb-20 md:mb-0"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                           {type === 'bucket-list-2026' ? '🌍 ' : type === 'todo-list' ? '📝 ' : type === 'important-dates' ? '🎂 ' : '📅 '}
                           {title}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-white"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1a1a1a]">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : type.includes('list') || type === 'important-dates' ? (
                            <div className="space-y-4">
                                {type === 'important-dates' && (
                                     <button 
                                        onClick={() => setShowCalendar(true)}
                                        className="w-full py-3 mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.01] transition-transform"
                                     >
                                         <FiCalendar /> View Full Year Calendar
                                     </button>
                                )}

                                <div className="flex flex-col gap-3 mb-6">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newItemText}
                                            onChange={(e) => setNewItemText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                            placeholder={type === 'important-dates' ? "Event (e.g. Mom's Bday)" : "Add new item..."}
                                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                        {type !== 'important-dates' && (
                                            <button 
                                                onClick={addItem}
                                                className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                                            >
                                                <FiPlus size={20} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {type === 'important-dates' && (
                                        <div className="flex gap-2">
                                            {/* Category Select */}
                                            <select
                                                value={newItemCategory}
                                                onChange={e => setNewItemCategory(e.target.value)}
                                                className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-xs outline-none text-gray-600 dark:text-white border-none ring-1 ring-gray-200 dark:ring-gray-700"
                                            >
                                                <option value="Birthday">Birthday</option>
                                                <option value="Anniversary">Anniversary</option>
                                                <option value="Remember">Remember</option>
                                                <option value="Custom">Custom</option>
                                            </select>

                                            <input 
                                                type="date"
                                                value={newDateValue}
                                                onChange={(e) => setNewDateValue(e.target.value)}
                                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-w-0 text-gray-900 dark:text-white dark:[color-scheme:dark]"
                                            />
                                            <button 
                                                onClick={addItem}
                                                className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                                            >
                                                <FiPlus size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {items.length === 0 && (
                                        <p className="text-center text-gray-400 italic py-4">No items yet. Add one above!</p>
                                    )}
                                    {items.map(item => (
                                        <motion.div 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.completed ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700'}`}
                                        >
                                            {type !== 'important-dates' ? (
                                                <button 
                                                    onClick={() => toggleItem(item.id)}
                                                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}
                                                >
                                                    {item.completed && <FiCheck size={14} />}
                                                </button>
                                            ) : (
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-center leading-tight ${
                                                    item.type === 'Birthday' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500' : 
                                                    item.type === 'Custom' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' :
                                                    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500'
                                                }`}>
                                                    {item.date ? format(new Date(item.date), 'MM/dd') : '??'}
                                                </div>
                                            )}  

                                            <div className="flex-1">
                                                <div className={`text-base font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {item.text}
                                                </div>
                                                {type === 'important-dates' && item.date && (
                                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider flex gap-2">
                                                        <span>{format(new Date(item.date), 'EEE yyyy')}</span>
                                                        {item.type && <span className="opacity-50">• {item.type}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Notes for {format(new Date(), 'MMMM yyyy')}
                                </label>
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    className="flex-1 w-full p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl resize-none border-none ring-1 ring-yellow-100 dark:ring-yellow-800/30 focus:ring-2 focus:ring-amber-400 outline-none text-lg leading-relaxed text-gray-800 dark:text-gray-100 font-serif placeholder-gray-400 dark:placeholder-gray-600"
                                    placeholder="Write your thoughts here..."
                                    style={{ minHeight: '200px' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <button 
                            onClick={() => { handleSave(); onClose(); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            <FiSave className="w-4 h-4" />
                            Save & Close
                        </button>
                    </div>
                </motion.div>
            </div>
             <ImportantDatesCalendarModal isOpen={showCalendar} onClose={() => setShowCalendar(false)} events={items} />
        </AnimatePresence>,
        document.body
    );
};

export default QuickToolModal;
