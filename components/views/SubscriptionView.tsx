import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import ButtonGlow from '../ui/ButtonGlow';
import Card3D from '../ui/Card3D';
import { Check } from 'lucide-react';

export const SubscriptionView: React.FC<{ currentPlan: SubscriptionPlan; onUpgrade: (plan: SubscriptionPlan) => Promise<void> }> = ({ currentPlan, onUpgrade }) => {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const plans = [
    { id: 'FREE', name: 'START', price: '0 ₽', features: ['3 анализа в день', 'Базовый Health Score', 'Реклама'] },
    { id: 'PRO', name: 'PRO', price: '199 ₽', features: ['Безлимит анализов', 'Детальный разбор Е-шек', 'История за 30 дней', 'Без рекламы'], popular: true },
    { id: 'ULTRA', name: 'ULTRA', price: '299 ₽', features: ['Все функции PRO', 'Персональные рекомендации', 'Telegram бот', 'Семейный доступ'] }
  ];

  const handleUpgradeClick = async (planId: string) => {
      setLoadingPlan(planId as SubscriptionPlan);
      await onUpgrade(planId as SubscriptionPlan);
      setLoadingPlan(null);
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4 text-white">Инвестируй в долголетие</h2>
        <p className="text-gray-400">Стоимость меньше чашки кофе.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card3D key={plan.id} className="h-full">
            <div className={`flex flex-col h-full relative ${plan.popular ? 'border-brand-purple' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-brand-purple text-xs font-bold px-2 py-1 rounded-bl-lg text-white">POPULAR</div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-white mb-6">{plan.price}<span className="text-sm font-normal text-gray-500">/мес</span></div>
              
              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" /> {feat}
                  </li>
                ))}
              </ul>

              <ButtonGlow 
                variant={currentPlan === plan.id ? 'secondary' : 'primary'}
                onClick={() => handleUpgradeClick(plan.id)}
                disabled={currentPlan === plan.id}
                isLoading={loadingPlan === plan.id}
                className={`!w-full ${currentPlan === plan.id ? 'opacity-50 cursor-not-allowed !bg-white/5 !text-gray-500' : 'text-white'}`}
              >
                {currentPlan === plan.id ? 'Текущий план' : 'Выбрать'}
              </ButtonGlow>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};