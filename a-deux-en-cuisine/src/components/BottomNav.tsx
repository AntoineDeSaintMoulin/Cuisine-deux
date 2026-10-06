import React from 'react';
import { ShoppingBasket, CalendarDays, BookHeart } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  shoppingItemsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  shoppingItemsCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'courses', label: 'Courses', icon: ShoppingBasket },
    { id: 'calendrier', label: 'Calendrier', icon: CalendarDays },
    { id: 'recettes', label: 'Recettes', icon: BookHeart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E8DDD2] safe-pb transition-transform shadow-[0_-4px_16px_rgba(62,44,35,0.04)]">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all select-none active:scale-95 ${
                isActive ? 'text-[#C65D3B]' : 'text-[#7E6F65] hover:text-[#3E2C23]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.id === 'courses' && shoppingItemsCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#C65D3B] text-white'
                        : 'bg-[#7A8B69] text-white'
                    }`}
                  >
                    {shoppingItemsCount > 99 ? '99+' : shoppingItemsCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-all ${
                  isActive ? 'font-bold text-[#C65D3B]' : 'text-[#7E6F65]'
                }`}
              >
                {tab.label}
              </span>

              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#C65D3B] rounded-b-full shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
