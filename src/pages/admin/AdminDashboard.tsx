import { SEOHelmet } from '@/components/SEOHelmet';

const AdminDashboard = () => {
  return (
    <div>
      <SEOHelmet 
        title="Dashboard Admin" 
        description="Dashboard administrativo para gestão de clientes e templates."
      />
      <h1 className="text-3xl font-bold">Dashboard Admin</h1>
    </div>
  );
};

export default AdminDashboard;