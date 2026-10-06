import React, { useState } from 'react';
import { X, Check, Copy } from 'lucide-react';
import { WeChatQrCard } from './WeChatQrCard';

interface WeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  customQrUrl?: string;
  copyNotice?: boolean;
  wechatId?: string;
}

export const WeChatModal: React.FC<WeChatModalProps> = ({
  isOpen,
  onClose,
  customQrUrl,
  copyNotice = false,
  wechatId,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (!wechatId) return;
    navigator.clipboard.writeText(wechatId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[320px] sm:max-w-[340px] max-h-[92dvh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-4 border border-stone-200 animate-in zoom-in-95 duration-150 flex flex-col items-center cursor-default overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10 cursor-pointer"
          title="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Copy Notice Banner if triggered from checkout */}
        {copyNotice && (
          <div className="w-full mb-2.5 pr-7 pl-1">
            <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="leading-tight">清单已复制！扫码添加店主直接粘贴</span>
            </div>
          </div>
        )}

        {/* Pure image display */}
        <WeChatQrCard customQrUrl={customQrUrl} />

        {/* Mobile-friendly: One-click Copy WeChat ID */}
        {wechatId && (
          <div className="w-full mt-3 pt-2.5 border-t border-stone-100 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyId}
              className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">微信号已复制到剪贴板！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>微信号：<strong className="font-semibold text-stone-900">{wechatId}</strong> (点击复制)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-stone-400 text-center">
              手机端长按图片可识别名片，或复制微信号直接搜索
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
