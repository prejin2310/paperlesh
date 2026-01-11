import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiInfo } from 'react-icons/fi';

const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm, type = 'danger' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white dark:bg-[#111] w-full max-w-xs rounded-[2rem] p-6 relative z-10 shadow-2xl border border-white/10"
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                            {type === 'danger' ? <FiTrash2 size={22} /> : <FiInfo size={22} />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                            {message}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { onConfirm(); onClose(); }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg ${type === 'danger' ? 'bg-red-500 shadow-red-500/30' : 'bg-indigo-600 shadow-indigo-500/30'}`}
                            >
                                {type === 'danger' ? 'Delete' : 'Confirm'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
