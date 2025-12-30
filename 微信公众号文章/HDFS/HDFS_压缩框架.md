# 简述hadoop压缩和解压缩的框架

## 【问题】
简述hadoop压缩和解压缩的框架

## 【答案】

### 3-5分钟快速回答要点：
Hadoop压缩框架核心是**Codec（编解码器）**设计，提供统一的可插拔接口。主要组件包括：**CompressionCodec接口**（定义压缩/解压操作）、**Compressor/Decompressor**（实际执行压缩计算）、**CompressionCodecFactory**（自动发现和路由）。支持Gzip、Snappy、Bzip2等多种格式，通过文件扩展名自动选择编解码器，对应用透明。

### 详细解析：

好的，我们来简述 Hadoop 的压缩和解压缩框架。

Hadoop 的压缩框架核心设计思想是 **"Codec（编解码器）"**，它提供了一套统一的、可插拔的接口，使得 Hadoop 生态系统中的各个组件（如 MapReduce、Hive、Spark 等）可以无缝地使用各种压缩算法。

#### 核心框架组件

**1. `CompressionCodec` 接口**
- 这是整个框架的基石。它定义了压缩和解压缩所需的基本操作。
- 一个实现了 `CompressionCodec` 的类就代表了一种压缩格式（如 Gzip、Snappy 等）。
- 主要方法包括：
  - `createOutputStream(OutputStream out)`：创建一个用于**压缩**数据的输出流。你向这个流写入数据，它会把压缩后的数据写入底层的 `out` 流。
  - `createInputStream(InputStream in)`：创建一个用于**解压缩**数据的输入流。你从这个流读取数据，它会从底层的 `in` 流读取并自动解压。
  - `getCompressorType()` / `getDecompressorType()`：获取对应的压缩器/解压器类型。

**2. `Compressor` 和 `Decompressor` 接口**
- 它们是实际执行压缩和解压缩计算的核心单元。
- `CompressionCodec` 的流对象内部会使用这些组件来处理数据块。
- Hadoop 提供了一个**对象池** (`CodecPool`) 来重用这些昂贵的 `Compressor` 和 `Decompressor` 对象，以避免频繁创建和销毁的开销，从而提升性能。

**3. `CompressionCodecFactory` 类**
- 这是一个**自动发现和路由**的工厂类。
- 它通过文件的**扩展名**（如 `.gz`, `.snappy`, `.lzo`）来推断应该使用哪种 `CompressionCodec`。
- 例如，当你尝试打开一个名为 `data.gz` 的文件时，Hadoop 会通过这个工厂类自动找到并返回 `GzipCodec`，后续的读取操作就会自动进行解压。

#### 工作流程简述

**压缩（写入文件）：**
1. Hadoop 作业（如 MapReduce）或应用指定输出要使用某种压缩（例如，设置 `mapreduce.output.fileoutputformat.compress.codec` 为 `org.apache.hadoop.io.compress.SnappyCodec`）。
2. 当 Task 需要写数据到 HDFS 时，HDFS 的 `FSDataOutputStream` 会被包装。
3. `CompressionCodecFactory` 根据配置找到对应的 `SnappyCodec`。
4. 调用 `SnappyCodec.createOutputStream(hdfsOutputStream)`，得到一个 `CompressionOutputStream`。
5. 应用将数据写入这个 `CompressionOutputStream`，数据在流中被压缩，然后写入底层的 HDFS 文件。
6. 最终在 HDFS 上生成的文件是 `.snappy` 格式的。

**解压缩（读取文件）：**
1. Hadoop 作业或应用尝试读取一个 HDFS 文件（例如 `input.snappy`）。
2. HDFS 的 `FSDataInputStream` 会被创建。
3. `CompressionCodecFactory` 根据文件扩展名 `.snappy` 自动找到 `SnappyCodec`。
4. 调用 `SnappyCodec.createInputStream(hdfsInputStream)`，得到一个 `CompressionInputStream`。
5. 应用从这个 `CompressionInputStream` 读取数据，流会自动从底层 HDFS 文件读取数据并解压，然后返回明文字节给应用。
6. 整个过程对上层应用是透明的，应用就像在读取一个普通未压缩文件一样。

#### 支持的常见编解码器（Codec）

| 压缩格式 | Hadoop Codec 类名 | 文件扩展名 | 是否可切分 |
|:---|:---|:---|:---|
| **DEFLATE** | `org.apache.hadoop.io.compress.DefaultCodec` | `.deflate` | 否 |
| **Gzip** | `org.apache.hadoop.io.compress.GzipCodec` | `.gz` | 否 |
| **Bzip2** | `org.apache.hadoop.io.compress.BZip2Codec` | `.bz2` | **是** |
| **LZ4** | `org.apache.hadoop.io.compress.Lz4Codec` | `.lz4` | 否 |
| **Snappy** | `org.apache.hadoop.io.compress.SnappyCodec` | `.snappy` | 否 |

**关于"是否可切分"**：这是 Hadoop 压缩中一个非常重要的概念。如果一个压缩格式**不可切分**（如 Gzip、Snappy），整个文件必须由一个 Mapper 处理，无法发挥 MapReduce 的并行优势。而**可切分**的格式（如 Bzip2）允许 Hadoop 将文件逻辑地分割成多个块，每个块可以由不同的 Mapper 并行处理。为了克服不可切分格式的缺点，通常会结合使用**容器格式**，如 **SequenceFile** 或 **ORC/Parquet**，它们内部可以对数据块进行压缩，同时保持文件整体的可切分性。

#### 总结

Hadoop 的压缩框架通过 **`CompressionCodec` 接口**、**`CompressionCodecFactory` 工厂类** 和 **`Compressor/Decompressor` 核心组件**，构建了一个高度抽象和可扩展的架构。它实现了：

- **对应用透明**：通过文件扩展名自动选择编解码器。
- **算法可插拔**：可以轻松地添加新的压缩算法支持。
- **高性能**：通过对象池重用压缩器。
- **生态整合**：与 HDFS、MapReduce、Hive、Spark 等核心组件深度集成。

这使得用户在选择和使用压缩时，只需关注压缩比、速度和是否可切分等业务属性，而无需关心底层复杂的实现细节。

## 【引流引导】

想要深入学习大数据技术栈？我们的AI面试助手小程序为你提供：
- 📚 完整的HDFS、Spark、Flink等技术知识库
- 🤖 AI驱动的简历分析和面试指导  
- 💡 真实面试题目和详细解答
- 🎯 个性化的学习路径规划

扫描下方二维码，开启你的大数据学习之旅！

*让AI助力你的技术成长，面试不再是难题！*