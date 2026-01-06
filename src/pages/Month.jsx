import { useParams } from 'react-router-dom';

const Month = () => {
  const { month } = useParams();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Month View</h1>
      <p>Viewing: {month || 'Current Month'}</p>
    </div>
  );
};

export default Month;
