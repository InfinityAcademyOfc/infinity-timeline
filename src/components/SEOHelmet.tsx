import { Helmet } from 'react-helmet-async';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
}

export const SEOHelmet = ({
  title = 'Infinity Timeline - Gestão de Cronogramas Profissional',
  description = 'Plataforma completa para gestão de cronogramas e projetos. Acompanhe o progresso, gerencie entregáveis e mantenha seus projetos no prazo.',
  keywords = 'gestão de projetos, cronograma, timeline, produtividade, acompanhamento de projetos',
  canonical,
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png'
}: SEOHelmetProps) => {
  const fullTitle = title.includes('Infinity Timeline') ? title : `${title} | Infinity Timeline`;
  const currentUrl = canonical || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Infinity Timeline" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  );
};