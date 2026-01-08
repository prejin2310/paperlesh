import { useState } from 'react';
import { FiBook, FiCheckSquare, FiCalendar, FiTarget } from 'react-icons/fi';

const Month = () => {
  const sections = [
    { title: 'Habit Tracker', icon: FiCheckSquare, content: 'Habit grid goes here' },
    { title: 'To-do & Notes', icon: FiBook, content: 'List implementation' },
    { title: 'Events & Goals', icon: FiTarget, content: 'Goals list' },
    { title: 'Monthly Review', icon: FiCalendar, content: 'Reflection forms' }
  ];

  return (
    <div className="pb-24 pt-6 px-4 md:px-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Monthly Overview</h1>
      
      <div className="grid gap-6">
        {sections.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gray-50 rounded-full">
                        <section.icon className="w-5 h-5 text-black" />
                    </div>
                    <h2 className="text-lg font-bold">{section.title}</h2>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 min-h-[100px] flex items-center justify-center text-gray-400 text-sm font-medium">
                    {section.content}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Month;
