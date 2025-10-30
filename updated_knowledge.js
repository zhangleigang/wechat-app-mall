const categories = [
  {
    "key": "hdfs",
    "name": "HDFS"
  },
  {
    "key": "mr",
    "name": "MapReduce"
  },
  {
    "key": "yarn",
    "name": "Yarn"
  },
  {
    "key": "kafka",
    "name": "Kafka"
  },
  {
    "key": "hbase",
    "name": "HBase"
  },
  {
    "key": "hive",
    "name": "Hive"
  },
  {
    "key": "spark",
    "name": "Spark"
  },
  {
    "key": "flink",
    "name": "Flink"
  },
  {
    "key": "数据仓库",
    "name": "数据仓库"
  },
  {
    "key": "skew",
    "name": "数据倾斜"
  }
]

const topics = [
  {
    "id": "hdfs-topic-1",
    "title": "HDFS 常见问题 1",
    "summary": "HDFS的架构",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "HDFS的架构",
      "HDFS的读写流程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hdfs-topic-2",
    "title": "HDFS 常见问题 2",
    "summary": "Secondary NameNode了解吗，它的工作机制是怎样的",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "Secondary NameNode了解吗，它的工作机制是怎样的",
      "简述Hadoop1.0、2.0、3.0的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hdfs-topic-3",
    "title": "HDFS 常见问题 3",
    "summary": "HDFS的读写流程",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "HDFS的读写流程",
      "HDFS中，文件为什么以block块的方式存储"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hdfs-topic-4",
    "title": "HDFS 常见问题 4",
    "summary": "在NameNode HA中，会出现脑裂问题吗？怎么解决脑裂",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "在NameNode HA中，会出现脑裂问题吗？怎么解决脑裂",
      "简述hadoop压缩和解压缩的框架"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hdfs-topic-5",
    "title": "HDFS 常见问题 5",
    "summary": "Secondary NameNode了解吗，它的工作机制是怎样的",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "Secondary NameNode了解吗，它的工作机制是怎样的",
      "在上传文件的时候，其中一个DataNode突然挂掉了怎么办"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hdfs-topic-6",
    "title": "HDFS 常见问题 6",
    "summary": "介绍namenode宕机的数据恢复过程",
    "tags": [
      "HDFS",
      "面试"
    ],
    "categoryKey": "hdfs",
    "faqs": [
      "介绍namenode宕机的数据恢复过程",
      "NameNode在启动的时候会做哪些操作"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "mr-topic-7",
    "title": "MapReduce 常见问题 1",
    "summary": "简述MapReduce整个流程",
    "tags": [
      "MapReduce",
      "面试"
    ],
    "categoryKey": "mr",
    "faqs": [
      "简述MapReduce整个流程",
      "join原理"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "mr-topic-8",
    "title": "MapReduce 常见问题 2",
    "summary": "为什么MapReduce比Spark慢",
    "tags": [
      "MapReduce",
      "面试"
    ],
    "categoryKey": "mr",
    "faqs": [
      "为什么MapReduce比Spark慢",
      "简述MapReduce整个流程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "mr-topic-9",
    "title": "MapReduce 常见问题 3",
    "summary": "join原理",
    "tags": [
      "MapReduce",
      "面试"
    ],
    "categoryKey": "mr",
    "faqs": [
      "join原理",
      "文件切片相关问题"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "mr-topic-10",
    "title": "MapReduce 常见问题 4",
    "summary": "全排序",
    "tags": [
      "MapReduce",
      "面试"
    ],
    "categoryKey": "mr",
    "faqs": [
      "全排序",
      "MapReduce实现TopK算法"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "yarn-topic-11",
    "title": "Yarn 常见问题 1",
    "summary": "Yarn的任务提交流程是怎样的",
    "tags": [
      "Yarn",
      "面试"
    ],
    "categoryKey": "yarn",
    "faqs": [
      "Yarn的任务提交流程是怎样的",
      "Yarn的资源调度机制"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "yarn-topic-12",
    "title": "Yarn 常见问题 2",
    "summary": "yarn的任务提交流程是怎样的",
    "tags": [
      "Yarn",
      "面试"
    ],
    "categoryKey": "yarn",
    "faqs": [
      "yarn的任务提交流程是怎样的",
      "yarn的资源调度的三种模型"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "yarn-topic-13",
    "title": "Yarn 常见问题 3",
    "summary": "任务的推测执行（spark UI见过）",
    "tags": [
      "Yarn",
      "面试"
    ],
    "categoryKey": "yarn",
    "faqs": [
      "任务的推测执行（spark UI见过）"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-14",
    "title": "Kafka 常见问题 1",
    "summary": "简述Kafka的架构",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      "简述Kafka的架构",
      "简述Kafka的分区策略"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-15",
    "title": "Kafka 常见问题 2",
    "summary": "Kafka中的数据是有序的吗，如何保证有序",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      "Kafka中的数据是有序的吗，如何保证有序",
      "简述Kafka消息的存储机制"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-16",
    "title": "Kafka 常见问题 3",
    "summary": "Kafka消费方式",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      "Kafka消费方式",
      "Kafka的ISR机制是什么"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-17",
    "title": "Kafka 常见问题 4",
    "summary": " 简述kafka的架构",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      " 简述kafka的架构",
      " 命令行操作（了解）"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-18",
    "title": "Kafka 常见问题 5",
    "summary": " 简述kafka的分区策略",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      " 简述kafka的分区策略",
      " kafka是如何保证数据不丢失和数据不重复"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-19",
    "title": "Kafka 常见问题 6",
    "summary": " zookeeper在kafka中的作用有哪些",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      " zookeeper在kafka中的作用有哪些",
      " broker工作流程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-20",
    "title": "Kafka 常见问题 7",
    "summary": " kafka的数据是放在磁盘上还是内存上，为什么速度会快",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      " kafka的数据是放在磁盘上还是内存上，为什么速度会快",
      " kafka消费方式"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "kafka-topic-21",
    "title": "Kafka 常见问题 8",
    "summary": " 你知道Kafka单条日志传输大小吗",
    "tags": [
      "Kafka",
      "面试"
    ],
    "categoryKey": "kafka",
    "faqs": [
      " 你知道Kafka单条日志传输大小吗",
      " Kafka为什么同一个消费者组的消费者不能消费相同的分区"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hbase-topic-22",
    "title": "HBase 常见问题 1",
    "summary": "HBase和Hive的区别",
    "tags": [
      "HBase",
      "面试"
    ],
    "categoryKey": "hbase",
    "faqs": [
      "HBase和Hive的区别",
      "简述HBase的读写流程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hbase-topic-23",
    "title": "HBase 常见问题 2",
    "summary": "HBase中compact用途是什么，什么时候触发，分为哪两种，有什么区别",
    "tags": [
      "HBase",
      "面试"
    ],
    "categoryKey": "hbase",
    "faqs": [
      "HBase中compact用途是什么，什么时候触发，分为哪两种，有什么区别",
      "热点现象怎么产生的，以及解决方法有哪些"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hbase-topic-24",
    "title": "HBase 常见问题 3",
    "summary": " 简述HBase的数据模型",
    "tags": [
      "HBase",
      "面试"
    ],
    "categoryKey": "hbase",
    "faqs": [
      " 简述HBase的数据模型",
      " HBase和hive的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hbase-topic-25",
    "title": "HBase 常见问题 4",
    "summary": " 简述HBase的读写流程",
    "tags": [
      "HBase",
      "面试"
    ],
    "categoryKey": "hbase",
    "faqs": [
      " 简述HBase的读写流程",
      " HBase在写过程中的region的split时机"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hbase-topic-26",
    "title": "HBase 常见问题 5",
    "summary": " 热点现象怎么产生的，以及解决方法有哪些",
    "tags": [
      "HBase",
      "面试"
    ],
    "categoryKey": "hbase",
    "faqs": [
      " 热点现象怎么产生的，以及解决方法有哪些",
      " 说一下HBase的rowkey设计原则"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-27",
    "title": "Hive 常见问题 1",
    "summary": "简述Hive",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      "简述Hive",
      "Hive和传统数据库之间的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-28",
    "title": "Hive 常见问题 2",
    "summary": "Hive的join底层实现",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      "Hive的join底层实现",
      "Order By和Sort By的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-29",
    "title": "Hive 常见问题 3",
    "summary": "自定义过UDF、UDTF函数吗",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      "自定义过UDF、UDTF函数吗",
      "Hive小文件过多怎么办"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-30",
    "title": "Hive 常见问题 4",
    "summary": "Hive的元数据存储在哪里",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      "Hive的元数据存储在哪里",
      " 简述hive"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-31",
    "title": "Hive 常见问题 5",
    "summary": " hive和传统数据库之间的区别",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      " hive和传统数据库之间的区别",
      " hive的内部表和外部表的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-32",
    "title": "Hive 常见问题 6",
    "summary": " 内连接、左外连接、右外连接的区别",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      " 内连接、左外连接、右外连接的区别",
      " hive的join底层实现"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-33",
    "title": "Hive 常见问题 7",
    "summary": " 行转列和列转行函数",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      " 行转列和列转行函数",
      " grouping_sets、cube和rollup"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-34",
    "title": "Hive 常见问题 8",
    "summary": " hive3的新特性有了解过吗",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      " hive3的新特性有了解过吗",
      " hive小文件过多怎么办"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "hive-topic-35",
    "title": "Hive 常见问题 9",
    "summary": " 常用函数的补充",
    "tags": [
      "Hive",
      "面试"
    ],
    "categoryKey": "hive",
    "faqs": [
      " 常用函数的补充"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-36",
    "title": "Spark 常见问题 1",
    "summary": "简述Hadoop和Spark的不同点（为什么Spark更快）",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      "简述Hadoop和Spark的不同点（为什么Spark更快）",
      "简述Spark的shuffle过程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-37",
    "title": "Spark 常见问题 2",
    "summary": "Application、Job、Stage、Task之间的关系",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      "Application、Job、Stage、Task之间的关系",
      "Spark常见的算子介绍（10个以上）"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-38",
    "title": "Spark 常见问题 3",
    "summary": "宽依赖和窄依赖之间的区别",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      "宽依赖和窄依赖之间的区别",
      "Spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-39",
    "title": "Spark 常见问题 4",
    "summary": "SparkSQL的三种join实现",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      "SparkSQL的三种join实现",
      "SparkStreaming窗口函数的原理"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-40",
    "title": "Spark 常见问题 5",
    "summary": " 谈谈你对RDD的理解",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " 谈谈你对RDD的理解",
      " 简述spark的shuffle过程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-41",
    "title": "Spark 常见问题 6",
    "summary": " spark driver的作用，以及client模式和cluster模式的区别",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " spark driver的作用，以及client模式和cluster模式的区别",
      " 你知道Application、Job、Stage、Task他们之间的关系吗"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-42",
    "title": "Spark 常见问题 7",
    "summary": " 简述map和mapPartitions的区别",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " 简述map和mapPartitions的区别",
      " 你知道重分区的相关算子吗"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-43",
    "title": "Spark 常见问题 8",
    "summary": " 简述groupByKey和reduceByKey的区别",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " 简述groupByKey和reduceByKey的区别",
      " 简述reduceByKey、foldByKey、aggregateByKey、combineByKey的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-44",
    "title": "Spark 常见问题 9",
    "summary": " spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么",
      " 简述spark的容错机制"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-45",
    "title": "Spark 常见问题 10",
    "summary": " spark调优",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " spark调优",
      " 谈一谈RDD,DataFrame,DataSet的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-46",
    "title": "Spark 常见问题 11",
    "summary": " sparksql的三种join实现",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " sparksql的三种join实现",
      " 简单介绍下sparkstreaming"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "spark-topic-47",
    "title": "Spark 常见问题 12",
    "summary": " SparkStreaming有哪几种方式消费Kafka中的数据，它们之间的区别是什么",
    "tags": [
      "Spark",
      "面试"
    ],
    "categoryKey": "spark",
    "faqs": [
      " SparkStreaming有哪几种方式消费Kafka中的数据，它们之间的区别是什么",
      " 说一下你知道的DStream转换和输出原语"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-48",
    "title": "Flink 常见问题 1",
    "summary": "简单介绍一下Flink",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      "简单介绍一下Flink",
      "Flink和SparkStreaming区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-49",
    "title": "Flink 常见问题 2",
    "summary": "Connect算子和Union算子的区别",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      "Connect算子和Union算子的区别",
      "Flink的时间语义有哪几种"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-50",
    "title": "Flink 常见问题 3",
    "summary": "Flink对于迟到或者乱序数据是怎么处理的",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      "Flink对于迟到或者乱序数据是怎么处理的",
      "Flink中，有哪几种类型的状态，你知道状态后端吗"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-51",
    "title": "Flink 常见问题 4",
    "summary": " 简单介绍一下Flink",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " 简单介绍一下Flink",
      " Flink和SparkStreaming区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-52",
    "title": "Flink 常见问题 5",
    "summary": " Flink的运行依赖于hadoop组件吗",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " Flink的运行依赖于hadoop组件吗",
      " Flink集群有哪些角色？各自有什么作用"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-53",
    "title": "Flink 常见问题 6",
    "summary": " max算子和maxBy算子的区别",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " max算子和maxBy算子的区别",
      " Connect算子和Union算子的区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-54",
    "title": "Flink 常见问题 7",
    "summary": " 谈一谈你对watermark的理解",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " 谈一谈你对watermark的理解",
      " Flink对于迟到或者乱序数据是怎么处理的"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-55",
    "title": "Flink 常见问题 8",
    "summary": " Flink是如何做容错的",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " Flink是如何做容错的",
      " Flink是如何保证Exactly-once语义的"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "flink-topic-56",
    "title": "Flink 常见问题 9",
    "summary": " Flink是如何支持批流一体的",
    "tags": [
      "Flink",
      "面试"
    ],
    "categoryKey": "flink",
    "faqs": [
      " Flink是如何支持批流一体的",
      " 你用过Flink CEP吗，简单介绍一下"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-57",
    "title": "数据仓库 常见问题 1",
    "summary": "为什么要对数据仓库分层",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      "为什么要对数据仓库分层",
      "数据仓库建模的方法有哪些"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-58",
    "title": "数据仓库 常见问题 2",
    "summary": "维度建模中表的类型",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      "维度建模中表的类型",
      "事实表的设计过程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-59",
    "title": "数据仓库 常见问题 3",
    "summary": " 数据仓库是什么",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 数据仓库是什么",
      " 数据仓库和数据库有什么区别"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-60",
    "title": "数据仓库 常见问题 4",
    "summary": " 为什么需要数据建模",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 为什么需要数据建模",
      " 经典的数据仓库建模方法论有哪些"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-61",
    "title": "数据仓库 常见问题 5",
    "summary": " 派生指标的种类",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 派生指标的种类",
      " 经典数仓分层架构"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-62",
    "title": "数据仓库 常见问题 6",
    "summary": " 模型实施的具体步骤",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 模型实施的具体步骤",
      " 维度建模有哪几种模型"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-63",
    "title": "数据仓库 常见问题 7",
    "summary": " 维度表的设计过程",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 维度表的设计过程",
      " 维度表的设计中有哪些值得注意的地方"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-64",
    "title": "数据仓库 常见问题 8",
    "summary": " 如何处理维度的变化",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 如何处理维度的变化",
      " 事实表设计的八大原则"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-65",
    "title": "数据仓库 常见问题 9",
    "summary": " 事实表有哪几种类型",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 事实表有哪几种类型",
      " 多事务事实表如何对事实进行处理"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "数据仓库-topic-66",
    "title": "数据仓库 常见问题 10",
    "summary": " 周期快照事实表的设计过程",
    "tags": [
      "数据仓库",
      "面试"
    ],
    "categoryKey": "数据仓库",
    "faqs": [
      " 周期快照事实表的设计过程",
      " 累计快照事实表的设计过程"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "skew-topic-67",
    "title": "数据倾斜 常见问题 1",
    "summary": "数据倾斜的定义和原因",
    "tags": [
      "数据倾斜",
      "面试"
    ],
    "categoryKey": "skew",
    "faqs": [
      "数据倾斜的定义和原因",
      "MapReduce数据倾斜的解决方法"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  },
  {
    "id": "skew-topic-68",
    "title": "数据倾斜 常见问题 2",
    "summary": "Hive数据倾斜的解决方法",
    "tags": [
      "数据倾斜",
      "面试"
    ],
    "categoryKey": "skew",
    "faqs": [
      "Hive数据倾斜的解决方法",
      "Flink数据倾斜的解决方法"
    ],
    "pitfalls": [
      "准备不充分",
      "回答不全面"
    ],
    "examples": [
      "完整回答流程",
      "结合实际项目经验"
    ]
  }
]

module.exports = ([{'key': 'hdfs', 'name': 'HDFS'}, {'key': 'mr', 'name': 'MapReduce'}, {'key': 'yarn', 'name': 'Yarn'}, {'key': 'kafka', 'name': 'Kafka'}, {'key': 'hbase', 'name': 'HBase'}, {'key': 'hive', 'name': 'Hive'}, {'key': 'spark', 'name': 'Spark'}, {'key': 'flink', 'name': 'Flink'}, {'key': '数据仓库', 'name': '数据仓库'}, {'key': 'skew', 'name': '数据倾斜'}], [{'id': 'hdfs-topic-1', 'title': 'HDFS 常见问题 1', 'summary': 'HDFS的架构', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['HDFS的架构', 'HDFS的读写流程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hdfs-topic-2', 'title': 'HDFS 常见问题 2', 'summary': 'Secondary NameNode了解吗，它的工作机制是怎样的', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['Secondary NameNode了解吗，它的工作机制是怎样的', '简述Hadoop1.0、2.0、3.0的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hdfs-topic-3', 'title': 'HDFS 常见问题 3', 'summary': 'HDFS的读写流程', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['HDFS的读写流程', 'HDFS中，文件为什么以block块的方式存储'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hdfs-topic-4', 'title': 'HDFS 常见问题 4', 'summary': '在NameNode HA中，会出现脑裂问题吗？怎么解决脑裂', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['在NameNode HA中，会出现脑裂问题吗？怎么解决脑裂', '简述hadoop压缩和解压缩的框架'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hdfs-topic-5', 'title': 'HDFS 常见问题 5', 'summary': 'Secondary NameNode了解吗，它的工作机制是怎样的', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['Secondary NameNode了解吗，它的工作机制是怎样的', '在上传文件的时候，其中一个DataNode突然挂掉了怎么办'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hdfs-topic-6', 'title': 'HDFS 常见问题 6', 'summary': '介绍namenode宕机的数据恢复过程', 'tags': ['HDFS', '面试'], 'categoryKey': 'hdfs', 'faqs': ['介绍namenode宕机的数据恢复过程', 'NameNode在启动的时候会做哪些操作'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'mr-topic-7', 'title': 'MapReduce 常见问题 1', 'summary': '简述MapReduce整个流程', 'tags': ['MapReduce', '面试'], 'categoryKey': 'mr', 'faqs': ['简述MapReduce整个流程', 'join原理'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'mr-topic-8', 'title': 'MapReduce 常见问题 2', 'summary': '为什么MapReduce比Spark慢', 'tags': ['MapReduce', '面试'], 'categoryKey': 'mr', 'faqs': ['为什么MapReduce比Spark慢', '简述MapReduce整个流程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'mr-topic-9', 'title': 'MapReduce 常见问题 3', 'summary': 'join原理', 'tags': ['MapReduce', '面试'], 'categoryKey': 'mr', 'faqs': ['join原理', '文件切片相关问题'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'mr-topic-10', 'title': 'MapReduce 常见问题 4', 'summary': '全排序', 'tags': ['MapReduce', '面试'], 'categoryKey': 'mr', 'faqs': ['全排序', 'MapReduce实现TopK算法'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'yarn-topic-11', 'title': 'Yarn 常见问题 1', 'summary': 'Yarn的任务提交流程是怎样的', 'tags': ['Yarn', '面试'], 'categoryKey': 'yarn', 'faqs': ['Yarn的任务提交流程是怎样的', 'Yarn的资源调度机制'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'yarn-topic-12', 'title': 'Yarn 常见问题 2', 'summary': 'yarn的任务提交流程是怎样的', 'tags': ['Yarn', '面试'], 'categoryKey': 'yarn', 'faqs': ['yarn的任务提交流程是怎样的', 'yarn的资源调度的三种模型'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'yarn-topic-13', 'title': 'Yarn 常见问题 3', 'summary': '任务的推测执行（spark UI见过）', 'tags': ['Yarn', '面试'], 'categoryKey': 'yarn', 'faqs': ['任务的推测执行（spark UI见过）'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-14', 'title': 'Kafka 常见问题 1', 'summary': '简述Kafka的架构', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': ['简述Kafka的架构', '简述Kafka的分区策略'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-15', 'title': 'Kafka 常见问题 2', 'summary': 'Kafka中的数据是有序的吗，如何保证有序', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': ['Kafka中的数据是有序的吗，如何保证有序', '简述Kafka消息的存储机制'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-16', 'title': 'Kafka 常见问题 3', 'summary': 'Kafka消费方式', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': ['Kafka消费方式', 'Kafka的ISR机制是什么'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-17', 'title': 'Kafka 常见问题 4', 'summary': ' 简述kafka的架构', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': [' 简述kafka的架构', ' 命令行操作（了解）'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-18', 'title': 'Kafka 常见问题 5', 'summary': ' 简述kafka的分区策略', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': [' 简述kafka的分区策略', ' kafka是如何保证数据不丢失和数据不重复'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-19', 'title': 'Kafka 常见问题 6', 'summary': ' zookeeper在kafka中的作用有哪些', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': [' zookeeper在kafka中的作用有哪些', ' broker工作流程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-20', 'title': 'Kafka 常见问题 7', 'summary': ' kafka的数据是放在磁盘上还是内存上，为什么速度会快', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': [' kafka的数据是放在磁盘上还是内存上，为什么速度会快', ' kafka消费方式'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'kafka-topic-21', 'title': 'Kafka 常见问题 8', 'summary': ' 你知道Kafka单条日志传输大小吗', 'tags': ['Kafka', '面试'], 'categoryKey': 'kafka', 'faqs': [' 你知道Kafka单条日志传输大小吗', ' Kafka为什么同一个消费者组的消费者不能消费相同的分区'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hbase-topic-22', 'title': 'HBase 常见问题 1', 'summary': 'HBase和Hive的区别', 'tags': ['HBase', '面试'], 'categoryKey': 'hbase', 'faqs': ['HBase和Hive的区别', '简述HBase的读写流程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hbase-topic-23', 'title': 'HBase 常见问题 2', 'summary': 'HBase中compact用途是什么，什么时候触发，分为哪两种，有什么区别', 'tags': ['HBase', '面试'], 'categoryKey': 'hbase', 'faqs': ['HBase中compact用途是什么，什么时候触发，分为哪两种，有什么区别', '热点现象怎么产生的，以及解决方法有哪些'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hbase-topic-24', 'title': 'HBase 常见问题 3', 'summary': ' 简述HBase的数据模型', 'tags': ['HBase', '面试'], 'categoryKey': 'hbase', 'faqs': [' 简述HBase的数据模型', ' HBase和hive的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hbase-topic-25', 'title': 'HBase 常见问题 4', 'summary': ' 简述HBase的读写流程', 'tags': ['HBase', '面试'], 'categoryKey': 'hbase', 'faqs': [' 简述HBase的读写流程', ' HBase在写过程中的region的split时机'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hbase-topic-26', 'title': 'HBase 常见问题 5', 'summary': ' 热点现象怎么产生的，以及解决方法有哪些', 'tags': ['HBase', '面试'], 'categoryKey': 'hbase', 'faqs': [' 热点现象怎么产生的，以及解决方法有哪些', ' 说一下HBase的rowkey设计原则'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-27', 'title': 'Hive 常见问题 1', 'summary': '简述Hive', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': ['简述Hive', 'Hive和传统数据库之间的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-28', 'title': 'Hive 常见问题 2', 'summary': 'Hive的join底层实现', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': ['Hive的join底层实现', 'Order By和Sort By的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-29', 'title': 'Hive 常见问题 3', 'summary': '自定义过UDF、UDTF函数吗', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': ['自定义过UDF、UDTF函数吗', 'Hive小文件过多怎么办'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-30', 'title': 'Hive 常见问题 4', 'summary': 'Hive的元数据存储在哪里', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': ['Hive的元数据存储在哪里', ' 简述hive'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-31', 'title': 'Hive 常见问题 5', 'summary': ' hive和传统数据库之间的区别', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': [' hive和传统数据库之间的区别', ' hive的内部表和外部表的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-32', 'title': 'Hive 常见问题 6', 'summary': ' 内连接、左外连接、右外连接的区别', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': [' 内连接、左外连接、右外连接的区别', ' hive的join底层实现'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-33', 'title': 'Hive 常见问题 7', 'summary': ' 行转列和列转行函数', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': [' 行转列和列转行函数', ' grouping_sets、cube和rollup'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-34', 'title': 'Hive 常见问题 8', 'summary': ' hive3的新特性有了解过吗', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': [' hive3的新特性有了解过吗', ' hive小文件过多怎么办'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'hive-topic-35', 'title': 'Hive 常见问题 9', 'summary': ' 常用函数的补充', 'tags': ['Hive', '面试'], 'categoryKey': 'hive', 'faqs': [' 常用函数的补充'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-36', 'title': 'Spark 常见问题 1', 'summary': '简述Hadoop和Spark的不同点（为什么Spark更快）', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': ['简述Hadoop和Spark的不同点（为什么Spark更快）', '简述Spark的shuffle过程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-37', 'title': 'Spark 常见问题 2', 'summary': 'Application、Job、Stage、Task之间的关系', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': ['Application、Job、Stage、Task之间的关系', 'Spark常见的算子介绍（10个以上）'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-38', 'title': 'Spark 常见问题 3', 'summary': '宽依赖和窄依赖之间的区别', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': ['宽依赖和窄依赖之间的区别', 'Spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-39', 'title': 'Spark 常见问题 4', 'summary': 'SparkSQL的三种join实现', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': ['SparkSQL的三种join实现', 'SparkStreaming窗口函数的原理'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-40', 'title': 'Spark 常见问题 5', 'summary': ' 谈谈你对RDD的理解', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' 谈谈你对RDD的理解', ' 简述spark的shuffle过程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-41', 'title': 'Spark 常见问题 6', 'summary': ' spark driver的作用，以及client模式和cluster模式的区别', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' spark driver的作用，以及client模式和cluster模式的区别', ' 你知道Application、Job、Stage、Task他们之间的关系吗'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-42', 'title': 'Spark 常见问题 7', 'summary': ' 简述map和mapPartitions的区别', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' 简述map和mapPartitions的区别', ' 你知道重分区的相关算子吗'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-43', 'title': 'Spark 常见问题 8', 'summary': ' 简述groupByKey和reduceByKey的区别', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' 简述groupByKey和reduceByKey的区别', ' 简述reduceByKey、foldByKey、aggregateByKey、combineByKey的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-44', 'title': 'Spark 常见问题 9', 'summary': ' spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' spark为什么需要RDD持久化，持久化的方式有哪几种，他们之间的区别是什么', ' 简述spark的容错机制'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-45', 'title': 'Spark 常见问题 10', 'summary': ' spark调优', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' spark调优', ' 谈一谈RDD,DataFrame,DataSet的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-46', 'title': 'Spark 常见问题 11', 'summary': ' sparksql的三种join实现', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' sparksql的三种join实现', ' 简单介绍下sparkstreaming'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'spark-topic-47', 'title': 'Spark 常见问题 12', 'summary': ' SparkStreaming有哪几种方式消费Kafka中的数据，它们之间的区别是什么', 'tags': ['Spark', '面试'], 'categoryKey': 'spark', 'faqs': [' SparkStreaming有哪几种方式消费Kafka中的数据，它们之间的区别是什么', ' 说一下你知道的DStream转换和输出原语'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-48', 'title': 'Flink 常见问题 1', 'summary': '简单介绍一下Flink', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': ['简单介绍一下Flink', 'Flink和SparkStreaming区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-49', 'title': 'Flink 常见问题 2', 'summary': 'Connect算子和Union算子的区别', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': ['Connect算子和Union算子的区别', 'Flink的时间语义有哪几种'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-50', 'title': 'Flink 常见问题 3', 'summary': 'Flink对于迟到或者乱序数据是怎么处理的', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': ['Flink对于迟到或者乱序数据是怎么处理的', 'Flink中，有哪几种类型的状态，你知道状态后端吗'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-51', 'title': 'Flink 常见问题 4', 'summary': ' 简单介绍一下Flink', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' 简单介绍一下Flink', ' Flink和SparkStreaming区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-52', 'title': 'Flink 常见问题 5', 'summary': ' Flink的运行依赖于hadoop组件吗', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' Flink的运行依赖于hadoop组件吗', ' Flink集群有哪些角色？各自有什么作用'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-53', 'title': 'Flink 常见问题 6', 'summary': ' max算子和maxBy算子的区别', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' max算子和maxBy算子的区别', ' Connect算子和Union算子的区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-54', 'title': 'Flink 常见问题 7', 'summary': ' 谈一谈你对watermark的理解', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' 谈一谈你对watermark的理解', ' Flink对于迟到或者乱序数据是怎么处理的'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-55', 'title': 'Flink 常见问题 8', 'summary': ' Flink是如何做容错的', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' Flink是如何做容错的', ' Flink是如何保证Exactly-once语义的'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'flink-topic-56', 'title': 'Flink 常见问题 9', 'summary': ' Flink是如何支持批流一体的', 'tags': ['Flink', '面试'], 'categoryKey': 'flink', 'faqs': [' Flink是如何支持批流一体的', ' 你用过Flink CEP吗，简单介绍一下'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-57', 'title': '数据仓库 常见问题 1', 'summary': '为什么要对数据仓库分层', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': ['为什么要对数据仓库分层', '数据仓库建模的方法有哪些'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-58', 'title': '数据仓库 常见问题 2', 'summary': '维度建模中表的类型', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': ['维度建模中表的类型', '事实表的设计过程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-59', 'title': '数据仓库 常见问题 3', 'summary': ' 数据仓库是什么', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 数据仓库是什么', ' 数据仓库和数据库有什么区别'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-60', 'title': '数据仓库 常见问题 4', 'summary': ' 为什么需要数据建模', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 为什么需要数据建模', ' 经典的数据仓库建模方法论有哪些'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-61', 'title': '数据仓库 常见问题 5', 'summary': ' 派生指标的种类', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 派生指标的种类', ' 经典数仓分层架构'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-62', 'title': '数据仓库 常见问题 6', 'summary': ' 模型实施的具体步骤', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 模型实施的具体步骤', ' 维度建模有哪几种模型'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-63', 'title': '数据仓库 常见问题 7', 'summary': ' 维度表的设计过程', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 维度表的设计过程', ' 维度表的设计中有哪些值得注意的地方'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-64', 'title': '数据仓库 常见问题 8', 'summary': ' 如何处理维度的变化', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 如何处理维度的变化', ' 事实表设计的八大原则'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-65', 'title': '数据仓库 常见问题 9', 'summary': ' 事实表有哪几种类型', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 事实表有哪几种类型', ' 多事务事实表如何对事实进行处理'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': '数据仓库-topic-66', 'title': '数据仓库 常见问题 10', 'summary': ' 周期快照事实表的设计过程', 'tags': ['数据仓库', '面试'], 'categoryKey': '数据仓库', 'faqs': [' 周期快照事实表的设计过程', ' 累计快照事实表的设计过程'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'skew-topic-67', 'title': '数据倾斜 常见问题 1', 'summary': '数据倾斜的定义和原因', 'tags': ['数据倾斜', '面试'], 'categoryKey': 'skew', 'faqs': ['数据倾斜的定义和原因', 'MapReduce数据倾斜的解决方法'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}, {'id': 'skew-topic-68', 'title': '数据倾斜 常见问题 2', 'summary': 'Hive数据倾斜的解决方法', 'tags': ['数据倾斜', '面试'], 'categoryKey': 'skew', 'faqs': ['Hive数据倾斜的解决方法', 'Flink数据倾斜的解决方法'], 'pitfalls': ['准备不充分', '回答不全面'], 'examples': ['完整回答流程', '结合实际项目经验']}])
