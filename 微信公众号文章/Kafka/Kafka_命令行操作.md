# Kafka命令行操作（了解）

## 【问题】
命令行操作（了解）

## 【答案】

### 快速回答（3-5分钟总结）

Kafka提供了丰富的命令行工具来管理集群、主题、生产者和消费者。主要包括：
- **主题管理**：创建、删除、查看主题信息
- **生产消费**：命令行生产者和消费者工具
- **集群管理**：查看集群状态、配置管理
- **性能测试**：内置的性能测试工具

这些命令行工具位于Kafka安装目录的`bin/`文件夹下，是日常运维和开发调试的重要工具。

### 详细解释

Kafka提供了一套完整的命令行工具集，让开发者和运维人员能够方便地管理Kafka集群。以下是最常用的命令行操作：

#### 1. 主题（Topic）管理

**创建主题**
```bash
# 创建一个名为test-topic的主题，3个分区，副本因子为1
kafka-topics.sh --create \
  --topic test-topic \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092
```

**查看主题列表**
```bash
# 列出所有主题
kafka-topics.sh --list --bootstrap-server localhost:9092
```

**查看主题详细信息**
```bash
# 查看特定主题的详细信息
kafka-topics.sh --describe \
  --topic test-topic \
  --bootstrap-server localhost:9092
```

**删除主题**
```bash
# 删除主题（需要在server.properties中设置delete.topic.enable=true）
kafka-topics.sh --delete \
  --topic test-topic \
  --bootstrap-server localhost:9092
```

**修改主题配置**
```bash
# 增加分区数（只能增加，不能减少）
kafka-topics.sh --alter \
  --topic test-topic \
  --partitions 5 \
  --bootstrap-server localhost:9092
```

#### 2. 生产者（Producer）操作

**命令行生产者**
```bash
# 启动命令行生产者，向test-topic发送消息
kafka-console-producer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092

# 带Key的生产者
kafka-console-producer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --property "key.separator=:" \
  --property "parse.key=true"
```

#### 3. 消费者（Consumer）操作

**命令行消费者**
```bash
# 从最新位置开始消费
kafka-console-consumer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092

# 从头开始消费所有消息
kafka-console-consumer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --from-beginning

# 显示Key和Value
kafka-console-consumer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --property print.key=true \
  --property key.separator=":"
```

**消费者组管理**
```bash
# 查看消费者组列表
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --list

# 查看特定消费者组的详细信息
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group my-group \
  --describe

# 重置消费者组的偏移量
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group my-group \
  --topic test-topic \
  --reset-offsets \
  --to-earliest \
  --execute
```

#### 4. 集群管理

**查看集群信息**
```bash
# 查看集群中的broker信息
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# 查看集群配置
kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type brokers \
  --describe
```

**配置管理**
```bash
# 查看主题配置
kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name test-topic \
  --describe

# 修改主题配置
kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name test-topic \
  --alter \
  --add-config retention.ms=86400000
```

#### 5. 性能测试工具

**生产者性能测试**
```bash
# 测试生产者性能
kafka-producer-perf-test.sh \
  --topic test-topic \
  --num-records 100000 \
  --record-size 1024 \
  --throughput 10000 \
  --producer-props bootstrap.servers=localhost:9092
```

**消费者性能测试**
```bash
# 测试消费者性能
kafka-consumer-perf-test.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --messages 100000
```

#### 6. 日志和偏移量管理

**查看日志段信息**
```bash
# 查看日志段的详细信息
kafka-log-dirs.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --json
```

**偏移量管理**
```bash
# 查看主题的最早和最新偏移量
kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic test-topic \
  --time -1  # -1表示最新，-2表示最早
```

#### 7. 实用技巧

**1. 监控消息流**
```bash
# 实时监控主题的消息流
kafka-console-consumer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --property print.timestamp=true \
  --property print.key=true \
  --property print.value=true
```

**2. 批量操作**
```bash
# 创建多个主题
for i in {1..5}; do
  kafka-topics.sh --create \
    --topic test-topic-$i \
    --partitions 3 \
    --replication-factor 1 \
    --bootstrap-server localhost:9092
done
```

**3. 数据导入导出**
```bash
# 从文件导入数据
kafka-console-producer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 < input.txt

# 导出数据到文件
kafka-console-consumer.sh \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --from-beginning > output.txt
```

#### 8. 常见参数说明

- `--bootstrap-server`：Kafka集群地址
- `--topic`：主题名称
- `--partitions`：分区数量
- `--replication-factor`：副本因子
- `--from-beginning`：从头开始消费
- `--group`：消费者组名称
- `--describe`：显示详细信息
- `--list`：列出信息
- `--create`：创建操作
- `--delete`：删除操作
- `--alter`：修改操作

这些命令行工具是Kafka日常运维和开发中不可或缺的工具，熟练掌握它们能够大大提高工作效率，特别是在问题排查和性能调优方面。

## 【引流引导】

想要深入学习Kafka和大数据技术吗？我们的AI面试助手小程序为你准备了完整的Kafka知识体系和实战面试题库！

🔥 **AI面试助手小程序** 🔥
- 📚 完整的Kafka技术栈面试题
- 🤖 AI智能答疑，随时解决你的疑问  
- 💡 实战案例分析，提升实际应用能力
- 🎯 个性化学习路径，高效备战面试

扫描下方小程序码，开启你的大数据学习之旅！让AI助手陪伴你成为Kafka专家！

*专业的技术，贴心的服务，就在AI面试助手！*