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

  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const p = productDefs[i];
    // 部分商品 isPublished: false，模拟下架商品
    const published = !(i === 4 || i === 10 || i === 19); // 少量商品下架
    // 创建时间分布在过去 3 个月
    const createdAt = randomDate(MONTHS_AGO_3, NOW);
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.desc,
        price: p.price,
        stock: p.stock,
        imageUrl: `/uploads/products/product_${i + 1}.jpg`,
        isPublished: published,
        category: { connect: { slug: p.cat } },
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

  // 批量创建 MallUser — 20 个常规用户 + 保留测试用户的 email 不变
  const userDefs = [
    // 保留原来的测试用户（确保现有测试依旧可用）
    { email: "user@example.com", name: "张三", level: 0, spent: 0 },
    { email: "vip1@example.com", name: "李四", level: 1, spent: 8000 },
    { email: "vip2@example.com", name: "王五", level: 2, spent: 80000 },
    { email: "vip3@example.com", name: "赵六", level: 3, spent: 800000 },
    // 新增随机用户
    { email: "alice@example.com", name: "陈小美", level: 0, spent: 0 },
    { email: "bob@example.com", name: "刘大力", level: 0, spent: 0 },
    { email: "carol@example.com", name: "周雨晴", level: 1, spent: 12000 },
    { email: "dave@example.com", name: "吴明远", level: 0, spent: 3500 },
    { email: "eve@example.com", name: "林小婉", level: 2, spent: 95000 },
    { email: "frank@example.com", name: "黄大鹏", level: 0, spent: 600 },
    { email: "grace@example.com", name: "杨小洁", level: 1, spent: 15000 },
    { email: "henry@example.com", name: "郑伟强", level: 0, spent: 3200 },
    { email: "iris@example.com", name: "唐雪儿", level: 1, spent: 9500 },
    { email: "jack@example.com", name: "孙浩然", level: 0, spent: 800 },
    { email: "kate@example.com", name: "冯美琪", level: 3, spent: 900000 },
    { email: "leo@example.com", name: "宋佳明", level: 0, spent: 1800 },
    { email: "maya@example.com", name: "秦思思", level: 1, spent: 22000 },
    { email: "nick@example.com", name: "顾一凡", level: 0, spent: 4200 },
    { email: "olivia@example.com", name: "沈白露", level: 2, spent: 120000 },
    { email: "paul@example.com", name: "常远", level: 0, spent: 0 },
  ];

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

  // 为部分商品创建秒杀活动
  const flashSaleProducts = [
    // 选取一些热门商品
    products.find((p) => p.name.includes("蓝牙耳机")),
    products.find((p) => p.name.includes("充电宝")),
    products.find((p) => p.name.includes("保温杯")),
    products.find((p) => p.name.includes("纯棉T恤")),
    products.find((p) => p.name.includes("坚果礼盒")),
    products.find((p) => p.name.includes("瑜伽垫")),
    products.find((p) => p.name.includes("洗面奶")),
    products.find((p) => p.name.includes("积木")),
  ].filter(Boolean);

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
          endTime: isActive ? endDate : randomDate(MONTHS_AGO_3, NOW),
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
