import { ArrowBack } from '@mui/icons-material';
import React from 'react';
import { FaRunning } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">This page is Coming Soon!</h1>
        <p className="text-sm text-gray-600 mb-4"> We are working hard to bring you this page. Stay tuned for updates!</p>        
      </div>
      <div className='text-6xl text-gray-800 animate-bounce text-center'>
        <div className="animate-bounce">
          <FaRunning size={70} />
        </div>
      </div>
      <div className="mt-8 text-center">
        <button
          className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold text-lg hover:bg-opacity-90 transition"
          onClick={() => navigate(-1)}
        >
         <ArrowBack className='mr-2'/>
          Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;