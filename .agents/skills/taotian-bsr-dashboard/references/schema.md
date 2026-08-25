# 淘天快照口径

- 周次键：目标表 `business_date`，必须为周一。
- 类目：配置中的二级、三级类目组合；空三级类目的“摄像机配件”兼容源表中空值或与二级类目同名的值。
- 类目头部商品：每个细分类目当周 `search_rank` 最小的一条。
- 新上榜：`ranking_change_value = 9999`。
- 上升：`ranking_change_value > 0`，上周排名 = 本周排名 + 异动值。
- 下降：`ranking_change_value < 0`，上周排名 = 本周排名 + 异动值。
- 异动展示上限：每类目上升 10 条、下降 3 条、新上榜 10 条。
- 本品：店铺名或商品名包含 `ULANZI`、`优篮子`、`ulanzi` 的 Top 100 商品。
- 缺失字段：`price`、`sales`、`topSales`、`rating`、`listingDays`、`listedAt` 输出 `null`。
