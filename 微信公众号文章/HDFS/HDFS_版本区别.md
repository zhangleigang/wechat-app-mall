# Hadoop版本演进详解

## 【问题】

简述Hadoop1.0、2.0、3.0的区别？

## 【答案】

### 3-5分钟快速总结

**Hadoop 1.0 → 2.0 → 3.0 是一个从单一架构到分离架构再到优化增强的演进过程。**

**核心区别：**

| 版本 | 核心架构 | 资源管理 | 存储特性 | 主要限制 |
|------|----------|----------|----------|----------|
| **1.0** | JobTracker + TaskTracker | 紧耦合，单点瓶颈 | 单NameNode，存在SPOF | 只支持MapReduce |
| **2.0** | YARN分离架构 | ResourceManager + NodeManager | NameNode HA，HDFS Federation | 引入YARN，支持多计算框架 |
| **3.0** | 2.0基础上增强 | 支持GPU/FPGA资源 | 纠删码，节省50%存储 | 性能和功能全面提升 |

**关键演进：**
- **1.0→2.0**：架构革命，YARN解耦资源管理和作业调度
- **2.0→3.0**：深度优化，纠删码技术大幅节省存储成本

### 详细版本对比分析

#### 一、Hadoop 1.0：开创与局限

**核心架构：**
```
Hadoop 1.0 = HDFS + MapReduce
├── HDFS：分布式文件系统
└── MapReduce：计算框架 + 资源管理
```

**主要组件：**
- **JobTracker**：单一主节点，负责作业调度和资源管理
- **TaskTracker**：从节点，执行Map/Reduce任务
- **NameNode**：HDFS主节点，管理元数据
- **DataNode**：HDFS从节点，存储数据

**核心问题：**

**1. 单点故障和扩展瓶颈**
```
JobTracker职责过重：
├── 资源管理（分配CPU、内存）
├── 作业调度（任务分发）
├── 任务监控（进度跟踪）
└── 故障恢复（任务重启）

结果：
- 集群规模限制在4000节点
- JobTracker成为性能瓶颈
- 一旦JobTracker宕机，整个集群瘫痪
```

**2. 资源利用率低**
```
静态资源分配：
├── Map Slots：固定数量的Map任务槽
└── Reduce Slots：固定数量的Reduce任务槽

问题：
- Map任务完成后，Map Slots闲置
- Reduce任务等待时，Reduce Slots浪费
- 无法动态调整资源分配
```

**3. 计算模型单一**
```
只支持MapReduce：
- 无法运行其他计算框架
- 不适合迭代计算（如机器学习）
- 不支持实时流处理
- 交互式查询性能差
```

#### 二、Hadoop 2.0：解耦与通用

**架构革命：引入YARN**
```
Hadoop 2.0 = HDFS + YARN + MapReduce
├── HDFS：分布式文件系统（增强版）
├── YARN：资源管理和作业调度平台
└── MapReduce：作为YARN上的一个应用
```

**YARN核心组件：**

**1. ResourceManager (RM)**
```
全局资源管理器：
├── 资源调度：统一管理集群资源
├── 应用管理：接收作业提交请求
└── 监控服务：监控NodeManager状态
```

**2. NodeManager (NM)**
```
节点资源管理器：
├── 资源监控：监控本节点资源使用
├── 容器管理：启动和监控Container
└── 日志管理：收集应用日志
```

**3. ApplicationMaster (AM)**
```
应用主控程序：
├── 资源申请：向RM申请资源
├── 任务调度：将任务分配给Container
└── 任务监控：监控任务执行状态
```

**核心改进：**

**1. 解决扩展性问题**
```
职责分离：
├── ResourceManager：只负责资源调度
├── ApplicationMaster：负责单个应用管理
└── NodeManager：负责节点资源管理

结果：
- 支持10000+节点集群
- 消除单点瓶颈
- 提高系统可靠性
```

**2. 提高资源利用率**
```
动态资源分配：
├── Container：动态资源容器
├── 资源共享：多应用共享集群资源
└── 弹性伸缩：根据需求动态调整

结果：
- 资源利用率提升30-50%
- 支持资源抢占
- 更好的多租户支持
```

**3. 支持多计算框架**
```
YARN作为统一平台：
├── MapReduce：批处理
├── Spark：内存计算
├── Storm：实时流处理
├── Tez：DAG执行引擎
└── Flink：流批一体

结果：
- 一个集群支持多种工作负载
- 降低运维成本
- 提高集群利用率
```

**HDFS增强：**

**1. NameNode高可用（HA）**
```
HA架构：
├── Active NameNode：处理客户端请求
├── Standby NameNode：热备状态
├── JournalNode：共享EditLog存储
└── ZKFC：自动故障转移控制
```

**2. HDFS Federation**
```
多NameNode支持：
├── 多个独立的NameNode
├── 各自管理不同的命名空间
└── 水平扩展元数据管理能力
```

#### 三、Hadoop 3.0：优化与增强

**在2.0基础上的深度优化：**

**1. 存储优化：纠删码（Erasure Coding）**
```
传统副本 vs 纠删码：

传统3副本：
├── 数据：100GB
├── 副本：200GB
└── 总存储：300GB（200%冗余）

RS(6,3)纠删码：
├── 数据块：6个
├── 校验块：3个
└── 总存储：150GB（50%冗余）

节省存储：50%，可靠性相同
```

**纠删码策略示例：**
```bash
# 设置纠删码策略
hdfs ec -setPolicy -path /data -policy RS-6-3-1024k

# 查看纠删码状态
hdfs ec -getPolicy -path /data
```

**2. YARN增强**

**资源类型扩展：**
```xml
<!-- 支持GPU资源 -->
<property>
    <name>yarn.resource-types</name>
    <value>yarn.io/gpu</value>
</property>

<!-- 支持FPGA资源 -->
<property>
    <name>yarn.resource-types</name>
    <value>yarn.io/fpga</value>
</property>
```

**机会容器（Opportunistic Containers）：**
```
资源利用优化：
├── 保证容器：资源预留
├── 机会容器：利用空闲资源
└── 动态抢占：根据优先级调整
```

**3. 性能提升**

**MapReduce优化：**
```
任务本地化改进：
├── 更好的数据本地性
├── 减少网络传输
└── 提升任务执行效率
```

**Docker支持：**
```yaml
# YARN支持Docker容器
yarn.nodemanager.container-executor.class:
  org.apache.hadoop.yarn.server.nodemanager.DockerContainerExecutor

yarn.nodemanager.docker-container-executor.exec-name: docker
```

**4. 其他重要特性**

**多NameNode服务：**
```
支持超过2个NameNode：
├── 多个Standby NameNode
├── 更高的可用性
└── 更好的读取性能
```

**时间轴服务v2：**
```
改进的应用历史服务：
├── 更好的可扩展性
├── 更高的可靠性
└── 更丰富的监控信息
```

**默认端口更改：**
```
避免端口冲突：
├── NameNode：9000 → 9820
├── Secondary NameNode：50090 → 9868
└── DataNode：50010 → 9866
```

#### 四、版本选择建议

**生产环境推荐：**

**Hadoop 2.x（稳定选择）：**
```
适用场景：
├── 成熟的生产环境
├── 对稳定性要求高
├── 已有大量2.x经验
└── 不需要最新特性

推荐版本：2.10.x（最新稳定版）
```

**Hadoop 3.x（未来趋势）：**
```
适用场景：
├── 新建集群
├── 存储成本敏感
├── 需要GPU/FPGA支持
└── 追求最新特性

推荐版本：3.3.x（当前稳定版）
```

**迁移建议：**
```
迁移路径：
1. 先升级到2.10.x最新版本
2. 充分测试应用兼容性
3. 逐步迁移到3.x版本
4. 启用纠删码等新特性
```

#### 五、性能对比总结

**集群规模支持：**
```
Hadoop 1.0：~4,000节点
Hadoop 2.0：~10,000节点
Hadoop 3.0：>10,000节点
```

**资源利用率：**
```
Hadoop 1.0：60-70%
Hadoop 2.0：70-85%
Hadoop 3.0：80-90%
```

**存储效率：**
```
Hadoop 1.0/2.0：3副本（200%冗余）
Hadoop 3.0：纠删码（50%冗余）
```

**支持的计算框架：**
```
Hadoop 1.0：MapReduce
Hadoop 2.0：MapReduce, Spark, Storm, Tez
Hadoop 3.0：全部2.0支持 + 更好的容器化支持
```

## 【引流引导】

想要深入学习Hadoop各版本特性和最佳实践？

👉 **扫码体验AI面试助手小程序**
- 🎯 200+精选大数据面试题库
- 🤖 AI智能简历分析和优化建议  
- 📚 Hadoop、YARN、HDFS架构演进详解
- 💡 真实面试场景模拟训练

让AI助你在大数据面试中脱颖而出！

---

*关注我们，获取更多大数据技术干货和面试攻略！*