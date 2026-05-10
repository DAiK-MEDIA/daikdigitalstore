import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="text-center space-y-8 p-12 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-navy blur-[60px] rounded-full" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-yellow blur-[60px] rounded-full" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-9xl font-black text-navy opacity-10">404</h1>
              <div className="relative -mt-16">
                <h2 className="text-4xl font-black text-navy">Page Not Found</h2>
                <p className="text-on-surface-variant font-medium mt-4">
                  The page you're looking for doesn't exist or has been moved to a new connectivity hub.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
