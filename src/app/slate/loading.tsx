import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className='flex justify-center items-center h-screen'>
      <LoadingSpinner size={48} />
    </div>
  );
} 