// @ts-check
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/** 生成 [start, end) 范围内的随机整数 */
function randInt(start, end) {
  return Math.floor(Math.random() * (end - start)) + start;
}

/** 从数组中随机取一项 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 在指定日期范围内生成一个随机日期
 * @param {Date} start
 * @param {Date} end
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/** 从列表随机取 N 项（不重复） */
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const BRAND_NAMES = ["优品", "极客", "北欧时光", "自然之选", "悦享", "智造", "简约派", "轻奢", "田园风", "酷玩", "华为", "小米", "索尼", "松下", "飞利浦", "耐克", "阿迪达斯", "无印良品", "网易严选", "京东京造"];
const SUBTITLES = [
  "品质生活，从这一件开始",
  "热卖爆款，口碑之选",
  "限时特惠，不容错过",
  "全新升级，体验升级",
  "经典设计，历久弥新",
  "匠心工艺，细节见真章",
  "热销爆款，万人好评",
  "轻奢品质，亲民价格",
  "潮流之选，彰显品味",
  "舒适体验，从此刻开始",
  "精致生活，触手可及",
  "品质保证，放心之选",
  "人气推荐，大家都在买",
  "极致性价比，品质不打折",
];
const TAGS_OPTIONS = ["新品", "热销", "限定", "推荐", "特惠", "清仓", "爆款", "甄选", "人气", "独家"];
const ORIGINS = ["广东深圳", "广东广州", "浙江杭州", "浙江义乌", "江苏苏州", "江苏南京", "北京", "上海", "福建厦门", "山东青岛", "四川成都", "湖北武汉", "安徽合肥", "湖南长沙", "河南郑州"];
const SPECS_TEMPLATES = {
  clothing: [
    { key: "面料", options: ["100%纯棉", "95%棉+5%氨纶", "聚酯纤维", "混纺面料", "真丝", "亚麻"] },
    { key: "尺码", options: ["S/M/L/XL", "M/L/XL/XXL", "均码", "160/84A", "165/88A", "170/92A"] },
    { key: "颜色", options: ["黑色/白色/灰色", "多色可选", "经典三色", "深色系", "浅色系"] },
    { key: "季节", options: ["四季通用", "春夏", "秋冬", "夏季", "冬季"] },
    { key: "适用人群", options: ["男女通用", "男士", "女士"] },
  ],
  electronics: [
    { key: "型号", options: ["Pro版", "标准版", "Max版", "Lite版", "2026款"] },
    { key: "材质", options: ["铝合金", "ABS塑料", "不锈钢", "航空铝", "PC+ABS"] },
    { key: "颜色", options: ["深空灰", "银色", "黑色", "白色", "蓝色"] },
    { key: "保修", options: ["一年质保", "两年质保"] },
    { key: "接口", options: ["Type-C", "USB-A", "Lightning", "无线", "蓝牙5.3"] },
  ],
  home: [
    { key: "材质", options: ["环保PP", "不锈钢", "陶瓷", "玻璃", "实木", "竹制", "硅胶"] },
    { key: "尺寸", options: ["标准款", "大号", "小号", "30×20cm", "40×30cm", "20×15cm"] },
    { key: "颜色", options: ["白色", "米色", "灰色", "北欧蓝", "莫兰迪色", "原木色"] },
    { key: "适用场景", options: ["居家", "办公", "户外", "厨房", "浴室"] },
  ],
  food: [
    { key: "净含量", options: ["250g", "500g", "1kg", "200g", "100g", "50g×20"] },
    { key: "保质期", options: ["12个月", "18个月", "24个月", "6个月"] },
    { key: "产地", options: ["国产", "进口", "云南", "福建", "浙江"] },
    { key: "储存方式", options: ["阴凉干燥处", "冷藏保存", "常温保存"] },
  ],
  books: [
    { key: "出版社", options: ["人民邮电出版社", "机械工业出版社", "中信出版社", "商务印书馆", "清华大学出版社", "电子工业出版社"] },
    { key: "开本", options: ["16开", "32开"] },
    { key: "页数", options: ["200页", "300页", "400页", "500页", "600页"] },
  ],
  sports: [
    { key: "材质", options: ["TPE", "NBR", "橡胶", "涤纶", "锦纶", "环保材料"] },
    { key: "重量", options: ["0.5kg", "1kg", "2kg", "0.3kg", "轻量设计"] },
    { key: "颜色", options: ["黑色", "蓝色", "灰色", "红色", "绿色"] },
    { key: "适用场景", options: ["跑步", "瑜伽", "健身", "户外", "综合训练"] },
  ],
  beauty: [
    { key: "规格", options: ["30ml", "50ml", "100ml", "120g", "150ml", "200ml"] },
    { key: "适合肤质", options: ["所有肤质", "干性", "油性", "混合型", "敏感肌"] },
    { key: "保质期", options: ["2年", "3年"] },
    { key: "产地", options: ["国产", "日本", "韩国", "法国", "美国"] },
  ],
  baby: [
    { key: "适用年龄", options: ["0-3个月", "3-6个月", "6-12个月", "1-3岁", "3-6岁"] },
    { key: "材质", options: ["食品级硅胶", "环保ABS", "纯棉", "抗菌面料", "天然竹纤维"] },
    { key: "安全标准", options: ["国家3C认证", "CE认证"] },
    { key: "颜色", options: ["粉色", "蓝色", "米色", "彩色", "绿色"] },
  ],
};

/** 生成某分类的随机规格参数 */
function generateSpecs(catSlug) {
  const templates = [...(SPECS_TEMPLATES[catSlug] || SPECS_TEMPLATES.home)];
  const count = randInt(2, Math.min(5, templates.length));
  const picked = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let t;
    do { t = pick(templates); } while (used.has(t.key));
    used.add(t.key);
    picked.push({ key: t.key, value: pick(t.options) });
  }
  return picked;
}

/** 生成随机图片列表（从已有商品图片中选取，保证本地路径存在） */
function generateImages(index, count) {
  // 主图固定为当前商品图片
  const urls = [`/uploads/products/product_${index + 1}.jpg`];
  // 额外图片从其他商品图片中随机选
  for (let i = 1; i < count; i++) {
    const otherIdx = randInt(1, 235);
    urls.push(`/uploads/products/product_${otherIdx}.jpg`);
  }
  return urls;
}

/** 从数组随机取 0~N 项 */
function pickRandom(arr, max) {
  const n = randInt(0, Math.min(max, arr.length));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ==================== 商品名称生成工厂 ====================
const BRANDS = ["优品", "极客", "北欧时光", "自然之选", "悦享", "智造", "简约派", "轻奢", "田园风", "酷玩"];
const ADJECTIVES = {
  clothing: ["纯棉", "弹力", "修身", "宽松", "复古", "简约", "时尚", "轻薄", "加厚", "印花", "拼接", "条纹"],
  electronics: ["智能", "便携", "高速", "超清", "降噪", "无线", "迷你", "大容量", "长续航", "快充", "高清", "多功能"],
  home: ["北欧风", "简约", "环保", "创意", "静音", "大容量", "防滑", "可折叠", "保温", "收纳", "智能", "节能"],
  food: ["有机", "精选", "纯天然", "进口", "手工", "零添加", "低糖", "高蛋白", "原味", "特级", "新鲜", "古法"],
  books: ["畅销", "经典", "图解", "入门", "进阶", "精装", "珍藏版", "全新修订", "实用", "权威", "趣味", "深度"],
  sports: ["专业", "防滑", "轻量", "透气", "耐用", "可折叠", "多功能", "减震", "稳定", "速干", "高弹", "耐磨"],
  beauty: ["温和", "补水", "修护", "紧致", "清爽", "滋养", "亮肤", "保湿", "控油", "舒缓", "淡斑", "抗皱"],
  baby: ["安全", "环保", "柔软", "益智", "启蒙", "防摔", "可啃咬", "易清洗", "轻便", "多功能", "早教", "可爱"],
};
const NOUNS = {
  clothing: ["T恤", "衬衫", "外套", "裤子", "裙子", "卫衣", "夹克", "风衣", "短裤", "马甲", "针织衫", "运动套装"],
  electronics: ["耳机", "充电器", "数据线", "蓝牙音箱", "移动电源", "鼠标", "键盘", "摄像头", "支架", "保护壳", "转换器", "硬盘盒"],
  home: ["抱枕", "地毯", "收纳盒", "置物架", "牙刷架", "毛巾", "浴巾", "桌布", "花瓶", "相框", "香薰", "靠垫"],
  food: ["咖啡", "茶叶", "坚果", "果干", "麦片", "蜂蜜", "巧克力", "饼干", "薯片", "牛肉干", "酸奶", "果酱"],
  books: ["入门指南", "实战教程", "思维导图", "案例集", "原理剖析", "算法详解", "架构设计", "编程之道"],
  sports: ["护腕", "运动毛巾", "跳绳", "弹力带", "护膝", "髌骨带", "运动水壶", "腕带", "握力器", "臂包", "发带", "运动袜"],
  beauty: ["面膜", "精华液", "面霜", "爽肤水", "眼霜", "唇膏", "卸妆水", "身体乳", "洗发水", "护发素", "沐浴露", "磨砂膏"],
  baby: ["奶瓶", "围兜", "婴儿帽", "睡袋", "安抚巾", "咬咬胶", "布书", "摇铃", "婴儿袜", "隔尿垫", "吸管杯", "辅食碗"],
};

/** 格式化日期为 YYYY-MM-DD HH:mm:ss 字符串 */
function fmtDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ==================== 数据范围 ====================
const MONTHS_AGO_6 = new Date("2026-01-01T00:00:00+08:00");
const MONTHS_AGO_3 = new Date("2026-04-01T00:00:00+08:00");
const NOW = new Date("2026-07-04T12:00:00+08:00");

async function main() {
  console.log("🌱 开始填充模拟数据...\n");

  // ==================== 1. 分类 ====================
  console.log("━━━ 1. 分类 ━━━");
  const categoryDefs = [
    { name: "服装", slug: "clothing" },
    { name: "电子产品", slug: "electronics" },
    { name: "家居用品", slug: "home" },
    { name: "食品饮料", slug: "food" },
    { name: "图书", slug: "books" },
    { name: "运动户外", slug: "sports" },
    { name: "美妆个护", slug: "beauty" },
    { name: "母婴玩具", slug: "baby" },
  ];

  const categories = {};
  for (const c of categoryDefs) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }
  console.log(`  ✅ ${Object.keys(categories).length} 个分类`);

  // ==================== 2. 商品 ====================
  console.log("\n━━━ 2. 商品 ━━━");
  const productDefs = [
    // 服装 (clothing)
    { name: "经典纯棉T恤", desc: "100% 纯棉面料，舒适透气，经典百搭款式", price: 99, stock: 200, cat: "clothing" },
    { name: "修身牛仔裤", desc: "弹力牛仔面料，修身剪裁，日常百搭", price: 259, stock: 150, cat: "clothing" },
    { name: "轻薄羽绒服", desc: "90% 白鹅绒填充，防风防泼水，轻便保暖", price: 599, stock: 80, cat: "clothing" },
    { name: "真丝连衣裙", desc: "100% 桑蚕丝，优雅法式风格，夏季新款", price: 499, stock: 60, cat: "clothing" },
    { name: "休闲卫衣", desc: "加绒内里，抽绳连帽设计，男女同款", price: 189, stock: 180, cat: "clothing" },
    // 电子产品 (electronics)
    { name: "无线蓝牙耳机", desc: "主动降噪，30小时续航，IPX5防水", price: 399, stock: 300, cat: "electronics" },
    { name: "智能手表 Pro", desc: "1.5英寸AMOLED屏幕，心率血氧监测，GPS运动追踪", price: 1299, stock: 100, cat: "electronics" },
    { name: "便携充电宝 20000mAh", desc: "双向快充，支持PD/QC协议，可上飞机", price: 149, stock: 500, cat: "electronics" },
    { name: "机械键盘 87键", desc: "青轴机械开关，RGB背光，铝合金面板", price: 299, stock: 200, cat: "electronics" },
    { name: "Type-C 扩展坞", desc: "7合1多功能，4K HDMI输出，USB3.0高速传输", price: 169, stock: 150, cat: "electronics" },
    { name: "4K 网络摄像头", desc: "自动对焦，内置降噪麦克风，即插即用", price: 329, stock: 90, cat: "electronics" },
    // 家居用品 (home)
    { name: "记忆棉护颈枕", desc: "慢回弹记忆棉，人体工学曲线，透气枕套可拆卸", price: 129, stock: 300, cat: "home" },
    { name: "北欧风台灯", desc: "三档调光，LED护眼，简约设计", price: 89, stock: 250, cat: "home" },
    { name: "真空保温杯 500ml", desc: "316不锈钢内胆，12小时保温，食品级硅胶密封", price: 79, stock: 400, cat: "home" },
    { name: "智能体脂秤", desc: "蓝牙连接，24项身体数据，全家共用", price: 99, stock: 200, cat: "home" },
    { name: "香薰加湿器", desc: "超声波静音，大容量500ml，氛围灯", price: 119, stock: 180, cat: "home" },
    // 食品饮料 (food)
    { name: "云南精品咖啡豆 250g", desc: "阿拉比卡单品，中深烘焙，口感醇厚", price: 68, stock: 500, cat: "food" },
    { name: "混合坚果礼盒 1kg", desc: "腰果杏仁核桃混合装，每日坚果，独立包装", price: 128, stock: 200, cat: "food" },
    { name: "冻干即溶咖啡 20条", desc: "冷热双泡，精选巴西/哥伦比亚豆", price: 45, stock: 350, cat: "food" },
    { name: "有机茉莉花茶 100g", desc: "广西横县茉莉，七窨工艺，花香馥郁", price: 58, stock: 150, cat: "food" },
    // 图书 (books)
    { name: "《深入理解计算机系统》", desc: "计算机科学经典教材，从程序员视角理解计算机系统", price: 79, stock: 300, cat: "books" },
    { name: "《设计模式：可复用面向对象软件的基础》", desc: "GoF 经典设计模式，软件工程师必读", price: 45, stock: 400, cat: "books" },
    { name: "《人类简史》", desc: "尤瓦尔·赫拉利全球畅销之作，从动物到上帝的宏大叙事", price: 36, stock: 200, cat: "books" },
    { name: "《小王子》（精装插图版）", desc: "圣埃克苏佩里经典，治愈系哲理童话", price: 29, stock: 250, cat: "books" },
    { name: "《Python从入门到实践》", desc: "零基础学Python，项目实战驱动，附代码下载", price: 59, stock: 180, cat: "books" },
    // 运动户外 (sports)
    { name: "瑜伽垫 6mm", desc: "TPE环保材质，双面防滑，附带收纳绑带", price: 69, stock: 350, cat: "sports" },
    { name: "专业跑步鞋", desc: "缓震回弹中底，透气飞织鞋面，防滑橡胶大底", price: 369, stock: 120, cat: "sports" },
    { name: "户外双肩包 30L", desc: "防泼水耐磨，多隔层收纳，减压背负系统", price: 199, stock: 100, cat: "sports" },
    { name: "可调节哑铃 20kg", desc: "快速调节重量，哑铃杠铃二合一，家用健身", price: 299, stock: 70, cat: "sports" },
    // 美妆个护 (beauty)
    { name: "氨基酸洗面奶 120g", desc: "温和不紧绷，氨基酸表活，适合所有肤质", price: 59, stock: 300, cat: "beauty" },
    { name: "防晒霜 SPF50+", desc: "清爽不油腻，PA++++，防水防汗", price: 89, stock: 250, cat: "beauty" },
    { name: "玻尿酸精华液 30ml", desc: "三重玻尿酸，深层补水，修护屏障", price: 139, stock: 150, cat: "beauty" },
    // 母婴玩具 (baby)
    { name: "婴儿手推车", desc: "轻便折叠，单手收车，可坐可躺", price: 699, stock: 40, cat: "baby" },
    { name: "儿童益智积木 100粒", desc: "大颗粒安全材质，认知形状颜色，启蒙教育", price: 79, stock: 200, cat: "baby" },
  ];

  // 用商品名称工厂生成剩余商品（35~234，对应 product_35.jpg ~ product_234.jpg）
  const CATEGORY_SLUGS = ["clothing", "electronics", "home", "food", "books", "sports", "beauty", "baby"];
  const priceRange = {
    clothing: [49, 699], electronics: [19, 1599], home: [19, 399],
    food: [9, 199], books: [15, 99], sports: [29, 499],
    beauty: [19, 299], baby: [19, 899],
  };
  const DESC_TEMPLATES = [
    (n, adj) => `优质${adj}材料，精湛工艺，${n}首选`,
    (n, adj) => `${adj}设计，${n}中的经典之选，品质保证`,
    (n, adj) => `${adj}款式，舒适实用，${n}必备良品`,
    (n, adj) => `${adj}体验，超高性价比，${n}热卖爆款`,
    (n, adj) => `${adj}材质，${n}好物，口碑推荐`,
    (n, adj) => `${adj}全新升级，${n}爆款回归，限时特惠`,
    (n, adj) => `甄选${adj}原料，${n}精品，品质生活从这里开始`,
    (n, adj) => `${adj}力作，${n}新选择，满足你的所有期待`,
  ];

  const counts = {};
  for (const c of CATEGORY_SLUGS) counts[c] = 0;
  for (const p of productDefs) counts[p.cat]++;

  const usedNames = new Set(productDefs.map((p) => p.name));
  const totalNeeded = 234 - productDefs.length; // 200
  const generatedDefs = [];
  let attempts = 0;

  while (generatedDefs.length < totalNeeded && attempts < 5000) {
    attempts++;
    const cat = CATEGORY_SLUGS.sort((a, b) => counts[a] - counts[b])[0];
    const adj = pick(ADJECTIVES[cat]);
    const noun = pick(NOUNS[cat]);
    const brand = pick(BRANDS);
    const name = `${brand}${adj}${noun}`;

    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const [minP, maxP] = priceRange[cat];
    const price = Math.round((minP + Math.random() * (maxP - minP)) / 5) * 5;
    const stock = randInt(20, 500);
    const desc = pick(DESC_TEMPLATES)(noun, adj);

    counts[cat]++;
    generatedDefs.push({ name, desc, price, stock, cat });
  }

  productDefs.push(...generatedDefs);

  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const p = productDefs[i];
    // 少量商品下架（前 34 个中的 3 个 + 随机 5% 生成商品）
    const published = i < 34
      ? !(i === 4 || i === 10 || i === 19)
      : Math.random() > 0.05;
    // 创建时间分布在过去 6 个月（编号越早的商品创建时间越早）
    const createdAt = new Date(MONTHS_AGO_6.getTime() + (i / productDefs.length) * (NOW.getTime() - MONTHS_AGO_6.getTime()) + (Math.random() - 0.5) * 7 * 86400000);
    // 新字段数据
    const brand = pick(BRAND_NAMES);
    const subtitle = pick(SUBTITLES);
    const images = JSON.stringify(generateImages(i, randInt(1, 4)));
    const specs = JSON.stringify(generateSpecs(p.cat));
    const tags = JSON.stringify(pickRandom(TAGS_OPTIONS, 3));
    const videoUrl = ""; // 暂无本地视频文件
    const origin = pick(ORIGINS);
    const weight = Math.random() < 0.7 ? parseFloat((0.1 + Math.random() * 9.9).toFixed(2)) : null;

    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.desc,
        price: p.price,
        stock: p.stock,
        imageUrl: `/uploads/products/product_${i + 1}.jpg`,
        isPublished: published,
        category: { connect: { slug: p.cat } },
        brand,
        subtitle,
        images,
        specs,
        tags,
        videoUrl,
        origin,
        weight,
        createdAt,
        updatedAt: randomDate(createdAt, NOW),
      },
    });
    products.push(product);
  }
  console.log(`  ✅ ${products.length} 件商品`);

  // ==================== 3. 用户 ====================
  console.log("\n━━━ 3. 用户 ━━━");
  const pwHash = await bcrypt.hash("user123", 10);

  // 预定义管理员
  const adminPwHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "管理员", password: adminPwHash },
  });
  console.log(`  ✅ 管理员: admin@example.com`);

  // 批量创建 MallUser — 60 个用户（保留测试用户的 email 不变）
  const SURNAMES = ["张", "李", "王", "赵", "陈", "刘", "杨", "黄", "吴", "周", "郑", "孙", "冯", "唐", "宋", "林", "沈", "秦", "顾", "许", "何", "郭", "高", "罗", "梁", "谢", "韩", "苏", "叶", "魏"];
  const GIVEN_NAMES = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞", "平", "刚", "桂英", "文", "华", "飞", "玉兰", "斌", "玲", "国强"];

  const userDefs = [
    // 保留原来的测试用户（确保现有测试依旧可用）
    { email: "user@example.com", name: "张三", level: 0, spent: 0 },
    { email: "vip1@example.com", name: "李四", level: 1, spent: 8000 },
    { email: "vip2@example.com", name: "王五", level: 2, spent: 80000 },
    { email: "vip3@example.com", name: "赵六", level: 3, spent: 800000 },
  ];

  // 生成 56 个额外用户（共 60 个）
  const existingEmails = new Set(userDefs.map((u) => u.email));
  for (let i = 0; userDefs.length < 60; i++) {
    const surname = pick(SURNAMES);
    const given = pick(GIVEN_NAMES);
    const name = surname + given;
    const email = `user${100 + i}@example.com`;
    if (existingEmails.has(email)) continue;
    existingEmails.add(email);

    // 随机分配等级（0: 60%, 1: 20%, 2: 12%, 3: 8%）
    const r = Math.random();
    const level = r < 0.6 ? 0 : r < 0.8 ? 1 : r < 0.92 ? 2 : 3;
    const spentThresholds = [0, 8000, 80000, 800000];
    const spent = level === 0
      ? randInt(0, 7000)
      : randInt(spentThresholds[level], spentThresholds[level] * 3);
    userDefs.push({ email, name, level, spent });
  }

  const users = [];
  for (const u of userDefs) {
    const regDate = randomDate(MONTHS_AGO_6, NOW);
    const user = await prisma.mallUser.upsert({
      where: { email: u.email },
      update: { name: u.name, membershipLevel: u.level, totalSpent: u.spent },
      create: {
        email: u.email,
        name: u.name,
        password: pwHash,
        membershipLevel: u.level,
        totalSpent: u.spent,
        createdAt: regDate,
        updatedAt: randomDate(regDate, NOW),
      },
    });
    users.push(user);
  }
  console.log(`  ✅ ${users.length} 个商城用户`);

  // ==================== 4. 收货地址 ====================
  console.log("\n━━━ 4. 收货地址 ━━━");

  const regions = [
    { province: "北京市", city: "北京市", districts: ["朝阳区", "海淀区", "西城区", "东城区", "丰台区"] },
    { province: "上海市", city: "上海市", districts: ["浦东新区", "黄浦区", "徐汇区", "静安区", "长宁区"] },
    { province: "广东省", city: "广州市", districts: ["天河区", "越秀区", "海珠区", "番禺区", "白云区"] },
    { province: "广东省", city: "深圳市", districts: ["南山区", "福田区", "宝安区", "龙岗区", "罗湖区"] },
    { province: "浙江省", city: "杭州市", districts: ["西湖区", "上城区", "滨江区", "余杭区", "拱墅区"] },
    { province: "江苏省", city: "南京市", districts: ["鼓楼区", "玄武区", "秦淮区", "建邺区", "栖霞区"] },
    { province: "四川省", city: "成都市", districts: ["武侯区", "锦江区", "青羊区", "金牛区", "高新区"] },
    { province: "湖北省", city: "武汉市", districts: ["武昌区", "洪山区", "江汉区", "硚口区", "汉阳区"] },
  ];

  const streetNames = [
    "科技园路", "软件大道", "创新路", "创业大道", "金融街",
    "中山路", "人民路", "建设路", "解放路", "滨江路",
  ];

  let addressCount = 0;
  for (const user of users) {
    const region = pick(regions);
    const district = pick(region.districts);
    const street = pick(streetNames);
    const buildingNum = randInt(1, 500);
    const floor = randInt(3, 35);
    const room = randInt(1, 30);

    // 默认地址
    await prisma.address.create({
      data: {
        userId: user.id,
        name: user.name,
        phone: `138${String(randInt(10000000, 99999999)).padStart(8, "0")}`,
        province: region.province,
        city: region.city,
        district,
        detail: `${street}${buildingNum}号XX大厦${floor}层${room}室`,
        isDefault: true,
        createdAt: randomDate(MONTHS_AGO_6, NOW),
      },
    });
    addressCount++;

    // 部分用户有第二个地址（公司或老家）
    if (Math.random() < 0.4) {
      const region2 = pick(regions.filter((r) => r.province !== region.province || r.city !== region.city));
      const district2 = pick(region2.districts);
      const street2 = pick(streetNames);
      const num2 = randInt(1, 300);
      await prisma.address.create({
        data: {
          userId: user.id,
          name: user.name,
          phone: `138${String(randInt(10000000, 99999999)).padStart(8, "0")}`,
          province: region2.province,
          city: region2.city,
          district: district2,
          detail: `${street2}${num2}号`,
          isDefault: false,
          createdAt: randomDate(MONTHS_AGO_6, NOW),
        },
      });
      addressCount++;
    }
  }
  console.log(`  ✅ ${addressCount} 个收货地址`);

  // ==================== 5. 订单 ====================
  console.log("\n━━━ 5. 订单 ━━━");

  const statuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

  /**
   * 为指定用户生成历史订单
   * 不同等级用户订单数量和金额不同
   */
  let orderCount = 0;
  let orderItemCount = 0;

  for (const user of users) {
    // 根据等级决定订单数量：等级越高/消费越多 → 订单越多
    let numOrders;
    if (user.totalSpent >= 800000) numOrders = randInt(25, 40);
    else if (user.totalSpent >= 80000) numOrders = randInt(15, 25);
    else if (user.totalSpent >= 8000) numOrders = randInt(8, 15);
    else if (user.totalSpent > 0) numOrders = randInt(3, 8);
    else numOrders = randInt(0, 4);

    // 获取该用户的地址
    const addresses = await prisma.address.findMany({ where: { userId: user.id } });
    if (addresses.length === 0) continue;

    // 等级对应的折扣率
    const discountRates = [1.0, 0.98, 0.95, 0.90];
    const rate = discountRates[user.membershipLevel] ?? 1.0;

    for (let o = 0; o < numOrders; o++) {
      const addr = pick(addresses);
      // 每个订单 1-5 件商品
      const itemCount = randInt(1, Math.min(5, products.length));

      // 随机选商品（不重复）
      const pickedProducts = [];
      const usedIndices = new Set();
      for (let i = 0; i < itemCount; i++) {
        let idx;
        do { idx = randInt(0, products.length); } while (usedIndices.has(idx));
        usedIndices.add(idx);
        const p = products[idx];
        const qty = randInt(1, 4);
        pickedProducts.push({ productId: p.id, quantity: qty, price: p.price });
      }

      const originalAmount = pickedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalAmount = Math.round(originalAmount * rate * 100) / 100;

      // 订单状态分布：大部分已完成，少量已发货/已支付/取消
      let status;
      const r = Math.random();
      if (user.membershipLevel >= 2 && r < 0.1) {
        status = pick(["PAID", "SHIPPED"]);
      } else if (r < 0.08) {
        status = "CANCELLED";
      } else {
        status = "COMPLETED";
      }

      // 订单创建时间：分散在过去 6 个月
      const orderDate = randomDate(MONTHS_AGO_6, NOW);
      // 状态更新时间在订单创建之后
      const updatedAt = randomDate(orderDate, NOW);

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status,
          originalAmount,
          discountRate: rate,
          totalAmount,
          address: `${addr.province}${addr.city}${addr.district} ${addr.detail}`,
          phone: addr.phone,
          note: Math.random() < 0.15 ? "请放在快递柜" : "",
          createdAt: orderDate,
          updatedAt,
          items: {
            create: pickedProducts.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // 如果订单是 COMPLETED，增加一些销量（OrderItem 的 quantity 累加到 Product 的 sold 上）
      // 但 Product 没有 sold 字段，所以不需要更新

      orderCount++;
      orderItemCount += pickedProducts.length;
    }
  }
  console.log(`  ✅ ${orderCount} 个订单（${orderItemCount} 条订单项）`);

  // ==================== 6. 秒杀活动 ====================
  console.log("\n━━━ 6. 秒杀活动 ━━━");

  // 为约 20% 的商品创建秒杀活动
  const numFlashProducts = Math.round(products.length * 0.2);
  const flashSaleProducts = pickN(products, numFlashProducts);

  let flashSaleCount = 0;

  for (const product of flashSaleProducts) {
    // 每个商品有 1-2 个秒杀活动
    const numSales = randInt(1, 2);
    for (let s = 0; s < numSales; s++) {
      const startDate = randomDate(MONTHS_AGO_6, NOW);
      const endDate = new Date(startDate.getTime() + randInt(2, 48) * 60 * 60 * 1000); // 持续 2-48 小时
      const isActive = endDate > NOW;

      await prisma.flashSale.create({
        data: {
          productId: product.id,
          flashPrice: Math.round(product.price * (0.5 + Math.random() * 0.3) * 100) / 100, // 5-8 折
          flashStock: randInt(10, 100),
          startTime: startDate,
          endTime: endDate,
          isActive,
          createdAt: randomDate(MONTHS_AGO_6, NOW),
        },
      });
      flashSaleCount++;
    }
  }
  console.log(`  ✅ ${flashSaleCount} 个秒杀活动`);

  // ==================== 7. 购物车 ====================
  console.log("\n━━━ 7. 购物车 ━━━");

  let cartCount = 0;
  for (const user of users) {
    // 约 40% 用户的购物车非空
    if (Math.random() < 0.6) continue;

    const numItems = randInt(1, 4);
    const usedPids = new Set();
    for (let i = 0; i < numItems; i++) {
      let product;
      do { product = pick(products); } while (usedPids.has(product.id));
      usedPids.add(product.id);

      // 确保购物车同一用户同一商品只保留一条（@@unique）
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: user.id, productId: product.id } },
      });
      if (!existing) {
        await prisma.cartItem.create({
          data: {
            userId: user.id,
            productId: product.id,
            quantity: randInt(1, 3),
            createdAt: randomDate(MONTHS_AGO_3, NOW),
          },
        });
        cartCount++;
      }
    }
  }
  console.log(`  ✅ ${cartCount} 条购物车记录`);

  // ==================== 完成 ====================
  console.log("\n" + "=".repeat(40));
  console.log("🎉 模拟数据填充完毕！");
  console.log(`  分类 ${Object.keys(categories).length} | 商品 ${products.length} | 用户 ${users.length}`);
  console.log(`  地址 ${addressCount} | 订单 ${orderCount} | 订单项 ${orderItemCount}`);
  console.log(`  秒杀 ${flashSaleCount} | 购物车 ${cartCount}`);
  console.log("=".repeat(40));
}

main()
  .catch((e) => {
    console.error("❌ 填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
