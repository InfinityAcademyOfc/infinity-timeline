import { SEOHelmet } from '@/components/SEOHelmet';

const ClientDocuments = () => {
  return (
    <div>
      <SEOHelmet 
        title="Meus Documentos" 
        description="Gerencie e visualize documentos relacionados aos seus projetos."
      />
      <h1 className="text-3xl font-bold">Meus Documentos</h1>
    </div>
  );
};

export default ClientDocuments;