import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiMove, FiArrowUp, FiArrowDown, FiCheck, FiSave } from 'react-icons/fi';

const AVAILABLE_TOOLS = [
    { id: 'log-pause', title: 'Pause & Reflect', emoji: '🌱', subtitle: 'Gratitude check', type: 'log', color: 'rose' },
    { id: 'log-intention', title: 'Set Intentions', emoji: '🤔', subtitle: 'How to feel?', type: 'log', color: 'indigo' },
    { id: 'log-emotion', title: 'Emotions', emoji: '💭', subtitle: 'Breathe it out', type: 'log', color: 'emerald' },
    { id: 'tool-bucket2026', title: 'Bucket List 2026', emoji: '🌍', subtitle: 'Yearly Goals', type: 'bucket-list-2026', color: 'orange' },
    { id: 'tool-todo', title: 'To Do List', emoji: '📝', subtitle: 'Get things done', type: 'todo-list', color: 'blue' },
    { id: 'tool-monthNote', title: 'Monthly Note', emoji: '📅', subtitle: 'Quick thoughts', type: 'monthly-note', color: 'yellow' },
    { id: 'tool-important-dates', title: 'Important Dates', emoji: '🎂', subtitle: 'Birthdays & Events', type: 'important-dates', color: 'pink' },
];

const EMOJI_OPTIONS = ['✨', '📔', '💪', '🧠', '❤️', '💼', '🎨', '🎵', '🥗', '😴', '🧘', '🚀'];

const QuickAccessManager = ({ isOpen, onClose, currentItems, onUpdate, customTools = [], onCreateCustomTool }) => {
    const [selectedItems, setSelectedItems] = useState(currentItems);
    const [isCreating, setIsCreating] = useState(false);
    const [newToolData, setNewToolData] = useState({ title: '', subtitle: '', emoji: '✨' });

    useEffect(() => {
        setSelectedItems(currentItems);
    }, [currentItems, isOpen]);

    const handleToggle = (tool) => {
        if (selectedItems.find(i => i.id === tool.id)) {
            // Remove
            setSelectedItems(prev => prev.filter(i => i.id !== tool.id));
        } else {
            // Add
            setSelectedItems(prev => [...prev, tool]);
        }
    };

    const moveItem = (index, direction) => {
        const newItems = [...selectedItems];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        setSelectedItems(newItems);
    };

    const handleSave = () => {
        onUpdate(selectedItems);
        onClose();
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!newToolData.title) return;

        const newTool = {
            id: `custom-${Date.now()}`,
            title: newToolData.title,
            subtitle: newToolData.subtitle || 'Custom shortcut',
            emoji: newToolData.emoji,
            type: 'log', // Default to log for now as requested "journal card"
            color: 'indigo' // Default color
        };

        onCreateCustomTool(newTool);
        setIsCreating(false);
        setNewToolData({ title: '', subtitle: '', emoji: '✨' });
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
                     <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            {isCreating ? 'Create Shortcut' : 'Customize Quick Access'}
                        </h2>
                        <button onClick={() => isCreating ? setIsCreating(false) : onClose()}>
                            <FiX size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        
                        {isCreating ? (
                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Icon</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {EMOJI_OPTIONS.map(emo => (
                                            <button 
                                                type="button"
                                                key={emo}
                                                onClick={() => setNewToolData({...newToolData, emoji: emo})}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border transition-colors ${newToolData.emoji === emo ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}
                                            >
                                                {emo}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Title</label>
                                    <input 
                                        type="text" 
                                        value={newToolData.title}
                                        onChange={e => setNewToolData({...newToolData, title: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        placeholder="e.g., Morning Pages"
                                        autoFocus
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Subtitle</label>
                                    <input 
                                        type="text" 
                                        value={newToolData.subtitle}
                                        onChange={e => setNewToolData({...newToolData, subtitle: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        placeholder="e.g., Clear my mind"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <FiSave /> Create Shortcut
                                </button>
                            </form>
                        ) : (
                            <>
                                {/* Active / Ordering Section */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your Home Screen</h3>
                                    {selectedItems.length === 0 && <p className="text-gray-400 italic text-sm mb-4">No shortcuts selected.</p>}
                                    <div className="space-y-2">
                                        {selectedItems.map((item, index) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                                                    <FiMove />
                                                </div>
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-lg">
                                                    {item.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{item.title}</div>
                                                    <div className="text-xs text-gray-400 truncate">{item.subtitle}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        disabled={index === 0}
                                                        onClick={() => moveItem(index, 'up')}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-400 disabled:opacity-20"
                                                    >
                                                        <FiArrowUp size={14} />
                                                    </button>
                                                    <button 
                                                        disabled={index === selectedItems.length - 1}
                                                        onClick={() => moveItem(index, 'down')}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-400 disabled:opacity-20"
                                                    >
                                                        <FiArrowDown size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggle(item)}
                                                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 ml-1"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Available Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Available Tools</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Create New Button */}
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-gray-400 hover:text-indigo-500 transition-all flex flex-col items-center justify-center gap-2 min-h-[100px]"
                                        >
                                            <FiPlus size={24} />
                                            <span className="text-xs font-bold">Create New</span>
                                        </button>

                                        {[...AVAILABLE_TOOLS, ...customTools].map(tool => {
                                            const isAdded = selectedItems.some(i => i.id === tool.id);
                                            return (
                                                <button
                                                    key={tool.id}
                                                    onClick={() => handleToggle(tool)}
                                                    disabled={isAdded}
                                                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden min-h-[100px] flex flex-col justify-between
                                                        ${isAdded 
                                                            ? 'border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 opacity-60 cursor-default' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-md bg-white dark:bg-gray-800'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-2xl">{tool.emoji}</span>
                                                        {isAdded && <div className="text-indigo-500 bg-white dark:bg-black rounded-full p-1"><FiCheck size={12} /></div>}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{tool.title}</div>
                                                        <div className="text-[10px] text-gray-500 line-clamp-1">{tool.subtitle}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {!isCreating && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                            <button 
                                onClick={handleSave}
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}

                </motion.div>
             </div>
        </AnimatePresence>,
        document.body
    );
};

export default QuickAccessManager;
