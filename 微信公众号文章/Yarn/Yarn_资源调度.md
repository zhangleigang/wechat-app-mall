# 【问题】Yarn的资源调度机制

## 【答案】

### 3-5分钟快速回答要点：

YARN提供三种主要的资源调度器：
1. **FIFO调度器**：先进先出，简单但可能导致小任务饥饿
2. **Capacity调度器**：支持多队列和资源配额，适合多租户环境
3. **Fair调度器**：公平共享资源，支持抢占机制

核心机制包括资源容器化、两级调度（RM分配容器，AM调度任务）和动态资源分配，通过这些机制实现集群资源的高效利用。

---

### 详细技术解析

#### 一、YARN资源调度架构

```
YARN资源调度架构：
┌─────────────────────────────────────────────────────────────┐
│                    ResourceManager                         │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Scheduler     │    │     ApplicationsManager        │ │
│  │                 │    │                                 │ │
│  │ - 资源分配       │◄──►│ - 应用生命周期管理               │ │
│  │ - 队列管理       │    │ - AM启动和监控                  │ │
│  │ - 容器分配       │    │ - 应用状态跟踪                  │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│           │                           │                     │
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────┐           ┌─────────────────┐
│  NodeManager 1  │           │  NodeManager 2  │
│                 │           │                 │
│ ┌─────────────┐ │           │ ┌─────────────┐ │
│ │ Container 1 │ │           │ │ Container 3 │ │
│ └─────────────┘ │           │ └─────────────┘ │
│ ┌─────────────┐ │           │ ┌─────────────┐ │
│ │ Container 2 │ │           │ │ Container 4 │ │
│ └─────────────┘ │           │ └─────────────┘ │
└─────────────────┘           └─────────────────┘
```

#### 二、三种调度器详解

**1. FIFO调度器（FifoScheduler）**

最简单的调度策略，按照应用提交的时间顺序进行调度。

```java
// FIFO调度器核心逻辑
public class FifoScheduler implements ResourceScheduler {
    
    private Queue<FifoAppAttempt> pendingApplications = new LinkedList<>();
    
    @Override
    public Allocation allocate(ApplicationAttemptId attemptId, 
                              List<ResourceRequest> resourceRequests) {
        
        FifoAppAttempt application = getApplication(attemptId);
        
        // 按FIFO顺序分配资源
        if (application == pendingApplications.peek()) {
            return allocateContainers(application, resourceRequests);
        } else {
            // 不是队首应用，等待
            return new Allocation(Collections.emptyList(), 
                                Collections.emptyList(), 
                                Collections.emptyList());
        }
    }
}
```

**特点：**
- ✅ 实现简单，开销小
- ✅ 适合单用户或批处理场景
- ❌ 大应用会阻塞小应用
- ❌ 资源利用率可能不高

**2. Capacity调度器（CapacityScheduler）**

支持多队列的层次化调度，每个队列有独立的资源配额。

```xml
<!-- capacity-scheduler.xml配置示例 -->
<configuration>
  <!-- 根队列的子队列 -->
  <property>
    <name>yarn.scheduler.capacity.root.queues</name>
    <value>production,development,urgent</value>
  </property>
  
  <!-- 生产队列配置 -->
  <property>
    <name>yarn.scheduler.capacity.root.production.capacity</name>
    <value>60</value>  <!-- 60%的资源 -->
  </property>
  
  <property>
    <name>yarn.scheduler.capacity.root.production.maximum-capacity</name>
    <value>80</value>  <!-- 最多可用80%资源 -->
  </property>
  
  <!-- 开发队列配置 -->
  <property>
    <name>yarn.scheduler.capacity.root.development.capacity</name>
    <value>30</value>
  </property>
  
  <!-- 紧急队列配置 -->
  <property>
    <name>yarn.scheduler.capacity.root.urgent.capacity</name>
    <value>10</value>
  </property>
  
  <property>
    <name>yarn.scheduler.capacity.root.urgent.user-limit-factor</name>
    <value>1</value>  <!-- 用户资源限制因子 -->
  </property>
</configuration>
```

**调度逻辑：**

```java
public class CapacityScheduler implements ResourceScheduler {
    
    @Override
    public Allocation allocate(ApplicationAttemptId attemptId, 
                              List<ResourceRequest> resourceRequests) {
        
        CSQueue queue = getQueue(attemptId);
        
        // 1. 检查队列资源配额
        if (!queue.canAssignToThisQueue(resourceRequests)) {
            return EMPTY_ALLOCATION;
        }
        
        // 2. 在队列内按优先级和FIFO排序
        List<FiCaSchedulerApp> sortedApps = queue.getSortedApplications();
        
        // 3. 为队列内应用分配资源
        for (FiCaSchedulerApp app : sortedApps) {
            Allocation allocation = assignContainers(app, resourceRequests);
            if (allocation.getContainers().size() > 0) {
                return allocation;
            }
        }
        
        return EMPTY_ALLOCATION;
    }
}
```

**队列层次结构：**
```
root (100%)
├── production (60%, max 80%)
│   ├── etl (30%)
│   └── analytics (30%)
├── development (30%, max 50%)
│   ├── testing (15%)
│   └── research (15%)
└── urgent (10%, max 100%)
```

**3. Fair调度器（FairScheduler）**

实现资源的公平共享，支持抢占机制。

```xml
<!-- fair-scheduler.xml配置示例 -->
<allocations>
  <queue name="production">
    <minResources>10240 mb,10 vcores</minResources>
    <maxResources>40960 mb,40 vcores</maxResources>
    <maxRunningApps>50</maxRunningApps>
    <weight>3.0</weight>
    <schedulingPolicy>fair</schedulingPolicy>
  </queue>
  
  <queue name="development">
    <minResources>5120 mb,5 vcores</minResources>
    <maxResources>20480 mb,20 vcores</maxResources>
    <maxRunningApps>20</maxRunningApps>
    <weight>1.0</weight>
    <schedulingPolicy>fifo</schedulingPolicy>
  </queue>
  
  <!-- 抢占配置 -->
  <fairSharePreemptionTimeout>600</fairSharePreemptionTimeout>
  <fairSharePreemptionThreshold>0.5</fairSharePreemptionThreshold>
</allocations>
```

**公平共享算法：**

```java
public class FairScheduler implements ResourceScheduler {
    
    // 计算队列的公平共享资源
    private void updateFairShares() {
        for (FSQueue queue : queues) {
            // 基于权重计算公平共享
            double fairShare = totalResources * queue.getWeight() / totalWeight;
            queue.setFairShare(fairShare);
            
            // 检查是否需要抢占
            if (queue.getUsedResources() < queue.getFairShare() * preemptionThreshold) {
                schedulePreemption(queue);
            }
        }
    }
    
    // 抢占逻辑
    private void schedulePreemption(FSQueue underUtilizedQueue) {
        for (FSQueue queue : queues) {
            if (queue.getUsedResources() > queue.getFairShare()) {
                // 选择要抢占的容器
                List<RMContainer> containersToPreempt = selectContainersToPreempt(queue);
                for (RMContainer container : containersToPreempt) {
                    preemptContainer(container);
                }
            }
        }
    }
}
```

#### 三、资源模型和容器

**1. 资源抽象**

```java
// YARN资源模型
public class Resource {
    private int memory;      // 内存（MB）
    private int vCores;      // 虚拟CPU核数
    private Map<String, Long> resources; // 扩展资源（GPU、FPGA等）
    
    public static Resource newInstance(int memory, int vCores) {
        Resource resource = new Resource();
        resource.setMemory(memory);
        resource.setVirtualCores(vCores);
        return resource;
    }
    
    // 资源比较和运算
    public boolean fitsIn(Resource other) {
        return this.memory <= other.memory && this.vCores <= other.vCores;
    }
    
    public Resource add(Resource other) {
        return newInstance(this.memory + other.memory, 
                          this.vCores + other.vCores);
    }
}
```

**2. 容器生命周期**

```java
// 容器状态管理
public enum ContainerState {
    NEW,          // 新创建
    ALLOCATED,    // 已分配
    ACQUIRED,     // 已获取
    RUNNING,      // 运行中
    COMPLETE,     // 已完成
    KILLED        // 已杀死
}

public class RMContainer {
    private ContainerId containerId;
    private Resource allocatedResource;
    private NodeId nodeId;
    private ContainerState state;
    private long startTime;
    private long finishTime;
    
    public void handle(RMContainerEvent event) {
        switch (event.getType()) {
            case START:
                startContainer();
                break;
            case ACQUIRED:
                acquireContainer();
                break;
            case FINISHED:
                finishContainer();
                break;
            case KILL:
                killContainer();
                break;
        }
    }
}
```

#### 四、动态资源分配

**1. 资源请求和分配**

```java
// ApplicationMaster资源请求
public class AMRMClient {
    
    public void addContainerRequest(ContainerRequest request) {
        // 1. 验证资源请求
        validateResourceRequest(request);
        
        // 2. 添加到请求队列
        Priority priority = request.getPriority();
        String resourceName = request.getResourceName();
        
        Map<String, TreeMap<Resource, ResourceRequestInfo>> remoteRequestsTable = 
            this.remoteRequestsTable.get(priority);
        
        if (remoteRequestsTable == null) {
            remoteRequestsTable = new HashMap<>();
            this.remoteRequestsTable.put(priority, remoteRequestsTable);
        }
        
        // 3. 按位置偏好组织请求
        TreeMap<Resource, ResourceRequestInfo> reqMap = remoteRequestsTable.get(resourceName);
        if (reqMap == null) {
            reqMap = new TreeMap<>(new ResourceComparator());
            remoteRequestsTable.put(resourceName, reqMap);
        }
        
        ResourceRequestInfo resourceRequestInfo = reqMap.get(request.getCapability());
        if (resourceRequestInfo == null) {
            resourceRequestInfo = new ResourceRequestInfo(priority, resourceName, 
                                                         request.getCapability());
            reqMap.put(request.getCapability(), resourceRequestInfo);
        }
        
        resourceRequestInfo.remoteRequest.setNumContainers(
            resourceRequestInfo.remoteRequest.getNumContainers() + 1);
    }
}
```

**2. 本地性感知调度**

```java
// 数据本地性优化
public class LocalitySchedulingPlacementSet {
    
    public NodeType allowedLocalityLevel(Priority priority, 
                                        int clusterNodes, 
                                        int missedOpportunities) {
        
        // 根据错过的机会数决定本地性级别
        if (missedOpportunities < nodeLocalityDelay) {
            return NodeType.NODE_LOCAL;      // 节点本地
        } else if (missedOpportunities < rackLocalityDelay) {
            return NodeType.RACK_LOCAL;      // 机架本地
        } else {
            return NodeType.OFF_SWITCH;      // 跨机架
        }
    }
}
```

**本地性级别：**
```
数据本地性优先级：
1. NODE_LOCAL  (最优) - 数据和计算在同一节点
2. RACK_LOCAL  (次优) - 数据和计算在同一机架
3. OFF_SWITCH  (一般) - 数据和计算跨机架
```

#### 五、资源抢占机制

**1. Fair调度器的抢占**

```java
public class FSPreemptionThread extends Thread {
    
    @Override
    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // 1. 识别资源不足的队列
                List<FSQueue> starvedQueues = identifyStarvedQueues();
                
                // 2. 为每个饥饿队列计算需要抢占的资源
                for (FSQueue queue : starvedQueues) {
                    Resource deficit = calculateResourceDeficit(queue);
                    
                    // 3. 选择要抢占的容器
                    List<RMContainer> containersToPreempt = 
                        selectContainersToPreempt(queue, deficit);
                    
                    // 4. 执行抢占
                    for (RMContainer container : containersToPreempt) {
                        preemptContainer(container);
                    }
                }
                
                Thread.sleep(preemptionInterval);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    private List<RMContainer> selectContainersToPreempt(FSQueue starvedQueue, 
                                                       Resource deficit) {
        List<RMContainer> containersToPreempt = new ArrayList<>();
        
        // 选择策略：优先抢占超出公平共享最多的队列的容器
        for (FSQueue queue : getAllQueues()) {
            if (queue.getUsedResources().compareTo(queue.getFairShare()) > 0) {
                List<RMContainer> candidates = queue.getPreemptableContainers();
                
                // 按优先级和启动时间排序
                candidates.sort((c1, c2) -> {
                    int priorityCompare = c2.getAllocatedPriority()
                                           .compareTo(c1.getAllocatedPriority());
                    if (priorityCompare != 0) {
                        return priorityCompare;
                    }
                    return Long.compare(c2.getCreationTime(), c1.getCreationTime());
                });
                
                // 选择足够的容器满足deficit
                Resource preempted = Resource.newInstance(0, 0);
                for (RMContainer container : candidates) {
                    containersToPreempt.add(container);
                    preempted = Resources.add(preempted, container.getAllocatedResource());
                    
                    if (Resources.greaterThanOrEqual(preempted, deficit)) {
                        break;
                    }
                }
            }
        }
        
        return containersToPreempt;
    }
}
```

**2. Capacity调度器的抢占**

```java
public class ProportionalCapacityPreemptionPolicy implements SchedulingEditPolicy {
    
    @Override
    public void editSchedule() {
        // 1. 构建资源分配树
        TempQueuePerPartition root = cloneQueues();
        
        // 2. 计算理想分配
        computeIdealResourceDistribution(root);
        
        // 3. 识别需要抢占的资源
        List<RMContainer> containersToPreempt = new ArrayList<>();
        
        for (TempQueuePerPartition queue : root.getChildren()) {
            if (queue.untouchableExtra.greaterThan(Resources.none())) {
                // 计算需要抢占的资源量
                Resource toPreempt = queue.untouchableExtra;
                
                // 选择要抢占的容器
                selectContainersToPreempt(queue, toPreempt, containersToPreempt);
            }
        }
        
        // 4. 执行抢占
        for (RMContainer container : containersToPreempt) {
            scheduler.markContainerForPreemption(container);
        }
    }
}
```

#### 六、资源配额和限制

**1. 队列资源配额**

```java
// 队列资源管理
public abstract class AbstractCSQueue implements CSQueue {
    
    protected Resource minimumAllocation;  // 最小资源保证
    protected Resource maximumAllocation;  // 最大资源限制
    protected float capacity;              // 容量百分比
    protected float maximumCapacity;       // 最大容量百分比
    protected float absoluteCapacity;      // 绝对容量
    
    public boolean canAssignToThisQueue(Resource required) {
        // 检查是否超出队列最大容量
        Resource currentUsed = getUsedResources();
        Resource afterAllocation = Resources.add(currentUsed, required);
        
        Resource maxResource = Resources.multiply(
            getParent().getAbsoluteCapacity(), 
            maximumCapacity);
            
        return Resources.lessThanOrEqual(afterAllocation, maxResource);
    }
}
```

**2. 用户资源限制**

```java
// 用户级别的资源限制
public class User {
    private String userName;
    private Resource userResourceLimit;    // 用户资源上限
    private Resource currentUsage;         // 当前使用量
    private int maxApplications;           // 最大应用数
    private int runningApplications;       // 运行中应用数
    
    public boolean canSubmitApplication() {
        return runningApplications < maxApplications;
    }
    
    public boolean canAllocateResource(Resource required) {
        Resource afterAllocation = Resources.add(currentUsage, required);
        return Resources.lessThanOrEqual(afterAllocation, userResourceLimit);
    }
}
```

#### 七、性能优化和调优

**1. 调度器性能优化**

```java
// 异步调度优化
public class CapacitySchedulerAsyncThread extends Thread {
    
    @Override
    public void run() {
        while (!stopped && !Thread.currentThread().isInterrupted()) {
            try {
                // 批量处理资源请求
                List<NodeUpdateSchedulerEvent> events = 
                    eventQueue.drainTo(new ArrayList<>(), maxEventsToProcess);
                
                for (NodeUpdateSchedulerEvent event : events) {
                    // 异步处理节点更新事件
                    processNodeUpdate(event);
                }
                
                Thread.sleep(schedulingInterval);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}
```

**2. 关键配置参数**

```xml
<!-- 调度器性能调优 -->
<property>
  <name>yarn.scheduler.capacity.resource-calculator</name>
  <value>org.apache.hadoop.yarn.util.resource.DominantResourceCalculator</value>
</property>

<!-- 抢占配置 -->
<property>
  <name>yarn.resourcemanager.monitor.capacity.preemption.monitoring_interval</name>
  <value>3000</value>  <!-- 抢占检查间隔3秒 -->
</property>

<property>
  <name>yarn.resourcemanager.monitor.capacity.preemption.max_wait_before_kill</name>
  <value>15000</value>  <!-- 抢占等待时间15秒 -->
</property>

<!-- 调度间隔 -->
<property>
  <name>yarn.scheduler.capacity.schedule-asynchronously.enable</name>
  <value>true</value>
</property>
```

#### 八、监控和调试

**1. Web UI监控**

```
ResourceManager Web UI: http://rm-host:8088
├── Cluster Metrics     (集群资源使用情况)
├── Scheduler          (调度器状态和队列信息)
├── Applications       (应用列表和状态)
└── Nodes             (节点资源使用情况)
```

**2. 命令行监控**

```bash
# 查看队列状态
yarn queue -status production

# 查看集群资源使用
yarn top

# 查看应用资源使用
yarn application -status application_1234567890123_0001

# 移动应用到不同队列
yarn application -movetoqueue application_1234567890123_0001 -queue development
```

**3. JMX指标监控**

```java
// 关键调度器指标
public class SchedulerMetrics {
    
    // 队列指标
    private Gauge queueCapacity;           // 队列容量
    private Gauge queueUsedCapacity;       // 队列已用容量
    private Gauge queuePendingContainers;  // 队列等待容器数
    
    // 调度指标
    private Counter containersAllocated;   // 分配的容器数
    private Counter containersReleased;    // 释放的容器数
    private Histogram allocationLatency;   // 分配延迟
    
    // 抢占指标
    private Counter containersPreempted;   // 被抢占的容器数
    private Histogram preemptionLatency;   // 抢占延迟
}
```

### 总结

YARN的资源调度机制通过以下核心特性实现高效的集群资源管理：

1. **多样化调度策略**：FIFO、Capacity、Fair三种调度器适应不同场景
2. **层次化队列管理**：支持复杂的组织结构和资源隔离
3. **动态资源分配**：根据实际需求动态调整资源分配
4. **本地性感知**：优化数据访问性能
5. **抢占机制**：保证资源公平性和SLA
6. **可扩展性**：支持GPU等新型资源类型

理解这些机制对于优化大数据应用的资源使用效率至关重要。

## 【引流引导】

想要深入学习大数据技术栈？我们的AI面试助手小程序提供：
- 📚 完整的HDFS、MapReduce、Spark等技术知识库
- 🤖 AI驱动的简历分析和面试指导  
- 💡 真实面试题目和详细解答
- 🎯 个性化学习路径规划

扫描下方二维码，开启你的大数据学习之旅！让AI助手帮你在技术面试中脱颖而出！

*专业的技术，简单的学习方式*