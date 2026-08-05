import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Store, Warehouse, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-leaf-50 via-white to-white px-4 py-16">
      <div className="w-full max-w-3xl text-center">
        <div className="mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-600 text-white shadow-card">
            <Leaf size={30} />
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-leaf-800">GROCIFY</h1>
          <p className="mt-3 text-slate-500">B2B Grocery Platform — Connecting Shopkeepers &amp; Wholesalers</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => navigate('/login/shopkeeper')}
            className="group card w-72 text-left transition hover:border-leaf-400 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600">
              <Store size={24} />
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-slate-900">Shopkeeper Portal</h2>
            <p className="mb-5 text-sm text-slate-500">
              Browse products from wholesalers, place bulk orders, and track deliveries.
            </p>
            <span className="btn-primary w-full">
              Login as Shopkeeper <ArrowRight size={16} />
            </span>
          </button>

          <button
            onClick={() => navigate('/login/wholesaler')}
            className="group card w-72 text-left transition hover:border-harvest-500 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-harvest-50 text-harvest-500">
              <Warehouse size={24} />
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-slate-900">Wholesaler Portal</h2>
            <p className="mb-5 text-sm text-slate-500">
              List your products, manage inventory, and fulfill orders from shopkeepers.
            </p>
            <span className="btn-primary w-full">
              Login as Wholesaler <ArrowRight size={16} />
            </span>
          </button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          New here?{' '}
          <button onClick={() => navigate('/register')} className="font-semibold text-leaf-700 hover:underline">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
