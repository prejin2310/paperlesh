import React, { useState } from 'react';
import { FiCheck, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MonthlyJournalBlock = ({ block, onUpdate, onDelete, isDarkMode }) => {
  // Types: 'text', 'checklist', 'retrospective'
  
  const handleTitleChange = (e) => {
    onUpdate({ ...block, title: e.target.value });
  };

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content || ''}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            placeholder="Write your thoughts here..."
            className={`w-full p-4 rounded-xl resize-none min-h-[120px] outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-100 placeholder-gray-600 focus:bg-gray-700' 
                : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-100'
            }`}
          />
        );

      case 'checklist':
        return (
          <div className="space-y-3">
             <div className="flex gap-2">
                <input 
                    type="text"
                    placeholder="Add item..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                            const newItems = [...(block.items || []), { id: Date.now(), text: e.target.value, completed: false }];
                            onUpdate({ ...block, items: newItems });
                            e.target.value = '';
                        }
                    }}
                    className={`flex-1 px-4 py-2 rounded-xl outline-none ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
                    }`}
                />
             </div>
             <div className="space-y-2">
                {(block.items || []).map((item, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        key={item.id || idx} 
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                            isDarkMode ? 'bg-gray-800/50' : 'bg-white border border-gray-100'
                        }`}
                    >
                        <button 
                            onClick={() => {
                                const newItems = [...block.items];
                                newItems[idx].completed = !newItems[idx].completed;
                                onUpdate({ ...block, items: newItems });
                            }}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                item.completed 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
                            }`}
                        >
                            {item.completed && <FiCheck size={12} />}
                        </button>
                        <span className={`flex-1 ${item.completed ? 'line-through opacity-50' : ''}`}>
                            {item.text}
                        </span>
                        <button 
                            onClick={() => {
                                const newItems = block.items.filter((_, i) => i !== idx);
                                onUpdate({ ...block, items: newItems });
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </motion.div>
                ))}
             </div>
          </div>
        );

      case 'retrospective':
        const columns = [
            { id: 'stop', label: 'Stop Doing', color: 'text-red-500', bg: 'bg-red-500' },
            { id: 'start', label: 'Start Doing', color: 'text-green-500', bg: 'bg-green-500' },
            { id: 'keep', label: 'Keep Doing', color: 'text-blue-500', bg: 'bg-blue-500' }
        ];
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map(col => (
                    <div key={col.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <h4 className={`font-bold mb-3 flex items-center gap-2 ${col.color}`}>
                            <span className={`w-2 h-2 rounded-full ${col.bg}`}></span>
                            {col.label}
                        </h4>
                        <div className="space-y-2">
                             {(block.content?.[col.id] || []).map((item, idx) => (
                                 <div key={idx} className="flex gap-2 group">
                                     <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400"></span>
                                     <p className="flex-1 text-sm">{item}</p>
                                     <button 
                                        onClick={() => {
                                            const newContent = { ...block.content };
                                            newContent[col.id] = newContent[col.id].filter((_, i) => i !== idx);
                                            onUpdate({ ...block, content: newContent });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                                     >
                                         <FiX size={12} />
                                     </button>
                                 </div>
                             ))}
                             <input 
                                type="text"
                                placeholder="Add..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        const newContent = { ...(block.content || { stop: [], start: [], keep: [] }) };
                                        if (!newContent[col.id]) newContent[col.id] = [];
                                        newContent[col.id] = [...newContent[col.id], e.target.value];
                                        onUpdate({ ...block, content: newContent });
                                        e.target.value = '';
                                    }
                                }}
                                className={`w-full bg-transparent outline-none text-sm border-b border-dashed border-gray-300 focus:border-gray-500 py-1 ${
                                    isDarkMode ? 'border-gray-700 focus:border-gray-500' : ''
                                }`}
                             />
                        </div>
                    </div>
                ))}
            </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`p-6 rounded-[2rem] transition-colors mb-6 group relative ${
        isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'
    }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <input 
                value={block.title}
                onChange={handleTitleChange}
                className={`font-black text-xl bg-transparent outline-none w-full ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
            />
            <button 
                onClick={() => onDelete(block.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-2"
            >
                <FiTrash2 />
            </button>
        </div>

        {renderContent()}
    </div>
  );
};

export default MonthlyJournalBlock;
