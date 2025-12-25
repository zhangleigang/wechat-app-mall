# 大数据ETL流程面试题解，滴滴数据团队核心经验

## 前言

ETL（Extract-Transform-Load）作为数据仓库建设的核心环节，是每个大数据工程师必须掌握的关键技能。无论是离线数据处理还是实时数据流转，ETL都扮演着数据管道的重要角色。

作为一名在ETL领域深耕8年的数据架构师，我发现很多同学对ETL的理解往往停留在简单的数据搬运，缺乏对复杂业务场景和性能优化的深入认知。

这篇文章将从以下几个方面全面解析：
- ETL基础理论与架构设计
- 数据抽取策略与增量同步
- 数据转换逻辑与质量保证
- 数据加载优化与性能调优
- 实时ETL与流式处理
- 任务调度与监控告警
- 高频面试题深度解析

**建议收藏本文，面试前重点复习！**

## 一、ETL基础理论与架构设计

### 1.1 ETL核心概念

**ETL定义：**
- **Extract（抽取）**：从源系统中提取数据
- **Transform（转换）**：对数据进行清洗、转换、聚合
- **Load（加载）**：将处理后的数据加载到目标系统

**ETL vs ELT对比：**

| 特性 | ETL | ELT |
|------|-----|-----|
| 处理位置 | ETL工具 | 目标系统 |
| 适用场景 | 传统数据仓库 | 大数据平台 |
| 数据量 | 中小规模 | 大规模 |
| 处理能力 | 有限 | 强大 |
| 实时性 | 批处理为主 | 支持实时 |
### 1.2 ETL架构设计

**传统ETL架构：**
```
源系统 -> ETL工具 -> 数据仓库 -> 数据集市 -> BI应用
```

**现代大数据ETL架构：**
```
多源数据 -> 数据采集层 -> 数据存储层 -> 数据处理层 -> 数据服务层 -> 应用层
    |           |            |            |            |           |
  RDBMS      Flume        HDFS         Spark        Hive      BI工具
  日志文件    Sqoop        HBase        Flink        Presto    API服务
  消息队列    Kafka        S3           Storm        Kylin     实时大屏
```

**分层ETL架构：**
1. **ODS层（原始数据层）**：
   - 保持源系统数据结构
   - 提供数据备份和审计
   - 支持数据重跑和回溯

2. **DWD层（明细数据层）**：
   - 数据清洗和标准化
   - 建立统一数据模型
   - 实现业务规则转换

3. **DWS层（汇总数据层）**：
   - 轻度汇总和预计算
   - 提升查询性能
   - 支持多维分析

4. **ADS层（应用数据层）**：
   - 面向具体应用场景
   - 高度聚合的指标数据
   - 直接支撑业务应用

### 1.3 ETL设计原则

**核心设计原则：**
1. **可扩展性**：支持数据量和业务的增长
2. **可维护性**：代码结构清晰，易于维护
3. **可监控性**：提供完善的监控和告警
4. **容错性**：具备故障恢复和重试机制
5. **性能优化**：合理利用计算和存储资源

## 二、数据抽取策略与增量同步

### 2.1 数据抽取策略

**全量抽取：**
```sql
-- 全量抽取示例
SELECT * FROM source_table 
WHERE date_column = '2023-12-01';
```

**增量抽取：**
```sql
-- 基于时间戳的增量抽取
SELECT * FROM source_table 
WHERE update_time > '${last_update_time}' 
  AND update_time <= '${current_time}';

-- 基于序列号的增量抽取  
SELECT * FROM source_table 
WHERE id > ${last_max_id} 
ORDER BY id;
```

**CDC（Change Data Capture）抽取：**
```java
// 使用Debezium进行CDC
@Component
public class CDCProcessor {
    
    @EventListener
    public void handleDatabaseChange(ChangeEvent event) {
        switch (event.getOperation()) {
            case INSERT:
                processInsert(event.getAfter());
                break;
            case UPDATE:
                processUpdate(event.getBefore(), event.getAfter());
                break;
            case DELETE:
                processDelete(event.getBefore());
                break;
        }
    }
}
```

### 2.2 Sqoop数据抽取

**Sqoop导入示例：**
```bash
# 全量导入
sqoop import \
  --connect jdbc:mysql://localhost:3306/test \
  --username root \
  --password password \
  --table users \
  --target-dir /user/data/users \
  --num-mappers 4

# 增量导入
sqoop import \
  --connect jdbc:mysql://localhost:3306/test \
  --username root \
  --password password \
  --table orders \
  --target-dir /user/data/orders \
  --incremental append \
  --check-column order_id \
  --last-value 1000

# 基于时间戳的增量导入
sqoop import \
  --connect jdbc:mysql://localhost:3306/test \
  --username root \
  --password password \
  --table user_behavior \
  --target-dir /user/data/user_behavior \
  --incremental lastmodified \
  --check-column update_time \
  --last-value "2023-12-01 00:00:00"
```

**Sqoop性能优化：**
```bash
# 优化参数配置
sqoop import \
  --connect jdbc:mysql://localhost:3306/test \
  --username root \
  --password password \
  --table large_table \
  --target-dir /user/data/large_table \
  --num-mappers 8 \
  --fetch-size 10000 \
  --split-by id \
  --compress \
  --compression-codec org.apache.hadoop.io.compress.SnappyCodec
```

### 2.3 实时数据采集

**Flume配置示例：**
```properties
# Agent配置
agent.sources = r1
agent.sinks = k1  
agent.channels = c1

# Source配置（监控日志文件）
agent.sources.r1.type = spooldir
agent.sources.r1.spoolDir = /var/log/app
agent.sources.r1.channels = c1

# Channel配置（内存通道）
agent.channels.c1.type = memory
agent.channels.c1.capacity = 10000
agent.channels.c1.transactionCapacity = 1000

# Sink配置（输出到HDFS）
agent.sinks.k1.type = hdfs
agent.sinks.k1.hdfs.path = /user/logs/%Y/%m/%d
agent.sinks.k1.hdfs.fileType = DataStream
agent.sinks.k1.hdfs.rollInterval = 600
agent.sinks.k1.hdfs.rollSize = 134217728
agent.sinks.k1.channel = c1
```

## 三、数据转换逻辑与质量保证

### 3.1 数据清洗

**常见数据质量问题：**
1. **空值处理**：NULL、空字符串、默认值
2. **重复数据**：完全重复、业务重复
3. **格式不一致**：日期格式、编码格式
4. **数据类型错误**：字符串中的数字、数字中的字符
5. **业务规则违反**：超出合理范围的值

**Spark数据清洗示例：**
```scala
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

// 数据清洗处理
val cleanedDF = rawDF
  // 1. 去除空值
  .filter(col("user_id").isNotNull && col("user_id") =!= "")
  
  // 2. 数据类型转换
  .withColumn("age", col("age").cast(IntegerType))
  .withColumn("amount", col("amount").cast(DoubleType))
  
  // 3. 日期格式标准化
  .withColumn("order_date", to_date(col("order_time"), "yyyy-MM-dd HH:mm:ss"))
  
  // 4. 数据范围校验
  .filter(col("age") >= 0 && col("age") <= 120)
  .filter(col("amount") >= 0)
  
  // 5. 去重处理
  .dropDuplicates("user_id", "order_id")
  
  // 6. 异常值处理
  .withColumn("amount_cleaned", 
    when(col("amount") > 100000, 100000)
    .otherwise(col("amount"))
  )
```

### 3.2 数据转换

**维度数据处理：**
```sql
-- 用户维度数据转换
WITH user_dim_transform AS (
  SELECT 
    user_id,
    user_name,
    CASE 
      WHEN age < 18 THEN '未成年'
      WHEN age BETWEEN 18 AND 35 THEN '青年'
      WHEN age BETWEEN 36 AND 60 THEN '中年'
      ELSE '老年'
    END as age_group,
    CASE 
      WHEN city IN ('北京', '上海', '广州', '深圳') THEN '一线城市'
      WHEN city IN ('杭州', '南京', '武汉', '成都') THEN '新一线城市'
      ELSE '其他城市'
    END as city_level,
    registration_date,
    CURRENT_DATE as etl_date
  FROM ods_user_info
  WHERE dt = '${bizdate}'
)
INSERT OVERWRITE TABLE dwd_user_dim PARTITION(dt='${bizdate}')
SELECT * FROM user_dim_transform;
```

**事实数据处理：**
```sql
-- 订单事实数据转换
WITH order_fact_transform AS (
  SELECT 
    o.order_id,
    o.user_id,
    o.product_id,
    o.order_amount,
    o.discount_amount,
    o.order_amount - o.discount_amount as actual_amount,
    DATE_FORMAT(o.order_time, 'yyyyMMdd') as order_date_id,
    DATE_FORMAT(o.order_time, 'HH') as order_hour,
    p.category_id,
    p.brand_id,
    u.city_id,
    CURRENT_TIMESTAMP as etl_time
  FROM ods_order_info o
  LEFT JOIN dim_product p ON o.product_id = p.product_id
  LEFT JOIN dim_user u ON o.user_id = u.user_id
  WHERE o.dt = '${bizdate}'
    AND o.order_status = 'PAID'
)
INSERT OVERWRITE TABLE dwd_order_fact PARTITION(dt='${bizdate}')
SELECT * FROM order_fact_transform;
```

### 3.3 数据质量监控

**数据质量检查框架：**
```python
class DataQualityChecker:
    
    def __init__(self, spark_session):
        self.spark = spark_session
        
    def check_completeness(self, df, columns):
        """完整性检查"""
        results = {}
        total_count = df.count()
        
        for col in columns:
            null_count = df.filter(df[col].isNull()).count()
            completeness = (total_count - null_count) / total_count
            results[col] = {
                'completeness': completeness,
                'null_count': null_count,
                'total_count': total_count
            }
        return results
    
    def check_uniqueness(self, df, key_columns):
        """唯一性检查"""
        total_count = df.count()
        distinct_count = df.select(*key_columns).distinct().count()
        
        return {
            'uniqueness': distinct_count / total_count,
            'duplicate_count': total_count - distinct_count,
            'total_count': total_count
        }
    
    def check_validity(self, df, column, valid_values):
        """有效性检查"""
        total_count = df.count()
        valid_count = df.filter(df[column].isin(valid_values)).count()
        
        return {
            'validity': valid_count / total_count,
            'invalid_count': total_count - valid_count,
            'total_count': total_count
        }
    
    def check_consistency(self, df1, df2, join_keys):
        """一致性检查"""
        joined_df = df1.join(df2, join_keys, 'left_anti')
        inconsistent_count = joined_df.count()
        total_count = df1.count()
        
        return {
            'consistency': (total_count - inconsistent_count) / total_count,
            'inconsistent_count': inconsistent_count,
            'total_count': total_count
        }
```

## 四、数据加载优化与性能调优

### 4.1 Hive数据加载优化

**分区表优化：**
```sql
-- 动态分区配置
SET hive.exec.dynamic.partition=true;
SET hive.exec.dynamic.partition.mode=nonstrict;
SET hive.exec.max.dynamic.partitions=2000;
SET hive.exec.max.dynamic.partitions.pernode=1000;

-- 动态分区插入
INSERT OVERWRITE TABLE target_table PARTITION(year, month, day)
SELECT 
    col1, col2, col3,
    YEAR(date_col) as year,
    MONTH(date_col) as month,
    DAY(date_col) as day
FROM source_table
WHERE dt = '${bizdate}';
```

**文件格式优化：**
```sql
-- 使用ORC格式优化存储和查询
CREATE TABLE optimized_table (
    user_id STRING,
    order_amount DECIMAL(10,2),
    order_time TIMESTAMP
)
STORED AS ORC
TBLPROPERTIES (
    'orc.compress'='SNAPPY',
    'orc.stripe.size'='268435456',
    'orc.row.index.stride'='10000'
);
```

### 4.2 Spark性能优化

**资源配置优化：**
```bash
spark-submit \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 20 \
  --executor-cores 4 \
  --executor-memory 8g \
  --driver-memory 4g \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.sql.adaptive.coalescePartitions.enabled=true \
  --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
  etl_job.py
```

**数据倾斜优化：**
```scala
// 处理数据倾斜的策略
val skewedDF = originalDF
  .repartition(200, col("partition_key"))  // 重新分区
  .cache()  // 缓存中间结果

// 使用广播Join处理小表关联
val broadcastDF = broadcast(smallDF)
val joinedDF = largeDF.join(broadcastDF, "join_key")

// 加盐处理热点数据
val saltedDF = skewedDF
  .withColumn("salt", (rand() * 100).cast("int"))
  .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))
```

### 4.3 实时数据加载

**Kafka到Hive的实时ETL：**
```scala
import org.apache.spark.sql.streaming._

// 从Kafka读取数据流
val kafkaDF = spark
  .readStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "localhost:9092")
  .option("subscribe", "user_behavior")
  .load()

// 数据转换
val transformedDF = kafkaDF
  .select(from_json(col("value"), schema).as("data"))
  .select("data.*")
  .withColumn("etl_time", current_timestamp())
  .withColumn("date", date_format(col("event_time"), "yyyy-MM-dd"))

// 写入Hive表
val query = transformedDF
  .writeStream
  .format("hive")
  .option("table", "dwd_user_behavior")
  .option("checkpointLocation", "/tmp/checkpoint")
  .partitionBy("date")
  .trigger(Trigger.ProcessingTime("5 minutes"))
  .start()

query.awaitTermination()
```

## 五、任务调度与监控告警

### 5.1 Airflow任务调度

**DAG定义示例：**
```python
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.python_operator import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data_team',
    'depends_on_past': False,
    'start_date': datetime(2023, 12, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'daily_etl_pipeline',
    default_args=default_args,
    description='Daily ETL Pipeline',
    schedule_interval='0 2 * * *',  # 每天凌晨2点执行
    catchup=False
)

# 数据抽取任务
extract_task = BashOperator(
    task_id='extract_data',
    bash_command='sqoop import --connect jdbc:mysql://localhost/db --table users --target-dir /data/users/{{ ds }}',
    dag=dag
)

# 数据转换任务
transform_task = BashOperator(
    task_id='transform_data',
    bash_command='spark-submit --class ETLJob etl.jar {{ ds }}',
    dag=dag
)

# 数据质量检查
def data_quality_check(**context):
    # 实现数据质量检查逻辑
    pass

quality_check_task = PythonOperator(
    task_id='quality_check',
    python_callable=data_quality_check,
    dag=dag
)

# 数据加载任务
load_task = BashOperator(
    task_id='load_data',
    bash_command='hive -f load_data.hql',
    dag=dag
)

# 定义任务依赖关系
extract_task >> transform_task >> quality_check_task >> load_task
```

### 5.2 监控告警系统

**ETL监控指标：**
```python
class ETLMonitor:
    
    def __init__(self):
        self.metrics = {}
    
    def collect_metrics(self, job_name, start_time, end_time, record_count, error_count):
        """收集ETL作业指标"""
        duration = end_time - start_time
        
        self.metrics[job_name] = {
            'duration': duration.total_seconds(),
            'record_count': record_count,
            'error_count': error_count,
            'error_rate': error_count / record_count if record_count > 0 else 0,
            'throughput': record_count / duration.total_seconds() if duration.total_seconds() > 0 else 0,
            'timestamp': end_time
        }
    
    def check_sla(self, job_name, sla_threshold):
        """检查SLA违规"""
        if job_name in self.metrics:
            duration = self.metrics[job_name]['duration']
            if duration > sla_threshold:
                self.send_alert(f"Job {job_name} exceeded SLA: {duration}s > {sla_threshold}s")
    
    def check_data_quality(self, job_name, quality_threshold):
        """检查数据质量"""
        if job_name in self.metrics:
            error_rate = self.metrics[job_name]['error_rate']
            if error_rate > quality_threshold:
                self.send_alert(f"Job {job_name} data quality issue: error rate {error_rate}")
    
    def send_alert(self, message):
        """发送告警"""
        # 实现告警发送逻辑（邮件、短信、钉钉等）
        print(f"ALERT: {message}")
```

## 六、面试高频问题解析

### 问题1：如何设计一个高效的ETL流程？

**标准答案：**
设计高效ETL流程需要考虑以下几个方面：
1. **需求分析**：明确数据源、目标和业务规则
2. **架构设计**：选择合适的技术栈和处理模式
3. **性能优化**：并行处理、资源配置、存储优化
4. **质量保证**：数据校验、异常处理、监控告警
5. **运维管理**：任务调度、故障恢复、版本管理

**加分回答：**
在设计电商平台的ETL流程时，我采用了以下策略：

**分层架构设计**：
- ODS层：保持原始数据，支持重跑
- DWD层：统一数据模型，实现业务规则
- DWS层：预聚合常用指标，提升查询性能
- ADS层：面向应用的数据集市

**增量处理策略**：
```sql
-- 基于时间戳的增量处理
INSERT OVERWRITE TABLE dwd_order_info PARTITION(dt='${bizdate}')
SELECT 
    order_id, user_id, product_id, order_amount,
    order_time, status, create_time
FROM ods_order_info 
WHERE dt = '${bizdate}'
  AND (create_time >= '${bizdate} 00:00:00' 
       OR update_time >= '${bizdate} 00:00:00');
```

**性能优化措施**：
- 使用分区表减少扫描数据量
- 采用列式存储格式（ORC/Parquet）
- 合理设置并行度和资源配置
- 实现数据倾斜处理策略

**质量保证体系**：
- 建立数据质量检查规则
- 实现异常数据隔离和处理
- 设置关键指标监控和告警
- 定期进行数据一致性校验

### 问题2：如何处理ETL过程中的数据质量问题？

**标准答案：**
数据质量问题处理包括：
1. **预防**：源头控制、规范定义、格式校验
2. **检测**：质量规则、异常监控、统计分析
3. **处理**：清洗转换、异常隔离、人工审核
4. **改进**：根本原因分析、流程优化、规则完善

**加分回答：**
在我们的用户行为分析项目中，建立了完整的数据质量管理体系：

**质量检查规则**：
```python
# 数据质量检查配置
quality_rules = {
    'completeness': {
        'user_id': {'null_rate': 0.0},
        'event_time': {'null_rate': 0.0}
    },
    'validity': {
        'age': {'min': 0, 'max': 120},
        'amount': {'min': 0, 'max': 100000}
    },
    'consistency': {
        'user_count': {'tolerance': 0.05}  # 5%容忍度
    }
}
```

**异常处理策略**：
- 轻微异常：自动修复（如格式转换、默认值填充）
- 严重异常：隔离处理（写入异常表，人工审核）
- 系统异常：任务失败，发送告警

**质量监控大盘**：
- 实时监控数据质量指标
- 设置质量阈值和告警规则
- 提供质量趋势分析和报告
- 支持质量问题的快速定位和处理

### 问题3：增量数据同步有哪些策略？

**标准答案：**
增量数据同步的主要策略：
1. **基于时间戳**：利用更新时间字段识别变更数据
2. **基于序列号**：使用自增ID或版本号标识新数据
3. **基于触发器**：数据库触发器记录变更日志
4. **基于CDC**：捕获数据库变更日志进行同步

**加分回答：**
在不同场景下，我们采用了不同的增量同步策略：

**时间戳策略**（适用于有更新时间字段的表）：
```sql
-- 增量抽取逻辑
SELECT * FROM source_table 
WHERE update_time > '${last_sync_time}' 
  AND update_time <= '${current_sync_time}'
ORDER BY update_time;
```

**CDC策略**（适用于实时性要求高的场景）：
```java
// 使用Debezium监听MySQL binlog
@Component
public class MySQLCDCListener {
    
    @EventListener
    public void handleInsert(InsertEvent event) {
        // 处理新增数据
        processNewRecord(event.getAfter());
    }
    
    @EventListener  
    public void handleUpdate(UpdateEvent event) {
        // 处理更新数据
        processUpdatedRecord(event.getBefore(), event.getAfter());
    }
    
    @EventListener
    public void handleDelete(DeleteEvent event) {
        // 处理删除数据
        processDeletedRecord(event.getBefore());
    }
}
```

**混合策略**（结合批量和实时）：
- 实时层：使用CDC捕获变更，提供最新数据
- 批量层：定期全量校验，保证数据一致性
- 服务层：合并实时和批量结果，提供统一查询

### 问题4：如何优化大数据ETL的性能？

**标准答案：**
ETL性能优化的主要方法：
1. **并行处理**：增加并行度，充分利用集群资源
2. **数据分区**：合理分区减少数据扫描量
3. **存储优化**：选择合适的文件格式和压缩算法
4. **缓存策略**：缓存中间结果，避免重复计算
5. **资源配置**：优化内存、CPU、网络等资源配置

**加分回答：**
在优化日处理TB级数据的ETL任务时，我采用了以下策略：

**Spark调优**：
```scala
// 资源配置优化
val spark = SparkSession.builder()
  .appName("ETL_Optimization")
  .config("spark.sql.adaptive.enabled", "true")
  .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
  .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
  .config("spark.sql.execution.arrow.pyspark.enabled", "true")
  .getOrCreate()

// 数据倾斜处理
val optimizedDF = originalDF
  .repartition(col("partition_key"))
  .cache()
```

**存储优化**：
```sql
-- 使用分区表和列式存储
CREATE TABLE optimized_fact_table (
    user_id STRING,
    event_type STRING,
    event_time TIMESTAMP,
    properties MAP<STRING, STRING>
)
USING DELTA
PARTITIONED BY (date STRING)
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);
```

**Pipeline优化**：
- 使用流水线并行处理多个步骤
- 实现智能的任务依赖管理
- 采用增量处理减少数据处理量
- 建立数据血缘关系，支持影响分析

**效果**：
- 处理时间从8小时优化到2小时
- 资源利用率提升60%
- 数据延迟从T+1优化到T+4小时

## 七、实际应用场景

### 场景1：电商平台数据仓库ETL

**业务需求：**
构建电商平台的数据仓库，支持用户分析、商品分析、运营分析等业务场景。

**技术方案：**
```python
# 电商ETL流水线
class EcommerceETLPipeline:
    
    def __init__(self):
        self.spark = SparkSession.builder.appName("EcommerceETL").getOrCreate()
    
    def extract_order_data(self, date):
        """抽取订单数据"""
        return self.spark.sql(f"""
            SELECT order_id, user_id, product_id, order_amount, 
                   order_time, status, create_time, update_time
            FROM ods_order_info 
            WHERE dt = '{date}'
        """)
    
    def transform_order_data(self, order_df):
        """转换订单数据"""
        return order_df.select(
            col("order_id"),
            col("user_id"),
            col("product_id"),
            col("order_amount").cast("decimal(10,2)"),
            to_timestamp(col("order_time")).alias("order_timestamp"),
            date_format(col("order_time"), "yyyyMMdd").alias("order_date_id"),
            hour(col("order_time")).alias("order_hour"),
            when(col("status") == "PAID", 1).otherwise(0).alias("is_paid"),
            current_timestamp().alias("etl_time")
        )
    
    def load_order_data(self, transformed_df, date):
        """加载订单数据"""
        transformed_df.write \
            .mode("overwrite") \
            .partitionBy("order_date_id") \
            .saveAsTable(f"dwd_order_fact")
    
    def run_daily_etl(self, date):
        """执行日常ETL流程"""
        # 1. 数据抽取
        order_df = self.extract_order_data(date)
        
        # 2. 数据转换
        transformed_df = self.transform_order_data(order_df)
        
        # 3. 数据质量检查
        self.check_data_quality(transformed_df)
        
        # 4. 数据加载
        self.load_order_data(transformed_df, date)
        
        # 5. 生成汇总数据
        self.generate_summary_data(date)
```

### 场景2：实时用户行为分析ETL

**业务需求：**
实时处理用户行为数据，支持实时推荐、实时监控等业务需求。

**技术方案：**
```scala
// 实时ETL流处理
object RealtimeUserBehaviorETL {
  
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("RealtimeUserBehaviorETL")
      .getOrCreate()
    
    import spark.implicits._
    
    // 从Kafka读取实时数据
    val kafkaDF = spark
      .readStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "localhost:9092")
      .option("subscribe", "user_behavior")
      .option("startingOffsets", "latest")
      .load()
    
    // 解析JSON数据
    val behaviorDF = kafkaDF
      .select(from_json(col("value").cast("string"), behaviorSchema).as("data"))
      .select("data.*")
      .withColumn("event_hour", hour(col("event_time")))
      .withColumn("event_date", date_format(col("event_time"), "yyyy-MM-dd"))
    
    // 实时聚合计算
    val aggregatedDF = behaviorDF
      .groupBy(
        window(col("event_time"), "5 minutes"),
        col("user_id"),
        col("event_type")
      )
      .agg(
        count("*").as("event_count"),
        sum("duration").as("total_duration"),
        max("event_time").as("last_event_time")
      )
    
    // 写入多个目标
    val query = aggregatedDF.writeStream
      .foreachBatch { (batchDF: DataFrame, batchId: Long) =>
        // 写入Hive表
        batchDF.write
          .mode("append")
          .insertInto("dws_user_behavior_realtime")
        
        // 写入Redis缓存
        batchDF.foreachPartition(writeToRedis)
        
        // 写入Elasticsearch
        batchDF.write
          .format("es")
          .option("es.resource", "user_behavior/doc")
          .mode("append")
          .save()
      }
      .trigger(Trigger.ProcessingTime("1 minute"))
      .start()
    
    query.awaitTermination()
  }
}
```

## 总结

通过本文的全面解析，相信大家对大数据ETL有了更深入的理解。在面试中，除了掌握基础概念，更要能够：

1. **架构设计能力**：能够设计完整的ETL架构和数据流程
2. **技术选型判断**：根据业务需求选择合适的ETL工具和策略
3. **性能优化经验**：掌握各种性能优化技巧和最佳实践
4. **问题解决能力**：具备数据质量、性能调优等问题的解决能力

## 面试准备建议

为了帮助大家更好地准备大数据面试，我开发了一款**AI面试助手小程序**，包含：

✅ **ETL专项题库**：涵盖数据抽取、转换、加载等核心知识点
✅ **AI岗位分析**：智能解析ETL相关JD，预测面试重点  
✅ **简历优化建议**：突出ETL项目经验和技术深度
✅ **面试经验分享**：真实的ETL面试案例和解题思路

**扫描下方小程序码，免费体验核心功能！**

![AI面试助手小程序码](https://api.feelnow.cn/static/images/wechat-qrcode.png)

如果觉得本文对你有帮助，欢迎**点赞、收藏、转发**，让更多同学受益！

有任何ETL相关问题欢迎在评论区讨论，我会及时回复大家。

---

**关于作者**：数据架构师，8年ETL实战经验，曾就职于滴滴，专注于大数据架构设计和ETL优化。

**往期精彩**：
- [Spark面试必考知识点全解析]
- [数据仓库建模面试重点梳理]
- [Kafka消息队列面试题精讲]