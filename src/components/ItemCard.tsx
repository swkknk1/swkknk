import React from 'react';
import { Check, CheckSquare, Square, Eye, Camera } from 'lucide-react';
import { InventoryItem } from '../types';
import { ItemImage } from './ItemImage';
import { getItemCardHighlights } from './FormattedDescription';

interface ItemCardProps {
  item: InventoryItem;
  currency: string;
  isSelected: boolean;
  onToggleSelect: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  currency,
  isSelected,
  onToggleSelect,
  onViewDetails,
}) => {
  const isAvailable = item.status === 'available' && item.stock > 0;
  const isReserved = item.status === 'reserved';
  const isSold = item.status === 'sold' || item.stock <= 0;

  const { coreFeature, tags: highlightTags } = getItemCardHighlights(item, currency);

  return (
    <div
      className={`group relative flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 bg-white ${
        isSelected
          ? 'border-amber-600 ring-2 ring-amber-600/20 shadow-md'
          : 'border-stone-200/80 hover:border-stone-300 hover:shadow-sm'
      }`}
    >
      {/* Visual Area */}
      <div
        className="relative cursor-pointer overflow-hidden bg-stone-100 select-none"
        onClick={() => onViewDetails(item)}
      >
        <ItemImage
          src={item.images?.[0] || item.imageUrl}
          alt={item.title}
          category={item.category}
          aspectRatio="4/3"
        />

        {/* Multi-photo badge */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 left-2 z-10 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <Camera className="w-3 h-3" />
            <span>{item.images.length} 图</span>
          </div>
        )}

        {/* Quick Select Floating Button on Top-Right of Image: Enlarged 38px touch target */}
        {isAvailable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item);
            }}
            aria-label={isSelected ? `取消勾选 ${item.title}` : `勾选 ${item.title}`}
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
              isSelected
                ? 'bg-amber-600 text-white ring-2 ring-white shadow-amber-600/30'
                : 'bg-white/95 text-stone-600 hover:text-stone-900 hover:bg-white backdrop-blur-xs border border-stone-200/60'
            }`}
          >
            {isSelected ? (
              <Check className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-stone-400" />
            )}
          </button>
        )}

        {/* Status Overlay if Reserved or Sold */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
            <span className="text-white text-[11px] sm:text-xs font-semibold tracking-wider px-2.5 py-1 bg-stone-900/80 rounded border border-white/20">
              {isSold ? '已售出 / 已结缘' : '买家已预定'}
            </span>
          </div>
        )}

        {/* Quick View Hover Hint (desktop only) */}
        <div className="hidden sm:flex absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 text-white text-[11px] px-2 py-1 rounded items-center gap-1 backdrop-blur-xs pointer-events-none">
          <Eye className="w-3 h-3" />
          <span>查看详情</span>
        </div>
      </div>

      {/* Content Area with touch-friendly padding */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Category, Condition & Stock */}
          <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-stone-500 mb-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-medium text-stone-700 truncate">{item.category}</span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-stone-600 truncate">{item.condition}</span>
            </div>
            {item.stock > 1 && (
              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 shrink-0">
                存量 {item.stock}
              </span>
            )}
          </div>

          {/* Title - Generous tap target to view details */}
          <h3
            onClick={() => onViewDetails(item)}
            className="text-xs sm:text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2 cursor-pointer hover:text-amber-800 transition-colors py-0.5"
          >
            {item.title}
          </h3>

          {/* Core Feature Line: 1-line key selling point without messy wrap */}
          {coreFeature && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
              <span className="truncate leading-tight">{coreFeature}</span>
            </div>
          )}

          {/* Focus Tags / Badges Row (Condition, Key Props, Savings) */}
          {highlightTags.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden flex-nowrap">
              {highlightTags.slice(0, 3).map((tag, idx) => {
                const isDiscount = tag.startsWith('省') || tag.startsWith('立省');
                return (
                  <span
                    key={idx}
                    className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded leading-tight truncate shrink-0 ${
                      isDiscount
                        ? 'bg-amber-100 text-amber-900 border border-amber-200/70 font-semibold'
                        : 'bg-stone-100 text-stone-600 border border-stone-200/50'
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Price & Selection Bar: Stacked or row based on screen width */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 flex flex-col gap-2">
          {/* Price Row */}
          <div className="flex items-baseline justify-between gap-1.5">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-stone-900">
                {currency}{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-[10px] sm:text-xs text-stone-400 line-through font-mono tabular-nums">
                  {currency}{item.originalPrice}
                </span>
              )}
            </div>

            {/* Click to view detail text link on mobile */}
            <button
              type="button"
              onClick={() => onViewDetails(item)}
              className="sm:hidden text-[11px] text-stone-400 hover:text-stone-700 underline shrink-0 cursor-pointer"
            >
              详情
            </button>
          </div>

          {/* Primary Action Button: Enlarged mobile touch area (min 42px height) */}
          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item);
              }}
              className={`w-full min-h-[42px] sm:min-h-[36px] py-2 px-3 text-xs font-semibold rounded-lg sm:rounded-md transition-all flex items-center justify-center gap-1.5 select-none active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-xs hover:bg-amber-700 ring-1 ring-amber-600'
                  : 'bg-stone-50 text-stone-700 border border-stone-200/90 hover:border-stone-300 hover:bg-stone-100'
              }`}
            >
              {isSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>已勾选心仪</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-stone-400" />
                  <span>我想买</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full min-h-[36px] flex items-center justify-center bg-stone-100 text-stone-400 rounded-lg text-xs font-medium">
              {isSold ? '已结缘' : '已锁定'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
