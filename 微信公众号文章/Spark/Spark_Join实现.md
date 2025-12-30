# SparkSQL的三种Join实现

## 【问题】
sparksql的三种join实现

## 【答案】

### 快速回答（3-5分钟总结）

SparkSQL中有三种核心的Join实现方式：

1. **Broadcast Hash Join（广播哈希连接）**：适用于小表与大表的连接，将小表广播到所有节点，避免Shuffle，性能最佳
2. **Shuffled Hash Join（洗牌哈希连接）**：适用于中等大小表的连接，需要Shuffle但不需要排序，构建哈希表进行连接
3. **Sort-Merge Join（排序合并连接）**：适用于大表与大表的连接，需要Shuffle和排序，但最稳定可靠

Spark会根据表大小、统计信息和Join类型自动选择最优策略。

### 详细解释

我们来详细讲解 Spark SQL 中三种核心的 Join 实现方式。理解这三种方式对于编写高效的 Spark 作业至关重要。

Spark SQL 在选择 Join 策略时，会基于**统计信息**（如表大小、分区数、是否有合适的排序或分区）和**Join类型**来选择一个它认为最优的策略。

以下是三种最主要的 Join 实现：

#### 1. Broadcast Hash Join

也称为**Map端Join**或**广播Join**。

**核心思想**

当参与Join的一张表非常小（尺寸小于 `spark.sql.autoBroadcastJoinThreshold`，默认10MB）时，Spark会选择将这张小表的全部数据**广播**到含有大表数据的所有Executor节点上。之后，每个Executor节点上的大表分区就可以在本地直接与小表进行Join，无需进行Shuffle。

**工作原理**
1. **Driver端**：收集小表的数据
2. **广播**：Driver将小表的数据发送（广播）到集群中的所有Executor节点
3. **Map端Join**：每个Executor节点现在都拥有了小表的完整副本。当处理大表的分区数据时，它可以直接在本地通过构建小表的哈希表来完成Join操作

**示意图**
```
大表 (分布在各Executor)       小表 (广播后)
Executor 1: [大表分区1]  +--> [小表全集]
Executor 2: [大表分区2]  +--> [小表全集]
Executor 3: [大表分区3]  +--> [小表全集]
```
每个Executor独立完成自己分区的Join，结果直接输出。

**触发条件**
- 参与Join的一张表尺寸**小于** `spark.sql.autoBroadcastJoinThreshold` 参数设置的值
- Join类型是等值Join（如 `=`）
- 基表不能是Streaming DataSource（对于Streaming + Static 的Join有专门的实现）

**优点**
- **性能极高**：完全避免了Shuffle，网络开销最小，是效率最高的Join方式
- **速度快**：数据处理在本地完成

**缺点**
- 只适用于小表。如果广播的表太大，会消耗大量网络带宽和Executor内存，可能导致Driver或Executor OOM

**手动提示**
即使表的大小略微超过阈值，如果你确信它可以被安全广播，可以使用 SQL 提示：
```sql
SELECT /*+ BROADCAST(smallTable) */ * 
FROM largeTable 
JOIN smallTable ON largeTable.key = smallTable.key;
```

#### 2. Shuffled Hash Join

当表太大无法广播，但其中一张表在Shuffle后仍然能在内存中构建哈希表时，Spark会选择这种策略。

**核心思想**
1. **Shuffle阶段**：对两张表按照Join Key进行Shuffle，使得相同Key的数据被分发到同一个Executor节点上
2. **构建哈希表**：在Reduce阶段，对于每一个任务（Task），将其中一张表（通常是较小的一张，称为**build relation**）的数据读入内存，并为其构建一个哈希表
3. **探测**：然后逐行读取另一张表（**stream relation**）的数据，并用Join Key去探测刚刚构建的哈希表，找到匹配的行并输出结果

**示意图**
```
原始数据：
Table A: [(k1, a1), (k2, a2), (k1, a3)] 分布在 Executor 1, 2
Table B: [(k1, b1), (k2, b2), (k1, b3)] 分布在 Executor 1, 3

Shuffle后 (按Key k1, k2分区)：
Partition for k1 (在某个Executor上): 
    Build Table B: [ (k1, b1), (k1, b3) ] -> 构建哈希表
    Stream Table A: [ (k1, a1), (k1, a3) ] -> 探测哈希表，输出结果

Partition for k2 (在另一个Executor上): 
    Build Table B: [ (k2, b2) ] -> 构建哈希表
    Stream Table A: [ (k2, a2) ] -> 探测哈希表，输出结果
```

**触发条件**
- 表比广播阈值大，无法进行 Broadcast Hash Join
- **小表的一侧**（经过分区和过滤后）的平均大小小于 `spark.sql.adaptive.maxShuffledHashJoinLocalMapThreshold`（默认等于广播阈值），确保其能在内存中构建哈希表
- Join类型是等值Join
- 没有启用 AQE（Adaptive Query Execution）或者 AQE 关闭了此功能

**优点**
- 避免了 SortMergeJoin 所需的排序开销
- 相比于 Broadcast Join，能处理更大的表

**缺点**
- 需要一次 Shuffle，有网络开销
- 对构建侧（build side）表的大小敏感，如果估算不准，可能导致构建的哈希表过大，引发 Executor OOM

#### 3. Sort-Merge Join

这是处理**两个大表**Join时最常用、最稳定的策略。

**核心思想**
1. **Shuffle Sort阶段**：
   - 将两张表按照 Join Key 进行 Shuffle，确保相同 Key 的数据进入同一个分区
   - **对每个分区内的数据，按照 Join Key 进行排序**
2. **Merge阶段**：
   - 在Reduce端，现在两个有序的迭代器（分别来自左表和右表）被合并
   - 这个过程类似于归并排序的合并步骤。由于两边都是有序的，只需按顺序遍历，即可高效地匹配到相同Key的行

**示意图**
```
Shuffle and Sort 后：
Partition 1 (已按Key排序):
    Table A: [ (k1, a1), (k1, a2), (k3, a3) ]
    Table B: [ (k1, b1), (k1, b2), (k2, b3) ]

Merge过程：
- 指针指向 A(k1), B(k1) -> 匹配，输出结果
- 移动B指针到下一个k1，A指针不动 -> 输出结果
- A指针移动到k3，B指针移动到k2 -> 不匹配，移动B指针
- ... 继续
```

**触发条件**
- 当参与Join的两张表都很大，无法满足 Broadcast 或 Shuffled Hash Join 的条件时，这是默认的 fallback 策略
- Join类型是等值Join
- Join Key是可排序的

**优点**
- **稳定可靠**：由于不需要在内存中构建整个分区的哈希表，它对内存的要求比 Shuffled Hash Join 低，更不容易OOM。非常适合大表对大表的Join
- 如果数据已经按照 Join Key 分好区并排好序，可以跳过 Shuffle-Sort 阶段，效率极高

**缺点**
- 强制引入了 **Shuffle** 和 **Sort** 两个昂贵操作，是三种方式中开销最大的
- 如果数据分布倾斜，会导致个别任务运行缓慢

#### 总结与对比

| 特性 | Broadcast Hash Join | Shuffled Hash Join | Sort-Merge Join |
| :--- | :--- | :--- | :--- |
| **核心思想** | 广播小表，本地Hash Join | Shuffle后，在内存构建Hash表再Join | Shuffle后排序，再归并合并 |
| **Shuffle** | **无** | **有** | **有** |
| **排序** | 无 | 无 | **有** |
| **适用场景** | 小表 Join 大表 | 中表 Join 大表 | 大表 Join 大表 |
| **内存消耗** | Executor端存储广播数据 | Executor端构建Hash表 | 较低（流式遍历） |
| **性能** | **最佳** | 较好 | 稳定，但开销大 |
| **稳定性** | 小表过大时不稳定 | 构建表过大时可能OOM | **最稳定** |

#### 扩展：Adaptive Query Execution (AQE) 的影响

在 Spark 3.x 中，AQE 的引入极大地优化了 Join 策略的选择：
- **动态切换Join策略**：在运行时，如果 AQE 发现 Shuffled Hash Join 的构建侧（build side）实际大小小于广播阈值，它会**动态地将 Shuffled Hash Join 转换为 Broadcast Hash Join**
- **优化倾斜Join**：AQE 能自动检测到数据倾斜的 Join Key，并将其拆分成多个子任务，避免长尾任务，显著提升 Sort-Merge Join 和 Shuffled Hash Join 的性能

因此，在现代 Spark 版本中，你通常不需要手动干预太多，AQE 已经能帮你做出很好的决策。但理解其底层原理，仍然是进行性能调优和问题诊断的基础。

## 【引流引导】

想要深入掌握Spark性能调优和大数据面试技巧吗？我们的AI面试助手小程序为你提供：

✅ **海量面试题库**：涵盖Spark、Flink、Kafka等主流大数据技术
✅ **智能简历分析**：AI驱动的简历优化建议  
✅ **实战案例解析**：真实面试场景模拟
✅ **个性化学习路径**：根据你的技术栈定制学习计划

扫描下方小程序码，开启你的大数据面试进阶之路！让AI助你在技术面试中脱颖而出！

*专业的技术，专业的指导，助你成为大数据领域的技术专家！*