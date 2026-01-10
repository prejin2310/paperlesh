import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiX, FiCheck, FiCalendar, FiClock, FiGrid, FiAlignLeft } from 'react-icons/fi';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'Meeting', label: 'Meeting', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { id: 'Birthday', label: 'Birthday', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
    { id: 'Anniversary', label: 'Anniversary', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 'Remember', label: 'Remember', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'Custom', label: 'Custom', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'Design', label: 'Design', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

const CreateEvent = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');

    React.useEffect(() => {
      if (!currentUser) navigate('/login');
    }, [currentUser, navigate]);

    const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate);
    const [category, setCategory] = useState(CATEGORIES[0].id);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!!editId);

    // Load existing event if editing
    React.useEffect(() => {
        const loadEvent = async () => {
             if (!editId || !currentUser) return;
             try {
                 const docRef = doc(db, 'users', currentUser.uid, 'tools', 'important_dates');
                 const docSnap = await getDoc(docRef);
                 if (docSnap.exists()) {
                     const items = docSnap.data().items || [];
                     const item = items.find(i => i.id === editId);
                     if (item) {
                         setTitle(item.text);
                         setDate(item.date);
                         setCategory(item.type);
                         setDescription(item.description || '');
                     } else {
                         toast.error("Event not found");
                         navigate(-1);
                     }
                 }
             } catch (e) {
                 console.error(e);
                 toast.error("Failed to load event");
             } finally {
                 setIsFetching(false);
             }
        };
        loadEvent();
    }, [editId, currentUser, navigate]);

    const handleSubmit = async () => {
        if (!title.trim()) return toast.error("Please enter a title");
        if (!date) return toast.error("Please select a date");

        setLoading(true);
        try {
            // Fetch existing
            const docRef = doc(db, 'users', currentUser.uid, 'tools', 'important_dates');
            const docSnap = await getDoc(docRef);
            let items = [];
            if (docSnap.exists()) {
                items = docSnap.data().items || [];
            }

            if (editId) {
                // Update existing
                const updatedItems = items.map(item => {
                    if (item.id === editId) {
                        return {
                            ...item,
                            text: title,
                            date: date,
                            type: category,
                            description: description,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return item;
                });
                await setDoc(docRef, { items: updatedItems }, { merge: true });
                toast.success("Event Updated!");
            } else {
                // Create new
                const newItem = {
                    id: Date.now().toString(),
                    text: title,
                    date: date,
                    type: category,
                    description: description,
                    createdAt: new Date().toISOString()
                };
                await setDoc(docRef, { items: [...items, newItem] }, { merge: true });
                toast.success("Event Saved!");
            }
            
            navigate(-1); // Go back
        } catch (error) {
            console.error(error);
            toast.error("Failed to save event");
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col items-center">
            <div className="w-full max-w-md flex flex-col h-screen bg-white dark:bg-[#1a1a1a] shadow-xl md:my-0 md:rounded-none relative">
                
                {/* Header */}
                <header className="p-6 flex justify-between items-center">
                     <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <FiX size={24} />
                     </button>
                     <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mark your important date</h1>
                     <div className="w-8" />
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Title Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Task Title</label>
                        <input 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter task title"
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Date</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white dark:[color-scheme:dark] outline-none"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Category</label>
                        <div className="flex flex-wrap gap-3">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                        category === cat.id 
                                        ? `${cat.color} border-transparent shadow-md scale-105`
                                        : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                        />
                    </div>

                     {/* Alert Toggle (Visual Only for now) */}
                     <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        <span className="font-bold text-sm text-gray-800 dark:text-white">Get alert for this task</span>
                        <div className="w-12 h-6 bg-pink-400 rounded-full relative cursor-pointer">
                            <div className="w-6 h-6 bg-white rounded-full absolute right-0 shadow-sm" />
                        </div>
                     </div>

                </div>

                {/* Footer Button */}
                <div className="p-6 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreateEvent;
