const AMAZON_BASE = {
  meta: {
    reportDate: "2026-08-12",
    previousDate: "2026-08-05",
    marketplace: "Amazon US",
    groups: 5,
    categories: 12,
    records: 640,
    images: 72,
  },
  groups: [
    { name: "灯光类", categories: 3, records: 174, images: 18 },
    { name: "支架类", categories: 4, records: 205, images: 24 },
    { name: "脚架类", categories: 3, records: 158, images: 18 },
    { name: "音视频类", categories: 1, records: 59, images: 6 },
    { name: "智能工作室类", categories: 1, records: 44, images: 6 },
  ],
  categories: [
    { group: "灯光类", name: "Continuous Output Lighting", brand: "SENSYNE", asin: "B08B3X7NXC", topSales: 9246, price: 28.49, rating: 4.4, image: "https://m.media-amazon.com/images/I/617KpHXx-oL.jpg", title: "Sensyne Ring Light with Stand, 50-inch Phone Tripod" },
    { group: "灯光类", name: "Selfie Lights", brand: "ALTSON", asin: "B0C2C9QT91", topSales: 22491, price: 12.49, rating: 4.5, image: "https://m.media-amazon.com/images/I/71mi169ArHL._AC_SL1500_.jpg", title: "ALTSON 60 LED Portable Selfie Light with Clip" },
    { group: "灯光类", name: "On-Camera Video Lights", brand: "Weilisi", asin: "B08JPCSDMP", topSales: 8913, price: 27.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/718TMy8lXmL.jpg", title: "Weilisi 10-inch Ring Light with Stand and Phone Holder" },
    { group: "支架类", name: "Cradles", brand: "ANDERY", asin: "B0DN1S1YLV", topSales: 46421, price: 25.58, rating: 4.3, image: "https://m.media-amazon.com/images/I/71GXSlQR9ML.jpg", title: "ANDERY MagSafe Car Phone Holder with Strong Suction" },
    { group: "支架类", name: "Grips", brand: "PopSockets", asin: "B0CDF5M6TW", topSales: 66897, price: 16.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/51iWFM8x80L._AC_SL1199_.jpg", title: "PopSockets Phone Grip for MagSafe, Magnetic Holder" },
    { group: "支架类", name: "Stands", brand: "Nulaxy", asin: "B07F8S18D5", topSales: 21099, price: 9.99, rating: 4.7, image: "https://m.media-amazon.com/images/I/61srjyM7TFL._AC_SL1500_.jpg", title: "Nulaxy Full Aluminum Dual Folding Cell Phone Stand" },
    { group: "支架类", name: "Camera Mounts & Clamps", brand: "ANXRE", asin: "B0DS24YLFM", topSales: 6129, price: 17.99, rating: 4.4, image: "https://m.media-amazon.com/images/I/61IFlrb8crL._AC_SL1500_.jpg", title: "ANXRE 71-inch Phone Tripod with Camera Mount" },
    { group: "脚架类", name: "Complete Tripods", brand: "Liphisy", asin: "B0CMM89Y6Z", topSales: 11176, price: 21.99, rating: 4.6, image: "https://m.media-amazon.com/images/I/61G1zIdlFwL.jpg", title: "Liphisy 64-inch Tripod for Cell Phone and Camera" },
    { group: "脚架类", name: "Tripods", brand: "SENSYNE", asin: "B09TQY66NH", topSales: 20301, price: 19.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/51svJuNXDyL._AC_SL1500_.jpg", title: "SENSYNE 62-inch Phone Tripod with Wireless Remote" },
    { group: "脚架类", name: "Selfie Sticks", brand: "eucos", asin: "B09XHZ8F7F", topSales: 18705, price: 23.99, rating: 4.6, image: "https://m.media-amazon.com/images/I/61LnPbT7KML.jpg", title: "EUCOS 62-inch Phone Tripod and Selfie Stick" },
    { group: "音视频类", name: "Professional Video Microphones", brand: "DJI", asin: "B0DDL8WGH5", topSales: 39338, price: 79, rating: 4.7, image: "https://m.media-amazon.com/images/I/6132m-fHnjL._AC_SL1500_.jpg", title: "DJI Mic Mini Wireless Microphone Combo" },
    { group: "智能工作室类", name: "Digital Audio Workstation Controllers", brand: "Elgato", asin: "B0BJL8SJ59", topSales: 1811, price: 159.99, rating: 4.6, image: "https://m.media-amazon.com/images/I/519jbgbd1sL._AC_SL1500_.jpg", title: "Elgato Stream Deck Plus Audio Mixer and Studio Controller" },
  ],
  movements: [
    { group: "灯光类", category: "Continuous Output Lighting", type: "上升", brand: "Ci-Fotto", asin: "B0GVRXWC5V", rank: 37, previousRank: 93, change: 56, sales: 116, price: 49.99, rating: 4.0, image: "https://m.media-amazon.com/images/I/71Q7DRkm9UL._AC_SL1500_.jpg", title: "20W LED Photo Video Light 2-Pack" },
    { group: "灯光类", category: "Continuous Output Lighting", type: "下降", brand: "ZDMDRGB", asin: "B0D4VPY1W2", rank: 92, previousRank: 48, change: -44, sales: 228, price: 245.9, rating: 4.5, image: "https://m.media-amazon.com/images/I/71t3RY7pSrL._AC_SL1500_.jpg", title: "Portable Battery Powered RGB Tube Lights 6-Pack" },
    { group: "灯光类", category: "Continuous Output Lighting", type: "新上榜", brand: "SMALLRIG", asin: "B0GVT2ZB9Z", rank: 12, previousRank: null, change: null, sales: 1060, price: 71.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/71OIaihVXKL._AC_SL1500_.jpg", title: "SmallRig RF 20C Zoomable LED Photography Flashlight" },
    { group: "灯光类", category: "Selfie Lights", type: "上升", brand: "Bialeire", asin: "B0F9WGK5CW", rank: 66, previousRank: 90, change: 24, sales: 215, price: 62.99, rating: 4.6, image: "https://m.media-amazon.com/images/I/61kIZcQAXFL.jpg", title: "12-inch Ring Light with Overhead Phone Stand" },
    { group: "灯光类", category: "Selfie Lights", type: "下降", brand: "UBeesize", asin: "B0D2X96H19", rank: 94, previousRank: 40, change: -54, sales: 306, price: 31.07, rating: 4.3, image: "https://m.media-amazon.com/images/I/61thqxdzC6L.jpg", title: "UBeesize Desk Ring Light with Stand" },
    { group: "灯光类", category: "Selfie Lights", type: "新上榜", brand: "Weilisi", asin: "B0CH9KZXWR", rank: 18, previousRank: null, change: null, sales: 1895, price: 37.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/71U2cSuvuuL._AC_SL1500_.jpg", title: "Weilisi Desk Ring Light with 360-degree Rotation" },
    { group: "灯光类", category: "On-Camera Video Lights", type: "上升", brand: "NEEWER", asin: "B004TJ6JH6", rank: 47, previousRank: 70, change: 23, sales: 58, price: 35.99, rating: 4.4, image: "https://m.media-amazon.com/images/I/71vyAKnq8WL.jpg", title: "NEEWER 160 LED Dimmable Panel Light" },
    { group: "灯光类", category: "On-Camera Video Lights", type: "下降", brand: "K&F CONCEPT", asin: "B0FN44SMBJ", rank: 78, previousRank: 51, change: -27, sales: 58, price: 26.99, rating: 4.3, image: "https://m.media-amazon.com/images/I/71LrMbVDEyL._AC_SL1500_.jpg", title: "K&F CONCEPT 12W RGB Camera Video Light" },
    { group: "灯光类", category: "On-Camera Video Lights", type: "新上榜", brand: "ULANZI", asin: "B0C27V59PF", rank: 41, previousRank: null, change: null, sales: 58, price: 25.95, rating: 4.3, image: "https://m.media-amazon.com/images/I/71Z7uBAMtOL._AC_SL1500_.jpg", title: "ULANZI VL49 Pro RGB Mini Video Light" },

    { group: "支架类", category: "Cradles", type: "上升", brand: "Blukar", asin: "B0C1NK79FK", rank: 6, previousRank: 52, change: 46, sales: 3844, price: 6.97, rating: 4.5, image: "https://m.media-amazon.com/images/I/71FDDOYxJKL.jpg", title: "Blukar Air Vent Car Phone Holder Mount" },
    { group: "支架类", category: "Cradles", type: "下降", brand: "HTU", asin: "B0B615D4XV", rank: 72, previousRank: 26, change: -46, sales: 2349, price: 36.99, rating: 4.4, image: "https://m.media-amazon.com/images/I/81IesSjtplL.jpg", title: "Military-Grade Suction Car Phone Mount" },
    { group: "支架类", category: "Cradles", type: "新上榜", brand: "Miracase", asin: "B0GHY6D5B2", rank: 4, previousRank: null, change: null, sales: 34224, price: 19.79, rating: 4.3, image: "https://m.media-amazon.com/images/I/81RBH43vQiL.jpg", title: "Miracase MagSafe Vacuum Magnetic Car Mount" },
    { group: "支架类", category: "Grips", type: "上升", brand: "TORRAS", asin: "B0FK57B2SG", rank: 35, previousRank: 70, change: 35, sales: 1748, price: 24.29, rating: 4.3, image: "https://m.media-amazon.com/images/I/71eB7W9BB+L._AC_SL1500_.jpg", title: "TORRAS 360 Magnetic Phone Grip Ring Holder" },
    { group: "支架类", category: "Grips", type: "下降", brand: "LOVEHANDLE", asin: "B01CIN6AXM", rank: 91, previousRank: 25, change: -66, sales: 2013, price: 10.5, rating: 4.4, image: "https://m.media-amazon.com/images/I/61ng85r1rmL.jpg", title: "LOVEHANDLE Universal Phone Grip" },
    { group: "支架类", category: "Grips", type: "新上榜", brand: "PopSockets", asin: "B0CDF5M6TW", rank: 1, previousRank: null, change: null, sales: 66897, price: 16.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/51iWFM8x80L._AC_SL1199_.jpg", title: "PopSockets Magnetic Phone Grip for MagSafe" },
    { group: "支架类", category: "Stands", type: "上升", brand: "JUSDIQIR", asin: "B0C6FH6CS6", rank: 64, previousRank: 96, change: 32, sales: 390, price: 6.49, rating: 4.2, image: "https://m.media-amazon.com/images/I/51R7tU4e0fL.jpg", title: "Foldable Cell Phone Stand 2-Pack" },
    { group: "支架类", category: "Stands", type: "下降", brand: "Klearlook", asin: "B07XC1NT8N", rank: 78, previousRank: 35, change: -43, sales: 1213, price: 11.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/71qFujdontL.jpg", title: "Klearlook Airplane Phone Holder" },
    { group: "支架类", category: "Stands", type: "新上榜", brand: "LISEN", asin: "B0FP98MW6G", rank: 25, previousRank: null, change: null, sales: 692, price: 9.98, rating: 4.4, image: "https://m.media-amazon.com/images/I/71bZyww4NVL._AC_SL1500_.jpg", title: "LISEN Airplane Travel Phone Stand" },
    { group: "支架类", category: "Camera Mounts & Clamps", type: "上升", brand: "Generic", asin: "B0H6KZVNL9", rank: 31, previousRank: 92, change: 61, sales: 1150, price: 14.99, rating: 3.3, image: "https://m.media-amazon.com/images/I/61b-KEMqzfL.jpg", title: "Camera Holder 1.0" },
    { group: "支架类", category: "Camera Mounts & Clamps", type: "下降", brand: "NEEWER", asin: "B0FV3F9CS9", rank: 99, previousRank: 50, change: -49, sales: 560, price: 21.99, rating: 4.4, image: "https://m.media-amazon.com/images/I/61fI4Td15cL._AC_SL1500_.jpg", title: "NEEWER Magnetic Tripod Phone Mount" },
    { group: "支架类", category: "Camera Mounts & Clamps", type: "新上榜", brand: "SMALLRIG", asin: "B0D4VFXQST", rank: 45, previousRank: null, change: null, sales: 1030, price: 29.44, rating: 4.6, image: "https://m.media-amazon.com/images/I/61G3DLxS8pL._AC_SL1500_.jpg", title: "SMALLRIG Magic Arm Clamp Kit" },

    { group: "脚架类", category: "Complete Tripods", type: "上升", brand: "SENSYNE", asin: "B0B5KV5FKZ", rank: 45, previousRank: 70, change: 25, sales: 337, price: 21.05, rating: 4.6, image: "https://m.media-amazon.com/images/I/61prZ-zxYwL.jpg", title: "Sensyne Camera Tripod Stand for Phone and iPad" },
    { group: "脚架类", category: "Complete Tripods", type: "下降", brand: "UISKOOPW", asin: "B0F296CWNV", rank: 93, previousRank: 58, change: -35, sales: 230, price: 79.99, rating: 4.4, image: "https://m.media-amazon.com/images/I/61CXHsEnl1L._AC_SL1500_.jpg", title: "Adjustable Hunting Shooting Stick Tripod" },
    { group: "脚架类", category: "Complete Tripods", type: "新上榜", brand: "NEEWER", asin: "B081Q9YVJS", rank: 23, previousRank: null, change: null, sales: 1046, price: 55.19, rating: 4.6, image: "https://m.media-amazon.com/images/I/71vWB1G+vOL._AC_SL1500_.jpg", title: "NEEWER 77-inch Camera Tripod Monopod" },
    { group: "脚架类", category: "Tripods", type: "上升", brand: "kzomKzoo", asin: "B0GJYSSTNJ", rank: 55, previousRank: 99, change: 44, sales: 471, price: 11.69, rating: 4.3, image: "https://m.media-amazon.com/images/I/6116ifFFv-L.jpg", title: "67-inch Selfie Stick Tripod with Light" },
    { group: "脚架类", category: "Tripods", type: "下降", brand: "PHICANT", asin: "B08GKSYDKT", rank: 100, previousRank: 77, change: -23, sales: 447, price: 6.49, rating: 4.7, image: "https://m.media-amazon.com/images/I/51I0NvoKfOS._AC_SL1000_.jpg", title: "Universal Tripod Cell Phone Holder" },
    { group: "脚架类", category: "Tripods", type: "新上榜", brand: "LISEN", asin: "B0GGB161WK", rank: 4, previousRank: null, change: null, sales: 2397, price: 28.88, rating: 4.4, image: "https://m.media-amazon.com/images/I/71uDvP1Td9L.jpg", title: "LISEN Selfie Stick Tripod for Content Creators" },
    { group: "脚架类", category: "Selfie Sticks", type: "上升", brand: "TONEOF", asin: "B0D56PRG49", rank: 22, previousRank: 55, change: 33, sales: 10341, price: 25.99, rating: 4.6, image: "https://m.media-amazon.com/images/I/61AqzqL7IcL.jpg", title: "TONEOF 67-inch All-in-One Selfie Stick Tripod" },
    { group: "脚架类", category: "Selfie Sticks", type: "下降", brand: "HUGSEE", asin: "B0GDCQ234T", rank: 65, previousRank: 37, change: -28, sales: 340, price: 39.49, rating: 4.3, image: "https://m.media-amazon.com/images/I/71n6QEKkDsL.jpg", title: "Content Creator Starter Kit with Tracking Tripod" },
    { group: "脚架类", category: "Selfie Sticks", type: "新上榜", brand: "Voinap", asin: "B0H6Q94L1B", rank: 18, previousRank: null, change: null, sales: 311, price: 24.69, rating: 5.0, image: "https://m.media-amazon.com/images/I/71PWEeiW2uL._AC_SL1500_.jpg", title: "Golf Selfie Stick Tripod and Ground Spike" },

    { group: "音视频类", category: "Professional Video Microphones", type: "上升", brand: "VIERYCIY", asin: "B0B49H88GH", rank: 55, previousRank: 93, change: 38, sales: 74, price: 10.88, rating: 4.1, image: "https://m.media-amazon.com/images/I/61WpgrDH5NL.jpg", title: "Camera Microphone Wind Muff for GoPro" },
    { group: "音视频类", category: "Professional Video Microphones", type: "下降", brand: "DJI", asin: "B0FP32KW7Z", rank: 71, previousRank: 20, change: -51, sales: 180, price: 237, rating: 4.6, image: "https://m.media-amazon.com/images/I/51tgWrBpSAL.jpg", title: "DJI Mic 3 Wireless Microphone Combo" },
    { group: "音视频类", category: "Professional Video Microphones", type: "新上榜", brand: "COMICA", asin: "B07DWRGWRF", rank: 6, previousRank: null, change: null, sales: 459, price: 19.99, rating: 4.2, image: "https://m.media-amazon.com/images/I/71UEndHG97L.jpg", title: "COMICA Video Shotgun Microphone" },

    { group: "智能工作室类", category: "Digital Audio Workstation Controllers", type: "上升", brand: "TC Electronic", asin: "B07CGZ34TD", rank: 25, previousRank: 70, change: 45, sales: 5, price: 119, rating: 4.8, image: "https://m.media-amazon.com/images/I/71VK5R3hAxL.jpg", title: "TC Electronic TC2290-DT DAW Controller" },
    { group: "智能工作室类", category: "Digital Audio Workstation Controllers", type: "下降", brand: "FanyiTek", asin: "B0BYMXV5DJ", rank: 61, previousRank: 18, change: -43, sales: 5, price: 28.49, rating: 4.3, image: "https://m.media-amazon.com/images/I/61ww9-3zuiL.jpg", title: "Audio LVDS Controller Board" },
    { group: "智能工作室类", category: "Digital Audio Workstation Controllers", type: "新上榜", brand: "PreSonus", asin: "B07FWF3GR2", rank: 6, previousRank: null, change: null, sales: 46, price: 209.99, rating: 4.5, image: "https://m.media-amazon.com/images/I/619c70EyAlL.jpg", title: "PreSonus FaderPort DAW Controller" },
  ],
  ownProducts: [
    { group: "支架类", category: "Camera Mounts & Clamps", asin: "B09CY8MC2R", rank: 47, previousRank: 83, change: 36, sales: 562, image: "https://m.media-amazon.com/images/I/61juKbqtIIL._AC_SL1500_.jpg", title: "ULANZI ST-06S Universal Phone Tripod Mount" },
    { group: "支架类", category: "Camera Mounts & Clamps", asin: "B0CBS1GXQ8", rank: 60, previousRank: 82, change: 22, sales: 574, image: "https://m.media-amazon.com/images/I/61myY9oJCbL._AC_SL1500_.jpg", title: "ULANZI Magnetic Camera Mount for Action Camera" },
    { group: "灯光类", category: "Continuous Output Lighting", asin: "B0D8335M17", rank: 39, previousRank: 57, change: 18, sales: 345, image: "https://m.media-amazon.com/images/I/615u9XJmwGL.jpg", title: "Ulanzi UA12 Bi-Color LED Inflatable Tube Light" },
    { group: "支架类", category: "Camera Mounts & Clamps", asin: "B0D3DRXLN9", rank: 16, previousRank: 31, change: 15, sales: 1142, image: "https://m.media-amazon.com/images/I/71QmW8M1wUL._AC_SL1500_.jpg", title: "ULANZI CM028 Adjustable Chest Mount Harness" },
    { group: "灯光类", category: "Selfie Lights", asin: "B0GJ5GWVRV", rank: 72, previousRank: 85, change: 13, sales: 272, image: "https://m.media-amazon.com/images/I/61AWsIjLFtL._AC_SL1500_.jpg", title: "ULANZI LM21 Dual Sided Magnetic Selfie Ring Light" },
    { group: "灯光类", category: "Selfie Lights", asin: "B0BXD2ZZZL", rank: 32, previousRank: 44, change: 12, sales: 1886, image: "https://m.media-amazon.com/images/I/61fcoP1e6kL.jpg", title: "Ulanzi VL100X Mini Clip LED Light Panel" },
  ],
};

// Official ULANZI product packshots used only as clean, watermark-free demo imagery.
// Production should return each Taotian listing's own image URL from the collection layer.
const TAOTIAN_CLEAN_IMAGES = [
  "https://www.ulanzi.com/cdn/shop/products/ulanzi-ulanzi-vl49-mini-led-video-light-6972436385980-mobile-photo-video-18904414126232.png?v=1619056157",
  "https://www.ulanzi.com/cdn/shop/files/8_3_11zon.webp?v=1742381859",
  "https://www.ulanzi.com/cdn/shop/files/HuGsrKeE.webp?v=1702979604",
  "https://www.ulanzi.com/cdn/shop/files/L155.webp?v=1786415938",
  "https://www.ulanzi.com/cdn/shop/files/1_1_11zon_8533e214-2cf9-4efb-947d-5e427521d32f.webp?v=1748595738",
  "https://www.ulanzi.com/cdn/shop/files/1_1_11zon_3cf738c5-22dc-4a04-8e14-564578a09f83.webp?v=1732690697",
  "https://www.ulanzi.com/cdn/shop/files/11_51574408-b86d-4883-a95a-e5fcda6259a5.webp?v=1782973971",
  "https://www.ulanzi.com/cdn/shop/products/8_278ad0f8-4a94-4dc1-88c6-19de5aa46813.jpg?v=1679969958",
  "https://www.ulanzi.com/cdn/shop/products/10_ee8e83cc-a65e-4234-8b40-75fddc36e34b-sw.jpg?v=1700797987",
];

const TAOTIAN_CATEGORY_SEEDS = [
  ["灯光类", "闪光灯 > 相机闪光灯", "神牛摄影器材旗舰店", "机顶闪光灯 TTL 高速同步补光灯", 1, 459, 4.8],
  ["灯光类", "影棚设备 > 影室灯", "锐鹰摄影器材店", "专业影室灯直播摄影常亮灯套装", 1, 899, 4.7],
  ["灯光类", "影棚设备 > 外拍灯", "南光旗舰店", "便携外拍灯双色温摄影补光灯", 1, 699, 4.8],
  ["灯光类", "手机直播配件 > 手机直播补光灯", "ULANZI 官方旗舰店", "磁吸手机直播补光灯便携自拍灯", 1, 129, 4.9],
  ["支架与脚架类", "手机支架/手机座", "倍思旗舰店", "桌面折叠手机支架铝合金升降款", 1, 49, 4.8],
  ["支架与脚架类", "手机直播配件 > 直播专用支架", "绿联数码旗舰店", "直播支架落地多机位俯拍补光灯架", 1, 159, 4.7],
  ["支架与脚架类", "手机拍照配件 > 自拍杆/架", "ULANZI 官方旗舰店", "磁吸自拍杆三脚架一体遥控拍摄支架", 1, 199, 4.9],
  ["支架与脚架类", "脚架/云台 > 脚架", "思锐旗舰店", "专业相机三脚架碳纤维便携摄影脚架", 1, 1299, 4.8],
  ["支架与脚架类", "摄像机配件", "SmallRig 斯莫格旗舰店", "相机兔笼拓展套件监视器魔术手支架", 1, 299, 4.8],
];

const TAOTIAN_BASE = {
  meta: { groups: 2, categories: 9, records: 900, images: 54 },
  groups: [
    { name: "灯光类", categories: 4, records: 400, images: 24 },
    { name: "支架与脚架类", categories: 5, records: 500, images: 30 },
  ],
  categories: TAOTIAN_CATEGORY_SEEDS.map((seed, index) => ({
    group: seed[0],
    name: seed[1],
    brand: seed[2],
    shop: seed[2],
    asin: `TT202608${String(index + 1).padStart(2, "0")}`,
    topSales: [3280, 1860, 1420, 5980, 12600, 3760, 6890, 1150, 2480][index],
    price: seed[5],
    rating: seed[6],
    image: TAOTIAN_CLEAN_IMAGES[index],
    title: seed[3],
    rank: seed[4],
    listingDays: [680, 420, 365, 210, 760, 330, 175, 890, 520][index],
  })),
  movements: TAOTIAN_CATEGORY_SEEDS.flatMap((seed, index) => {
    const image = TAOTIAN_CLEAN_IMAGES[index];
    const base = {
      group: seed[0], category: seed[1], brand: seed[2], shop: seed[2],
      price: seed[5], rating: seed[6], image,
    };
    return [
      { ...base, type: "上升", asin: `TTUP${String(index + 1).padStart(7, "0")}`, rank: 8 + index * 3, previousRank: 46 + index * 4, change: 38 + index, sales: 900 + index * 310, listingDays: 190 + index * 27, title: `${seed[3]} · 本周升幅款` },
      { ...base, type: "下降", asin: `TTDN${String(index + 1).padStart(7, "0")}`, rank: 58 + index * 2, previousRank: 18 + index, change: -(40 + index), sales: 620 + index * 180, listingDays: 410 + index * 31, title: `${seed[3]} · 本周回落款` },
      { ...base, type: "新上榜", asin: `TTNEW${String(index + 1).padStart(5, "0")}`, rank: 6 + index * 4, previousRank: null, change: null, sales: 480 + index * 220, listingDays: 18 + index * 6, title: `${seed[3]} · 新上榜款` },
    ];
  }),
  ownProducts: [
    { group: "灯光类", category: "手机直播配件 > 手机直播补光灯", asin: "TTULANZI001", rank: 12, previousRank: 35, change: 23, sales: 2180, price: 129, listingDays: 210, image: TAOTIAN_CLEAN_IMAGES[3], title: "ULANZI 磁吸手机直播补光灯" },
    { group: "支架与脚架类", category: "手机拍照配件 > 自拍杆/架", asin: "TTULANZI002", rank: 9, previousRank: 24, change: 15, sales: 3260, price: 199, listingDays: 175, image: TAOTIAN_CLEAN_IMAGES[6], title: "ULANZI 磁吸自拍杆三脚架" },
    { group: "支架与脚架类", category: "摄像机配件", asin: "TTULANZI003", rank: 28, previousRank: 39, change: 11, sales: 860, price: 269, listingDays: 385, image: TAOTIAN_CLEAN_IMAGES[8], title: "ULANZI 相机拓展魔术手套装" },
  ],
};

window.DASHBOARD_DATA = {
  defaultPlatform: "amazon",
  platforms: {
    amazon: {
      key: "amazon",
      name: "Amazon",
      title: "Amazon BSR 周度市场情报",
      marketplace: "Amazon US",
      currency: "USD",
      idLabel: "ASIN",
      salesLabel: "月销",
      source: "Sorftime API",
      base: AMAZON_BASE,
      weeks: [
        {
          key: "2026-08-12", label: "2026.08.06 — 08.12", previous: "2026-08-05", salesFactor: 1, recordDelta: 0, rankShift: 0,
          highlights: [
            ["总体", "12 个细分类目中，支架类的新上榜与强势上升信号最集中；Top 1 商品月销合计约 27.3 万件。"],
            ["灯光类", "Selfie Lights 头部商品月销 22,491 件；Continuous Output Lighting 出现 +56 位的快速上升款，需跟进价格带与内容场景。"],
            ["支架与脚架", "Cradles 新上榜商品进入第 4 名且月销超过 3.4 万件；Selfie Sticks 中 TONEOF 上升 33 位，增长质量较高。"],
            ["ULANZI", "本品样本中 Camera Mounts & Clamps 表现最强，ST-06S 上升 36 位；建议复盘站内流量词与竞品促销节奏。"],
          ],
        },
        {
          key: "2026-08-05", label: "2026.07.30 — 08.05", previous: "2026-07-29", salesFactor: 0.94, recordDelta: -18, rankShift: 2,
          highlights: [
            ["总体", "本周市场波动收窄，灯光类头部排名相对稳定；脚架类中低价自拍杆竞争加剧。"],
            ["灯光类", "环形灯与便携补光灯仍是销量主力，头部价格带集中在 12—35 美元。"],
            ["支架与脚架", "Grips 细分类目新品牌进入 Top 10，Camera Mounts & Clamps 上升信号增多。"],
            ["ULANZI", "本品共 6 个样本排名上升，最高提升 29 位；灯光新品仍处于流量验证阶段。"],
          ],
        },
        {
          key: "2026-07-29", label: "2026.07.23 — 07.29", previous: "2026-07-22", salesFactor: 0.89, recordDelta: -31, rankShift: 4,
          highlights: [
            ["总体", "六个重点细分类目表现分化：灯光类整体回落，支架类下滑幅度较大，Tripods 逆势增长。"],
            ["灯光类", "Continuous Output Lighting 月销减少约 2,393 件，Selfie Lights 月销减少约 6,182 件；加权均价同步下探。"],
            ["支架类", "Cradles 与 Grips 均明显回落，ULANZI 尚未进入两个类目的 Top 100，需要关注产品形态与价格差距。"],
            ["脚架类", "Tripods 月销增加约 1,523 件；ULANZI 共 18 个 SKU 进入 Top 100，其中 10 个排名上升。"],
          ],
        },
      ],
    },
    taotian: {
      key: "taotian",
      name: "淘天",
      title: "淘天 BSR 周度排名情报",
      marketplace: "淘宝 / 天猫",
      currency: "CNY",
      idLabel: "商品 ID",
      salesLabel: "周销样本",
      source: "淘天榜单数据",
      base: TAOTIAN_BASE,
      weeks: [
        {
          key: "2026-08-10", label: "2026.08.04 — 08.10", previous: "2026-08-03", salesFactor: 1, recordDelta: 0, rankShift: 0,
          highlights: [
            ["总体", "9 个监测类目共覆盖 900 条榜单记录；灯光类新品进入速度较快，支架与脚架类的头部稳定性更高。"],
            ["灯光类", "手机直播补光灯出现高频新上榜，价格集中在 99—199 元；影室灯头部店铺排名保持稳定。"],
            ["支架与脚架", "手机支架与自拍杆的升降幅最明显，低价款排名波动大，专业脚架则以品牌稳定性为主。"],
            ["ULANZI", "本品在手机直播补光灯、自拍杆/架和摄像机配件中均有上升样本，磁吸形态表现更突出。"],
          ],
        },
        {
          key: "2026-08-03", label: "2026.07.28 — 08.03", previous: "2026-07-27", salesFactor: 0.93, recordDelta: -27, rankShift: 2,
          highlights: [
            ["总体", "榜单记录整体稳定，新上榜数量较前一周减少，直播配件类目仍保持较高流动性。"],
            ["灯光类", "外拍灯头部价格带上移，手机直播补光灯中百元内产品竞争加剧。"],
            ["支架与脚架", "直播专用支架的上升商品集中于多机位和俯拍场景，自拍杆头部品牌位置稳固。"],
            ["ULANZI", "自拍杆/架本品进入 Top 10，摄像机配件样本提升 8 位，建议继续观察大促前的价格变化。"],
          ],
        },
        {
          key: "2026-07-27", label: "2026.07.21 — 07.27", previous: "2026-07-20", salesFactor: 0.87, recordDelta: -42, rankShift: 5,
          highlights: [
            ["总体", "灯光类榜单波动大于支架类，新上榜主要集中于手机直播配件，专业摄影设备变化相对有限。"],
            ["灯光类", "相机闪光灯和影室灯头部品牌保持稳定，外拍灯出现多款便携电池新品。"],
            ["支架与脚架", "手机支架低价带竞争明显，专业脚架头部商品变化不大，自拍杆新品更依赖内容种草。"],
            ["ULANZI", "本品在磁吸补光灯与自拍杆两个方向均有上升，但专业脚架类目仍未形成稳定排名。"],
          ],
        },
      ],
    },
  },
};
