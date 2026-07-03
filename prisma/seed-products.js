// prisma/seed-products.js — 生成 200 条商品数据 + 秒杀活动
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** 商品名称模板按分类 */
const PRODUCT_NAMES = {
  1: [ // 家居用品
    "北欧风简约台灯", "记忆棉护颈枕", "智能垃圾桶", "落地衣架", "收纳盒套装",
    "懒人沙发豆袋", "磁吸冰箱置物架", "LED化妆镜", "香薰加湿器", "硅胶揉面垫",
    "不锈钢保温壶", "抽屉分隔板", "防滑地垫", "晾衣架套装", "桌面收纳架",
    "USB插线板固定器", "门后挂钩", "马桶置物架", "毛巾架", "厨房计时器",
    "调料瓶套装", "砧板防霉架", "锅盖支架", "水槽沥水篮", "伸缩杆",
    "窗帘遮光布", "入户地垫", "沙发靠垫", "空调挡风板", "电蚊拍",
    "保温饭盒", "玻璃密封罐", "可折叠购物车", "鞋柜", "床头柜",
    "可折叠脏衣篮", "遥控器收纳盒", "壁挂式鞋架", "床底收纳箱", "按压式垃圾桶",
  ],
  2: [ // 食品饮料
    "云南精品咖啡豆", "混合坚果礼盒", "有机红枣", "武夷山大红袍", "进口黑巧克力",
    "日式抹茶粉", "即食燕窝", "蜂蜜柠檬茶", "牛肉干", "每日坚果包",
    "冻干咖啡", "普洱茶饼", "无糖巧克力", "海盐太妃糖", "芒果干",
    "新疆大枣", "枸杞原浆", "奇亚籽", "燕麦片", "全麦饼干",
    "山核桃仁", "蔓越莓干", "椰子水", "气泡水", "苏打水",
    "橄榄油", "黑醋", "意面套装", "即食咖喱", "速溶汤",
    "坚果能量棒", "冻干银耳羹", "黑芝麻丸", "羽衣甘蓝粉", "即食海苔脆",
  ],
  3: [ // 图书
    "深入理解计算机系统", "设计模式", "算法导论", "人类简史", "未来简史",
    "三体全集", "百年孤独", "活着", "平凡的世界", "追风筝的人",
    "JavaScript高级程序设计", "CSS权威指南", "Node.js实战", "React设计原理", "TypeScript编程",
    "数据库系统概念", "计算机网络", "操作系统概念", "软件工程", "代码整洁之道",
    "重构", "领域驱动设计", "微服务架构", "分布式系统", "Go语言编程",
    "Python编程", "深度学习", "机器学习实战", "数据科学入门", "算法图解",
    "黑客与画家", "程序员修炼之道", "数据结构与算法", "Effective Java", "Unix编程艺术",
  ],
  4: [ // 电子产品
    "无线蓝牙耳机", "智能手表Pro", "机械键盘87键", "便携充电宝", "USB-C扩展坞",
    "4K网络摄像头", "无线鼠标", "降噪耳机", "平板支架", "手机壳",
    "SSD固态硬盘", "移动硬盘", "迷你投影仪", "智能音箱", "路由器",
    "充电头", "数据线", "无线充电器", "鼠标垫", "显示器支架",
    "笔记本电脑包", "屏幕清洁套装", "理线带", "桌面RGB灯带", "电脑增高架",
    "手写板", "USB集线器", "硬盘盒", "笔记本散热架", "耳机收纳盒",
    "桌面小风扇", "LED护眼台灯", "智能体脂秤", "电动牙刷", "冲牙器",
  ],
  5: [ // 运动户外
    "专业跑步鞋", "瑜伽垫6mm", "健身弹力带", "跳绳", "哑铃套装",
    "运动水壶", "速干T恤", "运动短裤", "运动背包", "护膝",
    "登山杖", "野餐垫", "露营帐篷", "睡袋", "户外折叠椅",
    "运动手表", "心率带", "泳镜", "泳帽", "瑜伽球",
    "健腹轮", "引体向上架", "哑铃凳", "筋膜枪", "运动毛巾",
    "护腕护掌", "运动发带", "瑜伽砖", "弹力带套装", "登山鞋",
  ],
  6: [ // 服装
    "经典纯棉T恤", "修身牛仔裤", "轻薄羽绒服", "休闲卫衣", "商务衬衫",
    "羊毛围巾", "棒球帽", "帆布鞋", "休闲皮鞋", "运动袜套装",
    "真丝睡衣", "棉麻衬衫", "针织开衫", "风衣", "皮夹克",
    "阔腿裤", "铅笔裙", "连衣裙", "短裙", "POLO衫",
    "连帽卫衣", "工装裤", "九分裤", "休闲西裤", "帆布包",
  ],
};

const CATEGORY_NAMES = {
  1: "家居用品", 2: "食品饮料", 3: "图书", 4: "电子产品", 5: "运动户外", 6: "服装",
};

async function main() {
  // 清理旧数据（保留原始 16 条）
  const existingCount = await prisma.product.count();
  if (existingCount > 16) {
    await prisma.flashSale.deleteMany({ where: { productId: { gt: 16 } } });
    await prisma.cartItem.deleteMany({ where: { productId: { gt: 16 } } });
    await prisma.orderItem.deleteMany({ where: { productId: { gt: 16 } } });
    await prisma.product.deleteMany({ where: { id: { gt: 16 } } });
    console.log("已清理旧商品数据");
  }

  const products = [];
  let idx = 0;

  for (const [catId, names] of Object.entries(PRODUCT_NAMES)) {
    for (const name of names) {
      idx++;
      const price = randomPrice(Number(catId));
      const stock = randomStock();
      products.push({
        name,
        description: `${CATEGORY_NAMES[catId]} — ${name}，品质保障，值得信赖。`,
        price,
        stock,
        imageUrl: `/uploads/products/product_${16 + idx}.jpg`,
        isPublished: true,
        categoryId: Number(catId),
      });
    }
  }

  // 批量插入
  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`成功插入 ${products.length} 条商品数据`);

  // ===== 创建秒杀活动（前 8 个商品） =====
  const allProducts = await prisma.product.findMany({
    where: { id: { gt: 16 } },
    orderBy: { id: "asc" },
    take: 8,
  });

  const now = new Date();
  for (let i = 0; i < allProducts.length; i++) {
    const prod = allProducts[i];
    const flashPrice = Math.round(prod.price * (0.5 + Math.random() * 0.3) * 100) / 100;
    await prisma.flashSale.create({
      data: {
        productId: prod.id,
        flashPrice,
        flashStock: Math.floor(Math.random() * 50) + 5,
        startTime: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 小时前开始
        endTime: new Date(now.getTime() + 1000 * 60 * 60 * (i + 2)), // 依次 2-9 小时后结束
        isActive: true,
      },
    });
  }
  console.log(`✅ 已创建 ${allProducts.length} 个秒杀活动`);
  await prisma.$disconnect();
}

function randomPrice(catId) {
  const ranges = {
    1: [15, 399],    // 家居
    2: [20, 299],    // 食品
    3: [30, 199],    // 图书
    4: [29, 1999],   // 电子产品
    5: [19, 599],    // 运动户外
    6: [49, 899],    // 服装
  };
  const [min, max] = ranges[catId] || [20, 500];
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomStock() {
  return Math.floor(Math.random() * 500) + 10;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
