import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, parseISO } from 'date-fns';
import { 
    FiBook, 
    FiFilm, 
    FiShoppingBag, 
    FiPlus, 
    FiX, 
    FiCalendar, 
    FiStar, 
    FiInfo,
    FiFilter,
    FiSettings,
    FiTrash2,
    FiEdit3,
    FiFolder
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

// --- CONFIGURATION ---
const DEFAULT_TABS = [
    { id: 'books', label: 'Books', icon: FiBook, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'movies', label: 'Movies', icon: FiFilm, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { id: 'shopping', label: 'Splurge', icon: FiShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

// --- COMPONENTS ---

// ConfirmationModal has been moved to src/components/common/ConfirmationModal.jsx

const ManageCollectionsModal = ({ isOpen, onClose, currentTabs, onUpdate, askConfirm }) => {
    const [screen, setScreen] = useState('list'); // 'list' | 'editor'
    const [editingTab, setEditingTab] = useState(null); // null = new
    const [formData, setFormData] = useState({ label: '', color: 'indigo' });

    useEffect(() => {
        if (!isOpen) { 
            setScreen('list');
            setEditingTab(null);
        }
    }, [isOpen]);

    const handleEdit = (tab) => {
        setEditingTab(tab);
        setFormData({ label: tab.label, color: tab.color?.split('-')[1] || 'indigo' });
        setScreen('editor');
    };

    const handleCreate = () => {
        setEditingTab(null);
        setFormData({ label: '', color: 'indigo' });
        setScreen('editor');
    };

    const handleDelete = (id) => {
        if(askConfirm) {
            askConfirm({
                title: "Delete Collection?",
                message: "Existing logs will remain safe, but the tab will be hidden from your dashboard.",
                onConfirm: () => {
                    const newTabs = currentTabs.filter(t => t.id !== id);
                    onUpdate(newTabs);
                }
            });
        } else if(confirm('Delete this collection? Existing logs will remain but the tab will be hidden.')) {
            const newTabs = currentTabs.filter(t => t.id !== id);
            onUpdate(newTabs);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        const colorMap = {
            indigo: { color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            pink: { color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
            emerald: { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            orange: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            blue: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
             purple: { color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        };
        const selectedTheme = colorMap[formData.color] || colorMap.indigo;

        if (editingTab) {
            // Update
            const updated = currentTabs.map(t => t.id === editingTab.id ? { ...t, ...selectedTheme, label: formData.label } : t);
            onUpdate(updated);
        } else {
            // Create
            const newTab = {
                id: `custom_${Date.now()}`,
                label: formData.label,
                isCustom: true,
                ...selectedTheme,
                // store icon name to resolve later or default
                iconName: 'FiFolder' 
            };
            onUpdate([...currentTabs, newTab]);
        }
        setScreen('list');
    };

    if (!isOpen) return null;

     return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
             <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                layout
                className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 dark:border-gray-800"
            >
                {screen === 'list' ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg dark:text-white">Manage Collections</h3>
                            <button onClick={onClose}><FiX className="text-xl" /></button>
                        </div>
                        
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                            {currentTabs.map(tab => (
                                <div key={tab.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tab.bg} ${tab.color}`}>
                                            {tab.isCustom ? <FiFolder /> : <tab.icon />}
                                        </div>
                                        <span className="font-bold text-sm dark:text-white">{tab.label}</span>
                                    </div>
                                    {!['books', 'movies', 'shopping'].includes(tab.id) && (
                                        <div className="flex gap-2 text-gray-400">
                                            <button onClick={() => handleEdit(tab)} className="hover:text-indigo-500"><FiEdit3 /></button>
                                            <button onClick={() => handleDelete(tab.id)} className="hover:text-red-500"><FiTrash2 /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleCreate} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm">
                            + Create New Collection
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                         <div className="flex justify-between items-center mb-2">
                            <button type="button" onClick={() => setScreen('list')} className="text-xs font-bold uppercase text-gray-500">Back</button>
                            <h3 className="font-bold text-lg dark:text-white">{editingTab ? 'Edit' : 'Create'}</h3>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Name</label>
                            <input 
                                value={formData.label}
                                onChange={e => setFormData({...formData, label: e.target.value})}
                                className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-3 font-bold outline-none border-2 border-transparent focus:border-indigo-500"
                                placeholder="e.g. Video Games"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Theme</label>
                            <div className="flex gap-2 flex-wrap">
                                {['indigo', 'pink', 'emerald', 'orange', 'blue', 'purple'].map(color => (
                                    <button
                                        type="button"
                                        key={color}
                                        onClick={() => setFormData({...formData, color})}
                                        className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'} bg-${color}-500`}
                                        style={{ backgroundColor: `var(--color-${color}-500)` }}
                                    >
                                        <div className={`w-full h-full rounded-full bg-${color}-500`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold mt-4 shadow-lg shadow-indigo-200 dark:shadow-none">
                            Save Collection
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
     );
}

const GuideBanner = ({ onClose }) => (
    <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-indigo-600 dark:bg-indigo-900 text-white overflow-hidden rounded-3xl relative mb-8 shadow-xl shadow-indigo-200 dark:shadow-none"
    >
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 text-2xl">
                📚
            </div>
            <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold">Your Life Library</h3>
                <p className="opacity-90 leading-relaxed max-w-2xl">
                    Welcome to your collection view. This page aggregates all the books you've read, movies you've watched, and special purchases you've made from your daily logs. You can also add items directly here to build your yearly tracking lists.
                </p>
            </div>
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
            >
                Dismiss
            </button>
        </div>
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    </motion.div>
);

const QuickAddModal = ({ isOpen, onClose, type, onSave, initialData }) => {
    const defaultDate = format(new Date(), 'yyyy-MM-dd');
    const [date, setDate] = useState(defaultDate);
    const [loading, setLoading] = useState(false);
    
    // Dynamic Form State
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if(isOpen) {
            if (initialData) {
                setFormData(initialData);
                setDate(initialData.date || defaultDate);
            } else {
                setFormData({});
                setDate(defaultDate);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
           await onSave(date, formData, initialData); // Pass initialData to identify edit vs create
           onClose();
        } catch(err) {
            console.error(err);
            toast.error("Failed to save.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl p-4 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all";

    const renderFields = () => {
        switch(type) {
            case 'books':
                return (
                    <>
                        <input 
                            placeholder="Book Title" 
                            className={inputClasses}
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <input 
                            placeholder="Author (Optional)" 
                            className={inputClasses}
                            value={formData.author || ''}
                            onChange={e => setFormData({...formData, author: e.target.value})}
                        />
                        <div className="relative">
                            <select 
                                className={`${inputClasses} appearance-none`}
                                value={formData.rating || 0}
                                onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                            >
                                <option value="0">Rating (Optional)</option>
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                            </select>
                            <FiStar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <input 
                            placeholder="Genre (Optional)" 
                            className={inputClasses}
                            value={formData.genre || ''}
                            onChange={e => setFormData({...formData, genre: e.target.value})} 
                        />
                    </>
                );
            case 'movies':
                return (
                    <>
                        <input 
                            placeholder="Movie / Series Name" 
                            className={inputClasses}
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                className={`${inputClasses} appearance-none`}
                                value={formData.platform || 'OTT'}
                                onChange={e => setFormData({...formData, platform: e.target.value})}
                            >
                                <option value="OTT">OTT (Netflix)</option>
                                <option value="Theatre">Theatre</option>
                                <option value="TV">TV</option>
                            </select>
                             <div className="relative">
                                <select 
                                    className={`${inputClasses} appearance-none`}
                                    value={formData.rating || 0}
                                    onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                                >
                                    <option value="0">Rating</option>
                                    {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                </select>
                                <FiStar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                             </div>
                        </div>
                        <input 
                            placeholder="Who with? (Optional)" 
                            className={inputClasses}
                            value={formData.withWhom || ''}
                            onChange={e => setFormData({...formData, withWhom: e.target.value})}
                        />
                    </>
                );
            case 'shopping':
                return (
                    <>
                        <input 
                            placeholder="Item Name" 
                            className={inputClasses}
                            required
                            value={formData.item || ''}
                            onChange={e => setFormData({...formData, item: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                             <input 
                                type="number"
                                placeholder="Price" 
                                className={inputClasses}
                                required
                                value={formData.price || ''}
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            />
                            <select 
                                className={`${inputClasses} appearance-none`}
                                value={formData.type || 'Online'}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </>
                );
            default:
                 return (
                    <>
                        <input 
                            placeholder="Name / Title" 
                            className={inputClasses}
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <textarea 
                            placeholder="Note / Details (Optional)" 
                            className={`${inputClasses} h-24 resize-none`}
                            value={formData.note || ''}
                            onChange={e => setFormData({...formData, note: e.target.value})}
                        />
                         <div className="relative">
                            <select 
                                className={`${inputClasses} appearance-none`}
                                value={formData.rating || 0}
                                onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                            >
                                <option value="0">Rating (Optional)</option>
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                            </select>
                            <FiStar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    </>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />
             <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 dark:border-gray-800"
            >
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <h3 className="text-2xl font-black capitalize text-gray-900 dark:text-white">New Entry</h3>
                        <p className="text-sm font-bold text-gray-400">Add to {type === 'shopping' ? 'Purchase' : type}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <FiX />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">When?</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            {/* Custom Date Input Style */}
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)}
                                className={`${inputClasses} pl-12`}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {renderFields()}
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-5 bg-gray-900 text-white dark:bg-white dark:text-black rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-gray-200 dark:shadow-none"
                        >
                            {loading ? 'Adding...' : 'Add to Library'}
                        </button>
                    </div>
                </form>
             </motion.div>
        </div>
    )
};

const Logs = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('books');
    const [showGuide, setShowGuide] = useState(true); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    
    // Confirmation State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const askConfirm = (config) => setConfirmConfig({ ...config, isOpen: true });

    // Custom Tabs State
    const [tabs, setTabs] = useState(DEFAULT_TABS);

    useEffect(() => {
        const saved = localStorage.getItem('userMeta_customCollections');
        if (saved) {
            try {
                // Merge saved custom tabs with defaults to respect any code updates to defaults
                const parsed = JSON.parse(saved);
                const customs = parsed.filter(t => t.isCustom);
                setTabs([...DEFAULT_TABS, ...customs]);
            } catch(e) {}
        }
    }, []);

    const handleUpdateTabs = (newTabs) => {
        setTabs(newTabs);
        // Persist only custom ones
        localStorage.setItem('userMeta_customCollections', JSON.stringify(newTabs));
    };

    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
   // ... (existing fetch logic remains effectively same, just uses generic doc data)
    useEffect(() => {
        const fetchAllLogs = async () => {
             if(!currentUser) return;
             try {
                 const q = query(collection(db, 'users', currentUser.uid, 'logs'));
                 const snap = await getDocs(q);
                 const logs = [];
                 snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
                 logs.sort((a,b) => new Date(b.date) - new Date(a.date));
                 setRawData(logs);
             } catch (error) {
                 console.error(error);
             } finally {
                 setLoading(false);
             }
        };
        fetchAllLogs();
    }, [currentUser]);

    // Derived Data
    const collectionData = useMemo(() => {
        const results = {};
        tabs.forEach(t => results[t.id] = []);

        if (!rawData.length) return results;

        rawData.forEach(log => {
            // Standard
            if (log.readBook && log.bookData && log.bookData.name) {
                results['books']?.push({ date: log.date, ...log.bookData });
            }
            if (log.watchedMovie && log.movieData && log.movieData.name) {
                results['movies']?.push({ date: log.date, ...log.movieData });
            }
            if (log.shoppingList && Array.isArray(log.shoppingList)) {
                log.shoppingList.forEach((item, idx) => {
                    results['shopping']?.push({ date: log.date, _index: idx, ...item });
                });
            } else if (log.shopping && log.shoppingData && log.shoppingData.item) {
                 results['shopping']?.push({ date: log.date, _index: 0, ...log.shoppingData });
            }

            // Custom Collections
            if (log.customCollections) {
                 Object.keys(log.customCollections).forEach(tabId => {
                     const items = log.customCollections[tabId];
                     if (results[tabId] && Array.isArray(items)) {
                         items.forEach((item, idx) => {
                             results[tabId].push({ date: log.date, _index: idx, ...item });
                         });
                     }
                 });
            }
        });
        return results;
    }, [rawData, tabs]);

    const activeList = collectionData[activeTab] || [];
    const [editingItem, setEditingItem] = useState(null);

    const setupEdit = (item) => {
        setEditingItem(item);
        setIsAddModalOpen(true);
    };

    const deleteItem = (date, index, tabId) => {
        askConfirm({
            title: "Delete Item?",
            message: "This action cannot be undone.",
            onConfirm: async () => {
                const logRef = doc(db, 'users', currentUser.uid, 'logs', date);
                const currentDoc = rawData.find(l => l.date === date);
                if(!currentDoc) return;
        
                let updatePayload = {};
        
                 if (activeTab === 'books') {
                    updatePayload = { readBook: false, bookData: null };
                } else if (activeTab === 'movies') {
                    updatePayload = { watchedMovie: false, movieData: null };
                } else if (activeTab === 'shopping') {
                    const newList = [...(currentDoc.shoppingList || [])];
                     if(index !== undefined && index !== null && index >= 0) newList.splice(index, 1);
                    updatePayload = { shopping: newList.length > 0, shoppingList: newList };
                } else {
                     const currentCols = currentDoc.customCollections || {};
                     const currentList = [...(currentCols[activeTab] || [])];
                     if(index !== undefined && index !== null && index >= 0) currentList.splice(index, 1);
                     updatePayload = {
                         customCollections: { ...currentCols, [activeTab]: currentList }
                     }
                }
                
                await setDoc(logRef, updatePayload, { merge: true });
                
                 setRawData(prev => {
                     const idx = prev.findIndex(l => l.date === date);
                     if (idx > -1) {
                         const newArr = [...prev];
                         const old = newArr[idx];
                         if(updatePayload.customCollections) {
                              newArr[idx] = { ...old, customCollections: { ...(old.customCollections||{}), ...updatePayload.customCollections }};
                         } else {
                              newArr[idx] = { ...old, ...updatePayload };
                         }
                         return newArr;
                     }
                     return prev;
                });
                toast.success("Deleted.");
            }
        });
    };

    const handleQuickAdd = async (date, data, initialData) => {
        const logRef = doc(db, 'users', currentUser.uid, 'logs', date);
        const existingLog = rawData.find(l => l.date === date);
        let updatePayload = {};
        
        if (activeTab === 'books') {
             // Books are singleton per day in this schema, so edit = overwrite
            updatePayload = { readBook: true, bookData: data };
        } else if (activeTab === 'movies') {
             updatePayload = { watchedMovie: true, movieData: data };
        } else if (activeTab === 'shopping') {
             let cur = existingLog?.shoppingList || [];
             if(initialData && initialData._index !== undefined) {
                 cur = [...cur];
                 cur[initialData._index] = { ...data, qty: 1 };
             } else {
                 cur = [...cur, { ...data, qty: 1 }];
             }
             updatePayload = { shopping: true, shoppingList: cur };
        } else {
             const cols = existingLog?.customCollections || {};
             let list = cols[activeTab] || [];
             if(initialData && initialData._index !== undefined) {
                 list = [...list];
                 list[initialData._index] = data;
             } else {
                 list = [...list, data];
             }
             updatePayload = { customCollections: { ...cols, [activeTab]: list } };
        }
        
        await setDoc(logRef, { ...updatePayload, date: date, updatedAt: new Date().toISOString() }, { merge: true });
        
        setRawData(prev => {
             const idx = prev.findIndex(l => l.date === date);
             if (idx > -1) {
                  const newArr = [...prev];
                  const old = newArr[idx];
                 if(updatePayload.customCollections) {
                      newArr[idx] = { ...old, customCollections: { ...(old.customCollections||{}), ...updatePayload.customCollections }};
                 } else {
                      newArr[idx] = { ...old, ...updatePayload };
                 }
                 return newArr;
             }
             return [...prev, { date, id: date, ...updatePayload }].sort((a,b) => new Date(b.date) - new Date(a.date));
        });
        toast.success("Saved!");
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] dark:bg-black font-sans transition-colors duration-500 pb-20">
      
            {/* 1. Header Section (Gradient Background) */}
            <div className="relative bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#4f46e5] dark:from-[#312e81] dark:via-[#4c1d95] dark:to-[#1e1b4b] pt-12 pb-24 px-6 rounded-b-[3.5rem] shadow-xl shadow-indigo-200/50 dark:shadow-none z-10 overflow-hidden">
                
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-sky-400/20 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Life Library</h1>
                        <p className="text-indigo-100/80 font-medium text-sm">Your year in books, movies & lists</p>
                    </div>


                    {/* Tabs - Pill Style */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center flex-wrap gap-2 px-2">
                             {/* Manage Button */}
                             <button
                                onClick={() => setIsManageOpen(true)}
                                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center gap-2 text-white border border-white/10 transition-all"
                            >
                                <FiEdit3 size={14} />
                                <span className="text-xs font-bold">Customize</span>
                            </button>

                            <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-[2rem] flex flex-wrap items-center justify-center gap-1 border border-white/10 max-w-full">
                                {tabs.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.isCustom ? FiFolder : tab.icon;
                                    const count = collectionData[tab.id]?.length || 0;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                relative px-4 py-2.5 rounded-[1.5rem] flex items-center gap-2 transition-all duration-300
                                                ${isActive ? 'bg-white shadow-lg text-indigo-900 font-bold scale-105' : 'text-indigo-100 hover:bg-white/10 font-medium'}
                                            `}
                                        >
                                            <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-indigo-200'} />
                                            <span className="text-xs tracking-wide whitespace-nowrap">{tab.label}</span>
                                            {isActive && (
                                                <span className="ml-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center border border-white">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Sheet Content */}
            <div className="max-w-md mx-auto px-6 -mt-12 relative z-20 space-y-6">
                
                {/* Add Button - Floating Style Card */}
                <button 
                     onClick={() => setIsAddModalOpen(true)}
                     className="w-full bg-white dark:bg-[#111] p-4 rounded-[2rem] shadow-lg shadow-indigo-900/10 dark:shadow-none border border-white dark:border-gray-800 flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:rotate-90 transition-transform duration-300">
                        <FiPlus size={20} />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-white">
                        Add New {['books', 'movies', 'shopping'].includes(activeTab) ? (activeTab === 'shopping' ? 'Item' : activeTab.slice(0, -1)) : 'Item'}
                    </span>
                </button>

                <AnimatePresence>
                     {showGuide && <GuideBanner onClose={() => setShowGuide(false)} />}
                </AnimatePresence>

                {/* Content List */}
                <div className="space-y-4 min-h-[500px] mb-20">
                     {loading ? (
                         <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                             <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                             <p className="font-bold text-xs uppercase tracking-widest">Fetching Collection...</p>
                         </div>
                     ) : activeList.length === 0 ? (
                         <div className="bg-white/50 dark:bg-[#111]/50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4">
                             <div className="text-4xl opacity-50 grayscale contrast-50">
                                 {activeTab === 'books' && '📚'}
                                 {activeTab === 'movies' && '🎬'}
                                 {activeTab === 'shopping' && '🛍️'}
                                 {!['books', 'movies', 'shopping'].includes(activeTab) && '📂'}
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-900 dark:text-white mb-1">Empty Collection</h3>
                                 <p className="text-gray-400 font-bold text-xs">Start adding to your {tabs.find(t => t.id === activeTab)?.label} list.</p>
                             </div>
                         </div>
                     ) : (
                         <AnimatePresence mode="popLayout">
                             {activeList.map((item, idx) => (
                                 <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-[#111] p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800/50 flex flex-col gap-3 relative overflow-hidden group"
                                 >
                                     {/* Side Decoration Line */}
                                     {(() => {
                                         const currentTab = tabs.find(t => t.id === activeTab);
                                         const colorName = currentTab?.color?.split('-')[1] || 'indigo';
                                         const bgColors = {
                                             indigo: 'bg-indigo-500',
                                             pink: 'bg-pink-500',
                                             emerald: 'bg-emerald-500',
                                             orange: 'bg-orange-500',
                                             blue: 'bg-blue-500',
                                             purple: 'bg-purple-500'
                                         };
                                         return <div className={`absolute top-0 left-0 w-1.5 h-full ${bgColors[colorName] || 'bg-indigo-500'}`} />
                                     })()}

                                     <div className="pl-3 flex justify-between items-start">
                                          <div className="pr-4 max-w-[70%]">
                                              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-1">
                                                  {format(parseISO(item.date), 'MMMM d')}
                                              </span>
                                              <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight break-words">
                                                  {item.name || item.item}
                                              </h3>
                                              {(item.author || item.platform || item.note) && (
                                                  <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                                                      {['books'].includes(activeTab) ? 'by' : ['movies'].includes(activeTab) ? 'on' : ''}
                                                      <span className="text-indigo-500 dark:text-indigo-400 break-words line-clamp-2">{item.author || item.platform || item.note}</span>
                                                  </p>
                                              )}
                                          </div>
                                          
                                          {/* Right Side Stats */}
                                          <div className="flex flex-col items-end gap-1">
                                               {activeTab === 'shopping' ? (
                                                   <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                                                       ₹{item.price}
                                                   </span>
                                               ) : item.rating ? (
                                                    <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-900/50">
                                                        <span className="text-sm font-black text-orange-500">{item.rating}</span>
                                                        <FiStar size={10} className="text-orange-500 fill-current" />
                                                    </div>
                                               ) : null}
                                          </div>
                                     </div>

                                     {/* Edit/Delete Actions */}
                                     <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setupEdit(item, item._index); }}
                                            className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 transition-colors shadow-sm"
                                        >
                                            <FiEdit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteItem(item.date, item._index, activeTab); }}
                                            className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 transition-colors shadow-sm"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                     </div>
                                 </motion.div>
                             ))}
                         </AnimatePresence>
                     )}
                </div>
            </div>

            <QuickAddModal 
                isOpen={isAddModalOpen} 
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                }}
                type={activeTab}
                initialData={editingItem}
                onSave={handleQuickAdd}
             />
             
             <ManageCollectionsModal 
                isOpen={isManageOpen}
                onClose={() => setIsManageOpen(false)}
                currentTabs={tabs}
                onUpdate={handleUpdateTabs}
                askConfirm={askConfirm}
             />

             <ConfirmationModal 
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                type={confirmConfig.type}
             />
        </div>
    );
};

export default Logs;
