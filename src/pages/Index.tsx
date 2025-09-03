import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate(isAdmin ? '/admin/dashboard' : '/cliente/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Cronogramas Inteligentes',
      description: 'Templates profissionais para acelerar seus projetos e manter tudo organizado.'
    },
    {
      icon: TrendingUp,
      title: 'Acompanhamento em Tempo Real',
      description: 'Monitore o progresso e identifique gargalos antes que se tornem problemas.'
    },
    {
      icon: Users,
      title: 'Colaboração Eficiente',
      description: 'Mantenha clientes e equipes alinhados com atualizações automáticas.'
    },
    {
      icon: CheckCircle,
      title: 'Gestão de Entregáveis',
      description: 'Organize documentos, marcos e deliverables em um só lugar.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEOHelmet />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Clock className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-foreground">
              Infinity Timeline
            </h1>
          </div>
          
          <h2 className="text-3xl font-semibold text-foreground mb-6 max-w-4xl mx-auto">
            Transforme a gestão dos seus projetos com cronogramas inteligentes
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A plataforma completa para acompanhar o progresso, gerenciar entregáveis 
            e manter seus projetos sempre no prazo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-primary hover:bg-primary-hover shadow-primary text-lg px-8 py-4"
            >
              {user ? 'Acessar Dashboard' : 'Começar Agora'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {!user && (
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-4 border-primary text-primary hover:bg-primary/5"
              >
                Fazer Login
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card/50 backdrop-blur-sm border-t">
        <div className="container mx-auto px-4 py-16 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Pronto para revolucionar seus projetos?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais que já transformaram 
            a gestão dos seus projetos com o Infinity Timeline.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary text-lg px-12 py-4"
          >
            {user ? 'Ir para Dashboard' : 'Criar Conta Gratuita'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
