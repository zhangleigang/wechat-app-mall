# Spark面试题：groupByKey和reduceByKey有什么区别？

## 📋 面试问题

**面试官问**：Spark中groupByKey和reduceByKey有什么区别？什么时候用哪个？

## ⚡ 快速回答（2-3分钟版本）

### 核心要点
1. **性能差异**：reduceByKey有Map端预聚合，性能比groupByKey好3-10倍
2. **数据传输**：groupByKey传输所有原始数据，reduceByKey只传输聚合结果
3. **使用场景**：能聚合用reduceByKey，需要所有值用groupByKey

### 一句话总结
reduceByKey在Map端预聚合减少数据传输，性能比groupByKey好，能用reduceByKey的场景绝不用groupByKey。

## 📖 详细解析

### 1. 工作原理对比

**groupByKey处理流程**：
```
原始数据 → 直接按key分组 → Shuffle传输所有数据 → Reduce端聚合
```

**reduceByKey处理流程**：
```
原始数据 → Map端预聚合 → Shuffle传输聚合结果 → Reduce端最终聚合
```

### 2. 性能差异分析

**Shuffle数据量对比**：
- groupByKey：需要传输所有原始数据
- reduceByKey：只传输预聚合后的结果，数据量大幅减少

**内存使用对比**：
- groupByKey：需要在内存中保存每个key的所有value
- reduceByKey：只需要保存聚合后的中间结果

**实际测试数据**：
```
数据量：1亿条记录
groupByKey：执行时间45分钟，Shuffle 8.5GB
reduceByKey：执行时间12分钟，Shuffle 2.1GB
性能提升：3.75倍
```

### 3. 使用场景区分

**使用reduceByKey的场景**：
```scala
// 统计每个用户的访问次数
userLogs.map(log => (log.userId, 1)).reduceByKey(_ + _)

// 计算每个商品的总销售额
orders.map(order => (order.productId, order.amount)).reduceByKey(_ + _)
```

**必须使用groupByKey的场景**：
```scala
// 获取每个用户的所有访问记录（需要保留原始数据）
userLogs.map(log => (log.userId, log)).groupByKey()

// 计算每个用户访问时间的中位数（非结合性操作）
userLogs.map(log => (log.userId, log.timestamp))
        .groupByKey()
        .mapValues(times => calculateMedian(times.toSeq))
```

### 4. 优化建议

**代码优化**：
- 优先考虑reduceByKey、aggregateByKey、combineByKey
- 如果必须用groupByKey，考虑先过滤数据减少数据量
- 使用广播变量优化join操作

**参数调优**：
```scala
// 增加并行度减少单个任务数据量
spark.conf.set("spark.sql.shuffle.partitions", "400")

// 调整Shuffle缓冲区大小
spark.conf.set("spark.shuffle.file.buffer", "64k")
```

## 💡 面试加分项

- **实际经验**：可以分享生产环境中因为使用groupByKey导致的性能问题和优化经验
- **深度思考**：说明Map端预聚合的原理，以及为什么能大幅提升性能
- **对比分析**：可以提到combineByKey作为更灵活的选择，以及与SQL中GROUP BY的区别

## 🎯 推荐学习资源

想要更系统地掌握Spark面试题？推荐使用**AI面试助手小程序**：

- 📚 涵盖Spark完整知识体系，从RDD操作到性能调优
- 🤖 AI智能分析你的简历亮点，突出Spark项目经验和性能优化能力
- 💼 模拟真实面试场景练习，提升技术表达和问题解决能力
- 🎯 个性化推荐相关问题，如Spark SQL、Streaming、调优等

微信搜索"AI面试助手"，让面试准备更高效！

---
*更多Spark面试题解析，请关注我们的技术分享*