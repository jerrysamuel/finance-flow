import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Upload,
  PieChart,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Smart Statement Upload',
    description: 'Upload CSV or PDF bank statements and let our AI automatically categorize your transactions.',
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    description: 'Beautiful charts and insights help you understand exactly where your money goes.',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Progress',
    description: 'Monitor income vs expenses over time and see your financial trends at a glance.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your financial data is encrypted and never shared. We take security seriously.',
  },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Trackr</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-income/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              Smart expense tracking made simple
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              Take control of your{' '}
              <span className="gradient-text">finances</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up stagger-1">
              Upload your bank statements, track every expense, and get beautiful
              insights into your spending habits. Start your journey to financial
              freedom today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
              <Link to="/register">
                <Button variant="hero" size="xl">
                  Start Free Today
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground animate-fade-in stagger-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-income" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-income" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-income" />
                Bank-level security
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage money
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you understand and improve your
              financial health.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-elevated p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="card-elevated p-8 md:p-12 bg-gradient-to-br from-primary/5 to-income/5">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  50K+
                </div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  $2M+
                </div>
                <p className="text-muted-foreground">Expenses Tracked</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  99.9%
                </div>
                <p className="text-muted-foreground">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to take control?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who have already transformed their financial
              habits with Trackr.
            </p>
            <Link to="/register">
              <Button variant="hero" size="xl">
                Get Started for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Trackr</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Trackr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
