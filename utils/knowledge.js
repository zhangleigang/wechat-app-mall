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
    "tags": ["HDFS","面试"],
    "categoryKey": "hdfs",
    "faqs": ["HDFS的架构","HDFS的读写流程"],
    "answers": ["HDFS采用主从架构，由NameNode和DataNode组成。NameNode负责管理文件系统的命名空间、元数据信息和客户端的读写请求；DataNode负责存储实际的数据块，并根据NameNode的指令执行数据块的创建、删除和复制操作。","HDFS写流程：1.客户端向NameNode请求上传文件 2.NameNode检查文件是否存在并返回可用的DataNode列表 3.客户端直接与DataNode通信进行数据写入 4.DataNode之间进行数据复制 5.写入完成后通知NameNode。\n\nHDFS读流程：1.客户端向NameNode请求下载文件 2.NameNode返回文件的数据块位置信息 3.客户端直接与相应的DataNode通信读取数据。"],
    "examples": []
  },
  {
    "id": "hdfs-topic-2",
    "title": "HDFS 常见问题 2",
    "summary": "小文件过多有什么危害，你知道的解决办法有哪些",
    "tags": ["HDFS","面试"],
    "categoryKey": "hdfs",
    "faqs": ["小文件过多有什么危害，你知道的解决办法有哪些","Secondary NameNode了解吗，它的工作机制是怎样的"],
    "answers": ["小文件过多的危害：1.占用大量NameNode内存 2.降低HDFS的吞吐量 3.影响MapReduce任务的效率。\n\n解决办法：1.使用Hadoop Archive(Har)合并小文件 2.使用SequenceFile或Avro文件格式 3.调整块大小 4.使用CombineFileInputFormat 5.采用小文件预处理策略。","Secondary NameNode是NameNode的一个辅助节点，主要负责合并NameNode的编辑日志和镜像文件，减轻NameNode的负担。它定期从NameNode获取FsImage和Edits文件，合并成新的FsImage，然后发送回NameNode。但它不是NameNode的热备份，不直接参与NameNode的故障恢复。"],
    "examples": []
  },
  {
    "id": "hdfs-topic-3",
    "title": "HDFS 常见问题 3",
    "summary": "简述Hadoop1.0、2.0、3.0的区别",
    "tags": ["HDFS","面试"],
    "categoryKey": "hdfs",
    "faqs": ["简述Hadoop1.0、2.0、3.0的区别"],
    "answers": ["Hadoop 1.0：包含HDFS和MapReduce两个核心组件，MapReduce同时负责资源管理和计算任务调度。\n\nHadoop 2.0：引入YARN作为资源管理系统，将MapReduce拆分为MapReduce计算引擎和YARN资源管理器，支持多种计算框架如Spark、Tez等；引入了NameNode联邦和高可用机制。\n\nHadoop 3.0：支持更多节点的集群规模；引入Erasure Coding存储策略替代多副本；支持多NameNode架构；优化了MapReduce性能；支持GPU等异构计算设备。"],
    "examples": []
  },
  {
    "id": "mr-topic-4",
    "title": "MapReduce 常见问题 1",
    "summary": "简述MapReduce整个流程",
    "tags": ["MapReduce","面试"],
    "categoryKey": "mr",
    "faqs": ["简述MapReduce整个流程","join原理"],
    "answers": ["MapReduce整个流程包括：\n1. InputFormat：将输入数据分割成逻辑切片并生成RecordReader\n2. Mapper：对输入数据进行映射处理，生成中间键值对\n3. Shuffle：包括排序、合并、分区等操作，将Mapper输出数据传输给Reducer\n4. Reducer：对中间键值对进行归约处理，生成最终结果\n5. OutputFormat：将Reducer输出写入到存储系统。","Join原理：在MapReduce中实现Join主要有三种方式：\n1. Reduce Side Join：最通用但效率较低，在Reducer阶段进行连接\n2. Map Side Join：适用于一个小表和一个大表的情况，将小表加载到内存中，在Mapper阶段进行连接\n3. SemiJoin：通过广播小表的键来减少网络传输数据量，在Mapper阶段过滤大表数据。"],
    "examples": []
  },
  {
    "id": "mr-topic-5",
    "title": "MapReduce 常见问题 2",
    "summary": "MapReduce的shuffle过程",
    "tags": ["MapReduce","面试"],
    "categoryKey": "mr",
    "faqs": ["MapReduce的shuffle过程","为什么MapReduce比Spark慢"],
    "answers": ["MapReduce的shuffle过程包括：\n1. Mapper端：排序、分区、合并(combiner)、压缩，然后写入内存缓冲区\n2. 当缓冲区达到阈值时，溢出写入磁盘形成溢写文件\n3. 对多个溢写文件进行合并排序\n4. Reducer端：拉取数据(fetch)、合并(merge)、排序\n5. 将处理后的数据交给Reducer处理。","MapReduce比Spark慢的主要原因：\n1. MapReduce基于磁盘存储中间结果，而Spark基于内存\n2. MapReduce任务之间存在多次数据落地，导致I/O开销大\n3. Spark的DAG执行引擎能够优化任务执行计划\n4. Spark提供了更丰富的操作算子和更灵活的计算模型\n5. Spark的缓存机制减少了重复计算。"],
    "examples": []
  },
  {
    "id": "yarn-topic-6",
    "title": "Yarn 常见问题 1",
    "summary": "YARN的架构",
    "tags": ["Yarn","面试"],
    "categoryKey": "yarn",
    "faqs": ["YARN的架构"],
    "answers": ["YARN架构主要包含三个核心组件：\n1. ResourceManager(RM)：全局资源管理器，负责整个集群的资源分配和管理\n2. NodeManager(NM)：节点资源管理器，负责单个节点的资源管理和任务监控\n3. ApplicationMaster(AM)：应用程序管理器，负责与RM协商资源并与NM通信来执行具体任务。\n\nYARN的工作流程：客户端提交应用→RM分配资源并启动AM→AM向RM申请资源→RM分配资源→AM与NM通信启动任务→NM监控任务执行→任务完成后释放资源。"],
    "examples": []
    }
]

module.exports = {
  categories,
  topics
}