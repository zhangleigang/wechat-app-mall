const categories = [
  { key: 'hdfs', name: 'HDFS' },
  { key: 'mr', name: 'MapReduce' },
  { key: 'yarn', name: 'YARN' },
  { key: 'kafka', name: 'Kafka' },
  { key: 'hbase', name: 'HBase' },
  { key: 'hive', name: 'Hive/数据仓库' },
  { key: 'spark', name: 'Spark' },
  { key: 'flink', name: 'Flink' },
  { key: 'skew', name: '数据倾斜' }
]

const topics = [
  { id: 'hdfs-arch', title: 'HDFS 架构与副本', summary: 'NameNode/Block 副本机制', tags: ['存储','容灾'], categoryKey: 'hdfs',
    faqs: ['HDFS 如何保证数据可靠性？','NameNode 宕机如何恢复？'],
    pitfalls: ['小文件过多导致内存压力','副本因子过高造成存储浪费'],
    examples: ['hdfs dfs -put file /path','hdfs dfsadmin -safemode get']
  },
  { id: 'mr-shuffle', title: 'MapReduce Shuffle 机制', summary: 'Partition/Sort/Spill', tags: ['批处理','性能'], categoryKey: 'mr',
    faqs: ['Combiner 何时生效？','如何缓解 Reduce 端热点？'],
    pitfalls: ['不合理的 Partition 导致倾斜','过大内存缓冲引发 OOM'],
    examples: ['job.setPartitionerClass(...)','mapreduce.task.io.sort.mb=256']
  },
  { id: 'yarn-scheduler', title: 'YARN 调度与队列', summary: 'Capacity/Fair/Scheduler', tags: ['资源管理','调度'], categoryKey: 'yarn',
    faqs: ['应用如何选择队列？','AM/Container 生命周期？'],
    pitfalls: ['队列容量配置不合理','抢占导致作业不稳定'],
    examples: ['yarn application -list','yarn queue -status default']
  },
  { id: 'kafka-eos', title: 'Kafka Exactly-once', summary: '端到端一次且仅一次', tags: ['事务','幂等'], categoryKey: 'kafka',
    faqs: ['EOS 与幂等的差异？','如何配置事务生产者？'],
    pitfalls: ['事务超时引发失败回滚','批量大小影响吞吐'],
    examples: ['enable.idempotence=true','transactional.id=my-app']
  },
  { id: 'hbase-arch', title: 'HBase 存储结构', summary: 'Region/MemStore/HFile', tags: ['列式','NoSQL'], categoryKey: 'hbase',
    faqs: ['写路径与 Compaction？','二级索引实现方式？'],
    pitfalls: ['过多小 Region 导致负载不均','写放大影响性能'],
    examples: ['hbase shell: create/put/get','hbase(main): scan \'ns:tbl\'']
  },
  { id: 'hive-cbo', title: 'Hive 优化与分区', summary: 'CBO/Bucketing/Partition', tags: ['SQL','优化'], categoryKey: 'hive',
    faqs: ['分区与分桶的适用场景？','Tez/Spark 执行差异？'],
    pitfalls: ['过细分区导致元数据膨胀','倾斜 Key 未处理引发慢查询'],
    examples: ['set hive.cbo.enable=true','partitioned table DDL 示例']
  },
  { id: 'spark-shuffle', title: 'Spark Shuffle 深入', summary: '宽依赖/磁盘与网络', tags: ['DAG','Partition'], categoryKey: 'spark',
    faqs: ['宽依赖与窄依赖区别？','AQE 对 Shuffle 的影响？'],
    pitfalls: ['不合理的并行度导致资源浪费','过度缓存引发内存压力'],
    examples: ['spark.sql.shuffle.partitions=200','rdd.persist(StorageLevel.MEMORY_ONLY)']
  },
  { id: 'flink-state', title: 'Flink 状态与检查点', summary: 'EventTime/Watermark/Checkpoint', tags: ['流处理','一致性'], categoryKey: 'flink',
    faqs: ['如何处理反压？','Exactly-once 在 Flink 如何实现？'],
    pitfalls: ['状态膨胀导致快照缓慢','不合理并发引发背压'],
    examples: ['env.enableCheckpointing(60000)','watermark 策略示例']
  },
  { id: 'skew-solutions', title: '数据倾斜识别与治理', summary: '热点 Key 重分区', tags: ['性能','诊断'], categoryKey: 'skew',
    faqs: ['如何定位倾斜来源？','SQL 层面有哪些缓解策略？'],
    pitfalls: ['过度重分区导致成本升高','误判导致优化无效'],
    examples: ['salting/随机前缀','map-side join/倾斜过滤']
  }
]

module.exports = {
  categories,
  topics
}