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
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left — navy hero */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-leaf-900 via-leaf-900 to-harvest-900 px-10 py-12 text-white md:px-14 md:py-16">
        <div>
          <div className="mb-16 flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-harvest-600 text-white shadow-lg">
              <Leaf size={22} />
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight">GROCIFY</div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                B2B GROCERY MARKETPLACE
              </div>
            </div>
          </div>

          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-slate-400">
            Two-sided by design
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            One platform for wholesalers and the shops they supply.
          </h1>
          <p className="mt-5 max-w-md text-slate-300">
            Wholesalers list what they have, shopkeepers order what they need — with real
            approvals, live order tracking, and instant chat in between.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          <span>Direct Pricing</span>
          <span>·</span>
          <span>Live Tracking</span>
          <span>·</span>
          <span>Instant Chat</span>
        </div>
      </div>

      {/* Right — cream panel with portal choice */}
      <div className="flex items-center justify-center bg-cream-50 px-6 py-16 md:px-14">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-semibold text-slate-900">Get started</h2>
          <p className="mt-2 text-sm text-slate-500">Choose how you'll use Grocify.</p>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => navigate('/login/shopkeeper')}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition hover:border-harvest-400 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
                <Store size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900">Shopkeeper</h3>
                <p className="text-sm text-slate-500">Browse products and place orders</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-300 transition group-hover:text-harvest-600" />
            </button>

            <button
              onClick={() => navigate('/login/wholesaler')}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition hover:border-harvest-400 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
                <Warehouse size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900">Wholesaler</h3>
                <p className="text-sm text-slate-500">List products and fulfill orders</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-300 transition group-hover:text-harvest-600" />
            </button>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            New here?{' '}
            <button onClick={() => navigate('/register')} className="font-semibold text-harvest-600 hover:underline">
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
