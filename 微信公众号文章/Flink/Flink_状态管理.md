# Flink中，有哪几种类型的状态，你知道状态后端吗

## 【问题】
Flink中，有哪几种类型的状态，你知道状态后端吗

## 【答案】

### 快速回答（3-5分钟总结）

Flink中的状态主要分为两大类：**算子状态**和**键控状态**。

**状态类型**：
- **算子状态**：与单个算子并行实例绑定，如Kafka Consumer的偏移量管理
- **键控状态**：与键绑定的状态，只能在KeyedStream上使用，提供ValueState、ListState、MapState等多种数据结构

**状态后端**是状态的"管家"，负责状态的存储和持久化：
- **HashMapStateBackend**：状态存储在JVM堆内存，读写速度快，适合状态不大的场景
- **EmbeddedRocksDBStateBackend**：状态存储在本地RocksDB数据库，支持超大状态，适合TB级别的状态管理

选择原则：状态小选HashMap，状态大选RocksDB。

### 详细解释

#### Flink中的状态类型

Flink中的状态主要可以分为以下两大类和两种特殊形式：

**1. 按结构和访问方式划分**

**a) 算子状态（Operator State）**

算子状态与**单个算子并行实例**绑定的状态。算子状态的作用范围仅限于当前的算子任务，不能被其他任务访问。

**特点**：
- **绑定于并行子任务**：一个算子的并行度为3，那么就会有3个独立的算子状态
- **支持重缩放**：当算子并行度改变时，Flink需要对算子状态进行重新分配
- **重新分配策略**：支持UnionListState（将状态列表广播到所有新任务）和BroadcastState（状态一致地复制到所有新任务）

**典型应用场景**：
- **源连接器的偏移量管理**：例如Kafka Consumer需要记录每个分区当前的消费偏移量
- **广播状态模式**：将一个"规则流"或"配置流"广播到所有下游任务

**b) 键控状态（Keyed State）**

键控状态与**键**绑定的状态。它只能在`KeyedStream`上使用，通过`keyBy()`操作将数据分区后，每个键都有自己的状态。

**特点**：
- **绑定于键**：状态是"按键分区"的。每个键对应的状态逻辑上独立
- **通过Keyed Context访问**：必须在富函数中，通过运行时上下文访问
- **丰富的数据结构**：Flink提供了多种原生的数据结构：
  - `ValueState<T>`：存储单个值
  - `ListState<T>`：存储一个元素列表
  - `MapState<UK, UV>`：存储一个键值对映射
  - `ReducingState<T>`：存储一个值，该值是所有添加到这个状态的值的聚合结果
  - `AggregatingState<IN, OUT>`：与ReducingState类似，但输入和输出类型可以不同

**典型应用场景**：
- 窗口聚合（如每分钟每个用户的点击量）
- 模式检测（如检测用户连续登录失败）
- 去重（如一天内每个用户的首次访问）

**2. 按工作方式划分**

**a) 托管状态（Managed State）**
- 上面提到的算子状态和键控状态都是托管状态
- 由Flink运行时管理：Flink负责状态的存储、访问、持久化和重缩放
- **推荐使用**：开发者只需关心状态逻辑，无需关心状态的具体存储细节

**b) 原始状态（Raw State）**
- 用户自己管理：开发者需要在算子里自己定义和管理状态
- Flink不感知：Flink完全不知道这些状态的存在，因此无法提供持久化、一致性保证和重缩放功能
- **极少使用**：只在一些非常特殊、需要对状态有极致控制的场景下使用

#### 状态后端详解

**状态后端**是Flink中一个至关重要的组件，它决定了**托管状态**是如何被存储、访问和持久化的。

你可以把它理解为状态的"管家"或"仓库管理员"，它负责两件核心事情：
1. **本地状态管理**：在TaskManager的JVM堆内或堆外内存中，如何存储和访问当前工作状态
2. **状态快照的持久化**：当Checkpoint或Savepoint触发时，如何将状态快照持久化到远程的、可靠的外部存储系统中

**常见的状态后端**

**1. HashMapStateBackend（哈希表状态后端）**

**工作原理**：将**工作状态**作为对象存储在TaskManager的**JVM堆**上。`KeyedState`存储在一个哈希表中。

**特点**：
- **高速**：读写速度快，因为数据在内存中
- **受GC影响**：如果状态非常大，可能会导致长时间的GC停顿，影响性能
- **Checkpoint**：在做快照时，将整个状态发送到持久化存储

**适用场景**：状态不大、对性能要求高的作业。大多数DataStream API作业的推荐选择。

**2. EmbeddedRocksDBStateBackend（嵌入式RocksDB状态后端）**

**工作原理**：将**工作状态**存储在TaskManager本地的**RocksDB**数据库中。RocksDB是一个嵌入式的KV存储库，默认将数据存储在磁盘上，但会利用OS的page cache进行缓存。

**特点**：
- **状态可超内存**：由于数据主要存储在磁盘上，因此可以支持非常大的状态（如TB级别）
- **速度较慢**：相比内存方案，读写速度慢，因为涉及序列化和磁盘I/O
- **Checkpoint**：做快照时，是增量式的，只上传RocksDB中变化的文件，效率高
- **不受GC影响**：状态在JVM堆外，GC压力小

**适用场景**：状态量非常大、窗口很长、键的基数很高的作业。

#### 如何选择状态后端？

| 特性 | HashMapStateBackend | EmbeddedRocksDBStateBackend |
|------|---------------------|----------------------------|
| **状态存储** | JVM堆内存 | 本地磁盘（+ OS缓存） |
| **状态大小限制** | 受集群可用内存限制 | 受本地磁盘大小限制 |
| **吞吐量** | **高** | 中等 |
| **延迟** | **低** | 中等偏高 |
| **快照方式** | 全量 | **增量** |
| **GC影响** | 大 | 小 |
| **适用场景** | 状态小、低延迟场景 | **大状态**、长窗口、高可用性场景 |

#### 配置状态后端

可以在`flink-conf.yaml`中全局配置，也可以在代码中为单个作业配置。

**全局配置示例**：
```yaml
# 可选 'hashmap' 或 'rocksdb'
state.backend: hashmap

# Checkpoint数据的存储目录
state.checkpoints.dir: hdfs://namenode:40010/flink/checkpoints
```

**单作业代码配置示例**：
```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

// 使用HashMapStateBackend（默认）
env.setStateBackend(new HashMapStateBackend());

// 或者使用EmbeddedRocksDBStateBackend
env.setStateBackend(new EmbeddedRocksDBStateBackend());

// 设置Checkpoint存储路径
env.getCheckpointConfig().setCheckpointStorage("hdfs://namenode:40010/flink/checkpoints");
```

## 【引流引导】

想要深入学习更多大数据面试知识？我们的AI面试助手小程序为你提供：

✅ **海量面试题库**：覆盖Flink、Spark、Kafka等主流技术栈
✅ **AI智能解答**：个性化的面试问题分析和回答建议  
✅ **简历优化**：AI驱动的简历分析和改进建议
✅ **实时更新**：紧跟技术发展趋势，持续更新题库

扫描下方小程序码，开启你的大数据面试准备之旅！让AI助你在面试中脱颖而出！

*微信搜索"AI面试助手"小程序，或联系微信：csuzhangleigang*