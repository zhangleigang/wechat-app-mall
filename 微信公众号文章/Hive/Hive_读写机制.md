# Hive读写文件机制详解

## 【问题】

简述hive读写文件机制

## 【答案】

### 快速回答（3-5分钟总结）

Hive的读写文件机制核心思想是：**将结构化的数据文件映射为一张数据库表，并提供类SQL查询功能**。

**读文件机制**：
1. **解析编译**：HiveQL → 抽象语法树 → 逻辑执行计划 → 物理执行计划
2. **执行引擎**：MapReduce/Tez/Spark分布式执行
3. **读取数据**：InputFormat分片 → RecordReader读字节流 → SerDe反序列化 → Row Object

**写文件机制**：
1. **解析编译**：同读过程，生成物理执行计划
2. **执行引擎**：MapReduce/Tez/Spark执行写入任务
3. **写入数据**：Row Object → SerDe序列化 → RecordWriter写字节流 → OutputFormat → HDFS文件

**核心组件**：
- **InputFormat/OutputFormat**：定义如何读取/写入HDFS文件
- **SerDe**：序列化/反序列化器，负责字节流与Row Object的转换
- **执行引擎**：分布式执行读写和计算任务

### 详细解释

我们来简要梳理一下 Hive 的读写文件机制。

Hive 的核心思想是：**将结构化的数据文件映射为一张数据库表，并提供类 SQL（HiveQL）查询功能**。因此，它的读写机制可以清晰地分为"读"和"写"两部分。

#### 一、读文件机制

当用户执行一条 `SELECT` 查询语句时，Hive 的读取流程如下：

**1. 解析与编译**
- Hive 首先将 HiveQL 语句解析成抽象的语法树
- 然后编译器将语法树编译成逻辑执行计划
- 最终，优化器对逻辑计划进行优化，生成一个**有向无环图的物理执行计划**

**2. 执行引擎**
- 在 Hive 早期版本，执行引擎是 **MapReduce**。物理执行计划会被翻译成一系列的 MapReduce 任务
- 在现代 Hive 中，执行引擎更常用的是 **Tez** 或 **Spark**，它们能提供更优的执行效率，但核心思想类似：将任务分解并在集群上分布式执行

**3. 读取数据文件**
- **定位文件**：执行引擎（如 Map Task）根据表在 Hive Metastore 中存储的路径信息，定位到 HDFS 上的数据文件
- **使用对应的 `InputFormat`**：
  - `InputFormat`（如 `TextInputFormat`, `OrcInputFormat`）负责定义如何读取文件切片和生成记录
  - 它调用对应的 `getSplits` 方法，根据文件大小和块大小，将输入数据切分成多个**分片**。每个分片由一个 Map Task 处理
- **使用对应的 `SerDe` (Serializer/Deserializer)**：
  - `SerDe` 是 Hive 读写机制的核心
  - 在读取时，`SerDe` 充当 **`Deserializer`（反序列化器）**
  - `RecordReader`（由 `InputFormat` 创建）从 HDFS 文件中读取一行行数据（对于文本文件）或一条条记录（对于列式文件如 ORC），然后将这些**字节数据**传递给 `SerDe`
  - `SerDe` 负责将这些字节数据**反序列化**成 Hive 能够识别的、带有类型的**行对象**（`Row Object`）
  - 例如，对于一行 `"1,Alice\n"` 的文本数据，`LazySimpleSerDe` 会将其解析成 `[1, "Alice"]` 这样一个行对象

**4. 数据处理**：生成的行对象会经过后续的算子（如 Filter, Join, Group By）进行处理，最终得到查询结果。

**读取流程简化图：**
```
HDFS File → InputFormat (分片) → RecordReader (读字节流) → SerDe (反序列化) → Row Object → ... (后续计算)
```

#### 二、写文件机制

当用户执行一条 `INSERT` 或 `CREATE TABLE AS SELECT` 语句时，Hive 的写入流程如下：

**1. 解析与编译**：与读过程类似，Hive 会生成物理执行计划。

**2. 执行引擎**：同样，由 MapReduce/Tez/Spark 引擎来执行。负责写入的通常是 Reduce Task 或 Spark 的 Executor。

**3. 准备写入**
- 执行引擎根据目标表的定义，获取其存储路径、文件格式和序列化方式

**4. 写入数据文件**
- **使用对应的 `OutputFormat`**：
  - `OutputFormat`（如 `HiveIgnoreKeyTextOutputFormat`, `OrcOutputFormat`）负责定义如何写入文件
  - 它创建一个 `RecordWriter` 对象来负责实际的写操作
- **使用对应的 `SerDe`**：
  - 在写入时，`SerDe` 充当 **`Serializer`（序列化器）**
  - 执行引擎将处理好的**行对象**传递给 `SerDe`
  - `SerDe` 负责将这些行对象**序列化**成字节数组。这个字节数组的格式由文件格式决定（例如，对于文本文件，就是一行文本；对于 ORC 文件，就是按列式组织压缩的二进制数据）
- `RecordWriter` 将 `SerDe` 序列化后的字节数据写入到 HDFS 的一个临时文件中

**5. 文件提交**
- 所有任务完成后，Hive 会将各个 Task 写入的临时文件**移动**到目标表的正式目录下，完成整个写入操作

**写入流程简化图：**
```
Row Object → SerDe (序列化) → 字节数组 → RecordWriter (写字节流) → OutputFormat → HDFS Temporary File → (提交) → HDFS Final File
```

#### 核心组件总结

| 组件 | 在读过程中的角色 | 在写过程中的角色 |
| :--- | :--- | :--- |
| **`InputFormat`** | 定义如何**读取和分片**HDFS数据文件。 | - |
| **`OutputFormat`** | - | 定义如何**写入**数据到HDFS文件。 |
| **`SerDe`** | **反序列化**：将文件中的字节流转换成 Hive 行对象。 | **序列化**：将 Hive 行对象转换成要写入文件的字节流。 |
| **执行引擎** | 分布式执行读取和计算任务。 | 分布式执行计算和写入任务。 |
| **Hive Metastore** | 提供表的元数据，如** schema**、**文件路径**、**文件格式**、**SerDe** 类型等。 |

#### 示例

假设有一张表，存储格式为 TEXTFILE，使用 `LazySimpleSerDe`：

- **读**：`InputFormat` 将文件按行分片，`RecordReader` 读取一行 `"100,ProductA,19.99\n"`，`LazySimpleSerDe` 根据表结构 `(id int, name string, price double)` 将其反序列化为行对象 `[100, "ProductA", 19.99]`。
- **写**：Hive 需要写入一行数据 `[200, "ProductB", 29.99]`，`LazySimpleSerDe` 将其序列化为字节 `"200,ProductB,29.99\n"`，然后 `OutputFormat` 的 `RecordWriter` 将这行文本写入 HDFS 文件。

通过这种机制，Hive 成功地将复杂的分布式文件读写操作封装起来，让用户能够用熟悉的 SQL 语言来操作海量数据。

## 【引流引导】

想要在大数据面试中脱颖而出？掌握Hive的核心机制只是第一步！

我们的**AI面试助手小程序**为你提供：
- 🎯 **智能简历分析**：AI深度解读你的简历亮点，提供专业优化建议
- 📚 **海量题库**：涵盖Hive、Spark、Flink等10+技术栈的精选面试题
- 🤖 **AI模拟面试**：真实面试场景模拟，让你提前适应面试节奏
- 💡 **个性化学习路径**：根据你的技术背景定制专属学习计划

不要让技术细节成为你面试路上的绊脚石，让AI助手帮你系统梳理知识点，轻松应对各种技术面试！

立即体验，开启你的大数据职业新篇章！