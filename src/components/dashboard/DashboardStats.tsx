import { useEffect, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalWorkshops: 0,
    totalBookings: 0,
    attendanceRate: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsingSampleData(false);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/workshop', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.workshops && Array.isArray(data.workshops)) {
            // Check if using sample data
            if (data.note && data.note.includes('sample data')) {
              console.log('Using sample workshop data');
              setUsingSampleData(true);
            }
            
            // Calculate stats from workshops array
            const workshopCount = data.workshops.length;
            
            setStats({
              totalWorkshops: workshopCount,
              totalBookings: Math.round(workshopCount * 5.5), // Estimating 5-6 bookings per workshop
              attendanceRate: '85%' // Placeholder
            });
          } else {
            setError('Invalid data format received from API');
          }
        } else {
          console.error('Failed to fetch workshop stats:', data.error);
          setError(`Failed to fetch stats: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Network error while fetching stats. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Workshops" value="Loading..." description="Active workshops" />
        <StatCard title="Total Bookings" value="Loading..." description="This month" />
        <StatCard title="Attendance Rate" value="Loading..." description="Last 30 days" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading dashboard stats</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {usingSampleData && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Note: Using sample data due to database connection issues.</span>
        </div>
      )}
    
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Workshops"
          value={stats.totalWorkshops.toString()}
          description="Active workshops"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          description="This month"
        />
        <StatCard
          title="Attendance Rate"
          value={stats.attendanceRate}
          description="Last 30 days"
        />
      </div>
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
        <dd className="mt-2 text-sm text-gray-600">{description}</dd>
      </div>
    </div>
  );
} 