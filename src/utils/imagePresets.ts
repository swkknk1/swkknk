export interface ImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const PRESET_IMAGES: ImagePreset[] = [
  {
    id: 'camera',
    name: '复古旁轴机械相机',
    category: '数码摄影',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'keyboard',
    name: '客制化机械键盘',
    category: '电脑外设',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'backpack',
    name: '复古植鞣牛皮背包',
    category: '箱包服饰',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'coffee',
    name: '手冲陶瓷滤杯与分享壶',
    category: '生活美学',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'audio',
    name: '头戴式无线降噪耳机',
    category: '数码摄影',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'desk_stand',
    name: '实木黑胡桃桌面支架',
    category: '家居好物',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'watch',
    name: '极简机械腕表',
    category: '箱包服饰',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'books',
    name: '精装艺术设计书籍',
    category: '图书手办',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3d_printing',
    name: '3D打印定制与耗材',
    category: '定制服务',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'pc_service',
    name: '电脑维修与极客硬件',
    category: '定制服务',
    url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'key_fob',
    name: '门禁卡与电子钥匙复制',
    category: '定制服务',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'
  }
];

export const CATEGORIES = [
  '全部存货',
  '数码摄影',
  '电脑外设',
  '定制服务',
  '生活美学',
  '家居好物',
  '图书手办',
  '箱包服饰',
  '其他闲置'
];

export const CONDITIONS = [
  '全新未拆封',
  '99新 (仅拆封试用)',
  '95新 (轻微使用痕迹)',
  '9成新 (功能完好)',
  '8成新 (有明显磨损但功能正常)',
  '伊拉克战损 / 实用配件',
  '专业定制 / 按需提供'
];
