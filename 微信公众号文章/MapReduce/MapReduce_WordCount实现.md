# 【问题】手写wordcount

## 【答案】

### 3-5分钟快速回答要点：

WordCount是MapReduce的经典入门案例，实现思路：
1. **Map阶段**：将文本按行读取，分割成单词，输出(word, 1)键值对
2. **Shuffle阶段**：框架自动将相同单词的键值对分组
3. **Reduce阶段**：对每个单词的所有计数进行累加
4. **输出**：得到每个单词的总出现次数

核心是利用MapReduce的分组机制，将分布式计数问题转化为简单的累加操作。

---

### 详细技术解析

#### 一、WordCount程序结构

一个完整的MapReduce WordCount程序包含三个核心组件：

```
WordCount程序结构：
├── WordCountMapper.java    # Map阶段实现
├── WordCountReducer.java   # Reduce阶段实现
└── WordCountDriver.java    # 作业配置和提交
```

#### 二、Map阶段实现

**核心任务：** 将输入文本分割成单词，为每个单词生成计数1

```java
import java.io.IOException;
import java.util.StringTokenizer;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class WordCountMapper extends Mapper<LongWritable, Text, Text, IntWritable> {
    
    // 可重用的对象，避免频繁创建，提高性能
    private final static IntWritable one = new IntWritable(1);
    private Text word = new Text();
    
    @Override
    protected void map(LongWritable key, Text value, Context context) 
            throws IOException, InterruptedException {
        
        // 转换为小写并创建分词器
        String line = value.toString().toLowerCase();
        StringTokenizer tokenizer = new StringTokenizer(line);
        
        // 遍历每个单词
        while (tokenizer.hasMoreTokens()) {
            String currentWord = tokenizer.nextToken();
            
            // 简单的清理：移除标点符号
            currentWord = currentWord.replaceAll("[^a-zA-Z0-9]", "");
            
            // 过滤空字符串
            if (!currentWord.isEmpty()) {
                word.set(currentWord);
                // 输出 (单词, 1) 键值对
                context.write(word, one);
            }
        }
    }
}
```

**关键技术点：**

1. **输入参数解析**
   - `LongWritable key`: 行在文件中的字节偏移量
   - `Text value`: 当前行的文本内容
   - `Context context`: 用于输出结果的上下文

2. **性能优化**
   - 使用静态final对象避免重复创建
   - 预先转换为小写统一处理
   - 简单的文本清理去除标点符号

3. **输出格式**
   - Key: Text类型的单词
   - Value: IntWritable类型的计数(固定为1)

#### 三、Reduce阶段实现

**核心任务：** 接收相同单词的所有计数，进行累加求和

```java
import java.io.IOException;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class WordCountReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
    
    private IntWritable result = new IntWritable();
    
    @Override
    protected void reduce(Text key, Iterable<IntWritable> values, Context context)
            throws IOException, InterruptedException {
        
        int sum = 0;
        
        // 累加所有的计数值
        for (IntWritable value : values) {
            sum += value.get();
        }
        
        // 设置结果并输出
        result.set(sum);
        context.write(key, result);
    }
}
```

**关键技术点：**

1. **输入参数解析**
   - `Text key`: 单词（经过Shuffle后的分组键）
   - `Iterable<IntWritable> values`: 该单词的所有计数值列表
   - `Context context`: 输出上下文

2. **聚合逻辑**
   - 简单的累加操作
   - 利用增强for循环遍历所有值

3. **输出格式**
   - Key: 单词
   - Value: 该单词的总出现次数

#### 四、Driver程序实现

**核心任务：** 配置作业参数并提交到集群执行

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.input.TextInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.mapreduce.lib.output.TextOutputFormat;

public class WordCountDriver {
    
    public static void main(String[] args) throws Exception {
        
        // 检查命令行参数
        if (args.length != 2) {
            System.err.println("Usage: WordCount <input path> <output path>");
            System.exit(-1);
        }
        
        // 创建配置对象
        Configuration conf = new Configuration();
        
        // 创建作业对象
        Job job = Job.getInstance(conf, "word count");
        job.setJarByClass(WordCountDriver.class);
        
        // 设置Mapper和Reducer类
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        
        // 设置Combiner（可选，用于本地聚合）
        job.setCombinerClass(WordCountReducer.class);
        
        // 设置输出键值类型
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        
        // 设置输入输出格式
        job.setInputFormatClass(TextInputFormat.class);
        job.setOutputFormatClass(TextOutputFormat.class);
        
        // 设置输入输出路径
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        
        // 提交作业并等待完成
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}
```

**关键配置说明：**

1. **作业基本信息**
   - 作业名称：便于在集群中识别
   - JAR文件类：告诉Hadoop在哪里找到程序

2. **组件配置**
   - Mapper类和Reducer类的指定
   - Combiner的使用（提高性能）

3. **数据类型配置**
   - 输出键值对的数据类型声明
   - 输入输出格式的指定

#### 五、完整的执行流程

```mermaid
graph TD
    A[输入文件] --> B[InputFormat切分]
    B --> C[Map任务1: hello world]
    B --> D[Map任务2: hello hadoop]
    B --> E[Map任务3: world peace]
    
    C --> F[输出: hello,1 world,1]
    D --> G[输出: hello,1 hadoop,1]
    E --> H[输出: world,1 peace,1]
    
    F --> I[Shuffle & Sort]
    G --> I
    H --> I
    
    I --> J[Reduce任务1: hello,[1,1]]
    I --> K[Reduce任务2: world,[1,1]]
    I --> L[Reduce任务3: hadoop,[1] peace,[1]]
    
    J --> M[输出: hello,2]
    K --> N[输出: world,2]
    L --> O[输出: hadoop,1 peace,1]
    
    M --> P[最终结果文件]
    N --> P
    O --> P
```

#### 六、性能优化版本

**1. 使用Combiner优化**

```java
// 在Driver中添加
job.setCombinerClass(WordCountReducer.class);
```

Combiner的作用：
- 在Map端本地预聚合
- 减少网络传输数据量
- 提高整体性能

**2. 自定义分区器**

```java
public class WordCountPartitioner extends Partitioner<Text, IntWritable> {
    @Override
    public int getPartition(Text key, IntWritable value, int numPartitions) {
        // 根据单词首字母分区
        char firstChar = key.toString().charAt(0);
        if (firstChar >= 'a' && firstChar <= 'm') {
            return 0 % numPartitions;
        } else {
            return 1 % numPartitions;
        }
    }
}
```

**3. 内存优化的Mapper**

```java
public class OptimizedWordCountMapper extends Mapper<LongWritable, Text, Text, IntWritable> {
    
    private Map<String, Integer> wordCounts = new HashMap<>();
    private Text word = new Text();
    private IntWritable count = new IntWritable();
    
    @Override
    protected void map(LongWritable key, Text value, Context context) 
            throws IOException, InterruptedException {
        
        String line = value.toString().toLowerCase();
        String[] words = line.split("\\W+");
        
        // 在内存中累计计数
        for (String w : words) {
            if (!w.isEmpty()) {
                wordCounts.put(w, wordCounts.getOrDefault(w, 0) + 1);
            }
        }
    }
    
    @Override
    protected void cleanup(Context context) throws IOException, InterruptedException {
        // 在cleanup中批量输出
        for (Map.Entry<String, Integer> entry : wordCounts.entrySet()) {
            word.set(entry.getKey());
            count.set(entry.getValue());
            context.write(word, count);
        }
    }
}
```

#### 七、编译和运行

**1. 编译程序**

```bash
# 设置Hadoop环境变量
export HADOOP_CLASSPATH=$JAVA_HOME/lib/tools.jar

# 编译Java文件
hadoop com.sun.tools.javac.Main WordCount*.java

# 创建JAR文件
jar cf wordcount.jar WordCount*.class
```

**2. 准备输入数据**

```bash
# 创建输入目录
hdfs dfs -mkdir /input

# 上传测试文件
hdfs dfs -put input.txt /input/
```

**3. 运行程序**

```bash
# 运行WordCount程序
hadoop jar wordcount.jar WordCountDriver /input /output

# 查看结果
hdfs dfs -cat /output/part-r-00000
```

#### 八、测试用例

**输入文件内容：**
```
Hello World
Hello Hadoop
World Peace
Hadoop MapReduce
```

**预期输出：**
```
hadoop  2
hello   2
mapreduce   1
peace   1
world   2
```

#### 九、常见问题和解决方案

**1. 输出目录已存在错误**
```bash
# 删除输出目录
hdfs dfs -rm -r /output
```

**2. 内存不足问题**
```bash
# 调整Map任务内存
-Dmapreduce.map.memory.mb=2048
-Dmapreduce.map.java.opts=-Xmx1638m
```

**3. 小文件过多问题**
```bash
# 合并小文件
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-archive-*.jar \
  -archiveName input.har -p /input /har_input
```

#### 十、扩展应用

**1. 词频统计增强版**
- 过滤停用词
- 支持多种文件格式
- 添加词长过滤

**2. Top-K热词统计**
- 结合二次排序
- 使用TreeMap维护Top-K

**3. 分布式grep**
- 修改Mapper逻辑
- 添加正则表达式匹配

### 总结

WordCount虽然简单，但完美展示了MapReduce的核心思想：
1. **分而治之**：将大文件分割成小块并行处理
2. **键值抽象**：通过键值对统一数据表示
3. **自动分组**：框架自动将相同键的数据聚合
4. **容错机制**：任务失败时自动重试

掌握WordCount的实现原理，是理解更复杂MapReduce算法的基础。

## 【引流引导】

想要深入学习大数据技术栈？我们的AI面试助手小程序提供：
- 📚 完整的HDFS、MapReduce、Spark等技术知识库
- 🤖 AI驱动的简历分析和面试指导  
- 💡 真实面试题目和详细解答
- 🎯 个性化学习路径规划

扫描下方二维码，开启你的大数据学习之旅！让AI助手帮你在技术面试中脱颖而出！

*专业的技术，简单的学习方式*